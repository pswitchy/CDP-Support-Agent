import { CDP } from '../types/cdp';
import { BaseScraper } from './base-scraper';
import * as cheerio from 'cheerio';
import { ActivityLogger } from '../utils/activity-logger';
import { SYSTEM_CONSTANTS } from '../utils/constants';

export class LyticsScraper extends BaseScraper {
  constructor() {
    super(CDP.LYTICS, 'https://learn.lytics.com');
  }

  async scrape(): Promise<void> {
    try {
      ActivityLogger.logActivity('SCRAPE_START', {
        cdp: CDP.LYTICS,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER
      });

      const docUrls = await this.getDocumentationUrls();
      let processedCount = 0;
      
      for (const url of docUrls) {
        try {
          if (await this.documentExists(url)) {
            continue;
          }

          const html = await this.fetchPage(url);
          const { title, content } = this.extractContent(html);
          await this.saveDocument(title, content, url);
          processedCount++;

          this.logScrapingProgress('Document processed', {
            url,
            title,
            contentLength: content.length
          });
        } catch (error) {
          ActivityLogger.logError(error as Error, {
            operation: 'process_document',
            url,
            cdp: CDP.LYTICS,
            timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
            user: SYSTEM_CONSTANTS.CURRENT_USER
          });
          // Continue with next URL even if one fails
          continue;
        }
      }

      ActivityLogger.logActivity('SCRAPE_COMPLETE', {
        cdp: CDP.LYTICS,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        totalUrls: docUrls.length,
        processedDocs: processedCount
      });
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        cdp: CDP.LYTICS,
        operation: 'scrape',
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER
      });
      throw error;
    }
  }

  private extractContent(html: string): { title: string; content: string } {
    const $ = cheerio.load(html);
    
    // Remove navigation and unnecessary elements
    $('.header, .footer, .sidebar, .nav').remove();
    $('script, style').remove();

    const title = $('h1').first().text().trim() || 
                 $('title').text().trim().replace(' | Lytics Docs', '') ||
                 'Untitled Document';

    const content = $('.documentation-content, .main-content, article')
      .text()
      .replace(/\s+/g, ' ')
      .trim() || 'No content available';

    this.logScrapingProgress('Content extracted', {
      title,
      contentLength: content.length,
      timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
      user: SYSTEM_CONSTANTS.CURRENT_USER
    });

    return { title, content };
  }

  private async getDocumentationUrls(): Promise<string[]> {
    try {
      const sitemapUrl = `${this.baseUrl}/sitemap.xml`;
      const sitemap = await this.fetchPage(sitemapUrl);
      const $ = cheerio.load(sitemap, { xmlMode: true });

      const urls = $('loc')
        .map((_, element) => $(element).text())
        .get()
        .filter(url => 
          url.includes('/docs/') && 
          !url.includes('/api/') && 
          !url.includes('/changelog/')
        );

      this.logScrapingProgress('Documentation URLs found', {
        urlCount: urls.length,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER
      });

      return urls;
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'get_documentation_urls',
        cdp: CDP.LYTICS,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER
      });
      return [];
    }
  }
}