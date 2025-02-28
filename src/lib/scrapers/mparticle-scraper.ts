import { BaseScraper } from './base-scraper';
import { CDP } from '../types/cdp';
import * as cheerio from 'cheerio';
import { ActivityLogger } from '../utils/activity-logger';

export class MParticleScraper extends BaseScraper {
  constructor() {
    super(CDP.MPARTICLE, 'https://docs.mparticle.com');
  }

  async scrape(): Promise<void> {
    try {
      ActivityLogger.logActivity('SCRAPE_START', {
        cdp: CDP.MPARTICLE,
        timestamp: this.currentTime,
        user: this.currentUser
      });

      // Get all documentation URLs
      const urls = await this.fetchDocumentationUrls();
      
      for (const url of urls) {
        if (!(await this.documentExists(url))) {
          const html = await this.fetchPage(url);
          const { title, content } = this.extractContent(html);
          await this.saveDocument(title, content, url);
        }
      }

      ActivityLogger.logActivity('SCRAPE_COMPLETE', {
        cdp: CDP.MPARTICLE,
        timestamp: this.currentTime,
        user: this.currentUser,
        urlsProcessed: urls.length
      });
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'mparticle_scrape',
        cdp: CDP.MPARTICLE,
        timestamp: this.currentTime,
        user: this.currentUser
      });
      throw error;
    }
  }

  private extractContent(html: string): { title: string; content: string } {
    const $ = cheerio.load(html);
    
    // Remove navigation and unnecessary elements
    $('.navigation, .header, .footer, script, style').remove();

    const title = $('h1').first().text().trim() || 
                 $('title').text().trim() ||
                 'Untitled Document';

    const content = $('.docs-content, article, .main-content')
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    this.logScrapingProgress('Document extracted', {
      title,
      contentLength: content.length
    });

    return { 
      title: title || 'Untitled Document',
      content: content || 'No content available'
    };
  }

  private async fetchDocumentationUrls(): Promise<string[]> {
    const mainPageHtml = await this.fetchPage(this.baseUrl);
    const $ = cheerio.load(mainPageHtml);
    const urls = new Set<string>();

    // Find all documentation links
    $('a[href*="/docs/"], a[href*="/guides/"], a[href*="/reference/"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const url = href.startsWith('http') 
          ? href 
          : new URL(href, this.baseUrl).toString();
        urls.add(url);
      }
    });

    this.logScrapingProgress('Documentation URLs found', {
      urlCount: urls.size
    });

    return Array.from(urls);
  }
}