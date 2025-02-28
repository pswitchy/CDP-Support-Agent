import { ActivityLogger } from './activity-logger';
import { SYSTEM_CONSTANTS } from './constants';

export class TextProcessor {
  private static readonly maxTextLength = 10000;
  private static readonly currentTime = SYSTEM_CONSTANTS.CURRENT_TIME;
  private static readonly currentUser = SYSTEM_CONSTANTS.CURRENT_USER;

  static sanitizeInput(text: string | undefined | null): string {
    if (!text) {
      return '';
    }

    return text
      .trim()
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  static truncateText(text: string | undefined | null, maxLength: number = this.maxTextLength): string {
    if (!text) {
      return '';
    }

    const sanitizedText = this.sanitizeInput(text);
    
    if (sanitizedText.length <= maxLength) {
      return sanitizedText;
    }

    return sanitizedText.substring(0, maxLength - 3) + '...';
  }

  static extractKeywords(text: string): string[] {
    const sanitizedText = this.sanitizeInput(text).toLowerCase();
    const words = sanitizedText.split(/\W+/);
    const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with']);
    
    return words.filter(word => word.length > 2 && !stopwords.has(word));
  }

  static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.extractKeywords(text1));
    const words2 = new Set(this.extractKeywords(text2));
    
    if (words1.size === 0 || words2.size === 0) {
      return 0;
    }

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  static formatConversationText(query: string, response: string): { 
    formattedQuery: string; 
    formattedResponse: string; 
  } {
    return {
      formattedQuery: this.truncateText(query),
      formattedResponse: this.truncateText(response)
    };
  }

  static validateText(text: string | undefined | null): boolean {
    if (!text) {
      return false;
    }

    const sanitized = this.sanitizeInput(text);
    return sanitized.length > 0 && sanitized.length <= this.maxTextLength;
  }

  static logTextProcessing(text: string | undefined | null, operation: string): void {
    const textLength = text ? text.length : 0;
    const truncated = textLength > this.maxTextLength;

    ActivityLogger.logActivity('TEXT_PROCESSING', {
      operation,
      originalLength: textLength,
      truncated,
      timestamp: this.currentTime,
      user: this.currentUser
    });
  }
}