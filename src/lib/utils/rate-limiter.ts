import { memoryCache } from '../cache/memory-cache';
import { SETTINGS } from '@/config/settings';
import { ActivityLogger } from './activity-logger';
import { SYSTEM_CONSTANTS } from './constants';

export class RateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly currentTime = SYSTEM_CONSTANTS.CURRENT_TIME;
  private readonly currentUser = SYSTEM_CONSTANTS.CURRENT_USER;

  constructor() {
    this.windowMs = SETTINGS.RATE_LIMIT.WINDOW_MS;
    this.maxRequests = SETTINGS.RATE_LIMIT.MAX_REQUESTS;
  }

  async checkLimit(identifier: string): Promise<void> {
    if (this.isRateLimited(identifier)) {
      const status = this.getLimitStatus(identifier);
      const error = new Error('Rate limit exceeded');
      
      ActivityLogger.logError(error, {
        operation: 'rate_limit_check',
        user: identifier,
        timestamp: this.currentTime,
        resetTime: status.resetTime.toISOString(),
        remaining: status.remaining,
        windowMs: status.windowMs
      });

      throw error;
    }
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const cacheKey = `ratelimit:${identifier}`;
    const requestHistory = memoryCache.get(cacheKey) || [];

    // Clean up old requests
    const validRequests = requestHistory
      .filter((timestamp: number) => now - timestamp < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      ActivityLogger.logActivity('RATE_LIMIT_EXCEEDED', {
        user: identifier,
        timestamp: this.currentTime,
        requestCount: validRequests.length,
        maxRequests: this.maxRequests
      });
      return true;
    }

    validRequests.push(now);
    memoryCache.set(cacheKey, validRequests, this.windowMs / 1000);
    return false;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const cacheKey = `ratelimit:${identifier}`;
    const requestHistory = memoryCache.get(cacheKey) || [];
    
    const validRequests = requestHistory
      .filter((timestamp: number) => now - timestamp < this.windowMs);

    return Math.max(0, this.maxRequests - validRequests.length);
  }

  getResetTime(identifier: string): Date {
    const now = Date.now();
    const cacheKey = `ratelimit:${identifier}`;
    const requestHistory = memoryCache.get(cacheKey) || [];
    
    if (requestHistory.length === 0) {
      return new Date(now);
    }

    const oldestRequest = Math.min(...requestHistory);
    return new Date(oldestRequest + this.windowMs);
  }

  clearLimit(identifier: string): void {
    const cacheKey = `ratelimit:${identifier}`;
    memoryCache.del(cacheKey);
    
    ActivityLogger.logActivity('RATE_LIMIT_CLEARED', {
      user: this.currentUser,
      timestamp: this.currentTime,
      targetUser: identifier
    });
  }

  resetAllLimits(): void {
    const pattern = /^ratelimit:/;
    const keys = memoryCache.keys().filter(key => pattern.test(key));
    
    keys.forEach(key => {
      memoryCache.del(key);
    });

    ActivityLogger.logActivity('ALL_RATE_LIMITS_RESET', {
      user: this.currentUser,
      timestamp: this.currentTime,
      affectedKeys: keys.length
    });
  }

  getLimitStatus(identifier: string): {
    isLimited: boolean;
    remaining: number;
    resetTime: Date;
    windowMs: number;
    maxRequests: number;
  } {
    return {
      isLimited: this.isRateLimited(identifier),
      remaining: this.getRemainingRequests(identifier),
      resetTime: this.getResetTime(identifier),
      windowMs: this.windowMs,
      maxRequests: this.maxRequests
    };
  }
}