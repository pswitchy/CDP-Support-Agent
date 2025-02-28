import { CDP } from '../types/cdp';
import { BaseScraper } from './base-scraper';
import * as cheerio from 'cheerio';
import { ActivityLogger } from '../utils/activity-logger';

export class SegmentScraper extends BaseScraper {
  constructor() {
    super(CDP.SEGMENT, 'https://segment.com/api/docs');
  }

  async scrape(): Promise<void> {
    try {
      ActivityLogger.logActivity('SCRAPE_START', {
        cdp: CDP.SEGMENT,
        timestamp: this.currentTime,
        user: this.currentUser
      });

      // First try the API docs
      try {
        const apiDocs = await this.fetchPage(`${this.baseUrl}/reference`);
        await this.processApiDocs(apiDocs);
      } catch (error) {
        ActivityLogger.logError(error as Error, {
          operation: 'fetch_api_docs',
          cdp: CDP.SEGMENT,
          timestamp: this.currentTime,
          user: this.currentUser
        });
      }

      // Try alternative documentation sources
      const alternativeSources = [
        'https://segment.com/api/docs',
        'https://segment.com/api/reference',
        'https://segment.com/docs/api'
      ];

      for (const source of alternativeSources) {
        try {
          const html = await this.fetchPage(source);
          const { title, content } = this.extractContent(html);
          if (content && content.length > 100) { // Minimum content validation
            await this.saveDocument(title, content, source);
          }
        } catch (error) {
          ActivityLogger.logError(error as Error, {
            operation: 'fetch_alternative_source',
            url: source,
            cdp: CDP.SEGMENT,
            timestamp: this.currentTime,
            user: this.currentUser
          });
          continue;
        }
      }

      ActivityLogger.logActivity('SCRAPE_COMPLETE', {
        cdp: CDP.SEGMENT,
        timestamp: this.currentTime,
        user: this.currentUser
      });
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        cdp: CDP.SEGMENT,
        operation: 'scrape',
        timestamp: this.currentTime,
        user: this.currentUser
      });
      throw error;
    }
  }

  private async processApiDocs(html: string): Promise<void> {
    const $ = cheerio.load(html);
    const sections = $('.documentation-section, .api-section, .reference-section').toArray();

    // Process sections sequentially
    for (const section of sections) {
      const $section = $(section);
      const title = $section.find('h1, h2').first().text().trim();
      const content = $section.text().trim();

      if (title && content) {
        try {
          const url = `${this.baseUrl}/reference#${title.toLowerCase().replace(/\s+/g, '-')}`;
          
          if (!(await this.documentExists(url))) {
            await this.saveDocument(title, content, url);
            
            this.logScrapingProgress('API section processed', {
              title,
              contentLength: content.length,
              url
            });
          }
        } catch (error) {
          ActivityLogger.logError(error as Error, {
            operation: 'process_api_section',
            title,
            cdp: CDP.SEGMENT,
            timestamp: this.currentTime,
            user: this.currentUser
          });
        }
      }
    }
  }

  private extractContent(html: string): { title: string; content: string } {
    const $ = cheerio.load(html);
    
    // Remove unnecessary elements
    $('nav, header, footer, script, style').remove();

    const title = $('h1').first().text().trim() || 
                 $('title').text().trim() ||
                 'Segment Documentation';

    const content = $('.documentation, .content, main')
      .text()
      .replace(/\s+/g, ' ')
      .trim() || 'Documentation content not available';

    this.logScrapingProgress('Content extracted', {
      title,
      contentLength: content.length
    });

    return { title, content };
  }

  // private async processContent(content: string): Promise<string> {
  //   try {
  //     const prompt = `Analyze and summarize this documentation content: ${content}`;
  //     const summary = await this.ollamaService.generateResponse(prompt, {
  //       model: 'llama2',
  //       options: {
  //         temperature: 0.5
  //       }
  //     });
  //     return summary;
  //   } catch (error) {
  //     ActivityLogger.logError(error as Error, {
  //       operation: 'process_content',
  //       cdp: CDP.SEGMENT,
  //       timestamp: this.currentTime,
  //       user: this.currentUser
  //     });
  //     return content;
  //   }
  // }
}