import { CDP } from '../types/cdp';
import { BaseScraper } from './base-scraper';
import * as cheerio from 'cheerio';
import { ActivityLogger } from '../utils/activity-logger';
import { SYSTEM_CONSTANTS } from '../utils/constants';

export class ZeotapScraper extends BaseScraper {
  constructor() {
    super(CDP.ZEOTAP, 'https://docs.zeotap.com');
  }

  async scrape(): Promise<void> {
    try {
      ActivityLogger.logActivity('SCRAPE_START', {
        cdp: CDP.ZEOTAP,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER
      });

      const mainPageUrls = await this.getMainPageUrls();
      this.logScrapingProgress('Main pages found', { 
        count: mainPageUrls.length 
      });

      const docUrls = await this.getAllDocumentationUrls(mainPageUrls);
      this.logScrapingProgress('Documentation URLs found', { 
        count: docUrls.length 
      });

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
            cdp: CDP.ZEOTAP,
            timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
            user: SYSTEM_CONSTANTS.CURRENT_USER
          });
          // Continue with next URL even if one fails
          continue;
        }
      }

      ActivityLogger.logActivity('SCRAPE_COMPLETE', {
        cdp: CDP.ZEOTAP,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        totalUrls: docUrls.length,
        processedDocs: processedCount
      });
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        cdp: CDP.ZEOTAP,
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
    $('.navigation, .footer, .sidebar, .menu').remove();
    $('script, style').remove();

    const title = $('h1').first().text().trim() || 
                 $('title').text().trim().replace(' - Zeotap Documentation', '') ||
                 'Untitled Document';

    const content = $('.content, .article-content, main')
      .text()
      .replace(/\s+/g, ' ')
      .trim() || 'No content available';

    this.logScrapingProgress('Content extracted', {
      title,
      contentLength: content.length
    });

    return { title, content };
  }

  private async getMainPageUrls(): Promise<string[]> {
    try {
      const html = await this.fetchPage(this.baseUrl);
      const $ = cheerio.load(html);
      const urls = new Set<string>();
      
      $('a[href*="/docs/"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const url = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
          urls.add(url);
        }
      });

      return Array.from(urls);
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'get_main_pages',
        cdp: CDP.ZEOTAP,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER
      });
      return [];
    }
  }

  private async getAllDocumentationUrls(mainPages: string[]): Promise<string[]> {
    const allUrls = new Set<string>();

    for (const url of mainPages) {
      try {
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);
        
        $('a[href*="/docs/"]').each((_, element) => {
          const href = $(element).attr('href');
          if (href && !href.includes('/api/') && !href.includes('/changelog/')) {
            const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
            allUrls.add(fullUrl);
          }
        });

        this.logScrapingProgress('Page processed for URLs', {
          page: url,
          newUrlsFound: allUrls.size
        });
      } catch (error) {
        ActivityLogger.logError(error as Error, {
          operation: 'get_page_urls',
          url,
          cdp: CDP.ZEOTAP,
          timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
          user: SYSTEM_CONSTANTS.CURRENT_USER
        });
        // Continue with next page even if one fails
        continue;
      }
    }

    return Array.from(allUrls);
  }
}