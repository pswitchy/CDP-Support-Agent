import { CDP } from '../types/cdp';
import { prisma } from '../db/prisma';
import axios, { AxiosError } from 'axios';
import { ActivityLogger } from '../utils/activity-logger';
import { SYSTEM_CONSTANTS } from '../utils/constants';
import { OllamaService } from '../ollama/ollama-service';
import { validateOllamaConfig } from '../ollama/ollama-config';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'max-age=0',
  'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

export abstract class BaseScraper {
  protected readonly maxRetries = 3;
  protected readonly retryDelay = 2000; // 2 seconds
  protected readonly currentTime = SYSTEM_CONSTANTS.CURRENT_TIME;
  protected readonly currentUser = SYSTEM_CONSTANTS.CURRENT_USER;
  protected readonly ollamaService: OllamaService;

  constructor(
    protected readonly cdp: CDP,
    protected readonly baseUrl: string
  ) {
    validateOllamaConfig();
    this.ollamaService = new OllamaService();
  }

  abstract scrape(): Promise<void>;

  protected async fetchPage(url: string, retryCount = 0): Promise<string> {
    try {
      // Add random delay between requests
      await this.delay(1000 + Math.random() * 2000);

      const response = await axios.get(url, {
        headers: DEFAULT_HEADERS,
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (status) => status < 400, // Consider all 2xx and 3xx as success
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (retryCount < this.maxRetries && 
          (axiosError.response?.status === 403 || 
           axiosError.response?.status === 429 || 
           axiosError.code === 'ECONNRESET')) {
        ActivityLogger.logActivity('RETRY_ATTEMPT', {
          url,
          attempt: retryCount + 1,
          cdp: this.cdp,
          timestamp: this.currentTime,
          user: this.currentUser,
          statusCode: axiosError.response?.status,
          errorCode: axiosError.code
        });

        // Exponential backoff with jitter
        const jitter = Math.random() * 1000;
        await this.delay(this.retryDelay * Math.pow(2, retryCount) + jitter);
        return this.fetchPage(url, retryCount + 1);
      }

      ActivityLogger.logError(axiosError, {
        operation: 'fetch_page',
        url,
        cdp: this.cdp,
        timestamp: this.currentTime,
        user: this.currentUser,
        statusCode: axiosError.response?.status,
        errorCode: axiosError.code
      });
      throw error;
    }
  }

  protected async saveDocument(title: string, content: string, url: string) {
    try {
      // Clean and validate input
      title = this.sanitizeText(title);
      content = this.sanitizeText(content);
      url = this.sanitizeUrl(url);

      if (!title || !content || !url) {
        throw new Error('Invalid document data: title, content, and url are required');
      }

      await prisma.document.create({
        data: {
          title,
          content,
          url,
          cdp: this.cdp,
        },
      });

      ActivityLogger.logActivity('DOCUMENT_SAVED', {
        title,
        url,
        cdp: this.cdp,
        timestamp: this.currentTime,
        user: this.currentUser,
        contentLength: content.length
      });
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'save_document',
        url,
        cdp: this.cdp,
        timestamp: this.currentTime,
        user: this.currentUser,
        title
      });
      throw error;
    }
  }

  protected async documentExists(url: string): Promise<boolean> {
    try {
      const count = await prisma.document.count({
        where: {
          url: this.sanitizeUrl(url),
          cdp: this.cdp,
        },
      });
      return count > 0;
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'check_document_exists',
        url,
        cdp: this.cdp,
        timestamp: this.currentTime,
        user: this.currentUser
      });
      return false;
    }
  }

  protected logScrapingProgress(message: string, data?: Record<string, any>) {
    ActivityLogger.logActivity('SCRAPING_PROGRESS', {
      message,
      cdp: this.cdp,
      timestamp: this.currentTime,
      user: this.currentUser,
      ...data
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  private sanitizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.toString();
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  protected async isRateLimited(response: any): Promise<boolean> {
    return response.status === 429 || 
           (response.headers && 
            (response.headers['x-ratelimit-remaining'] === '0' || 
             response.headers['retry-after']));
  }

  protected getRetryDelay(response: any): number {
    if (response.headers && response.headers['retry-after']) {
      return parseInt(response.headers['retry-after'], 10) * 1000;
    }
    return this.retryDelay;
  }
}