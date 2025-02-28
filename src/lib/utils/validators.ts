import { CDP } from '../types/cdp';
import { z } from 'zod';

export class Validators {
  static readonly messageSchema = z.object({
    content: z.string().min(1).max(1000),
    cdp: z.enum(['SEGMENT', 'MPARTICLE', 'LYTICS', 'ZEOTAP']).optional(),
    sessionId: z.string(),
  });

  static isValidCDP(cdp: string): cdp is CDP {
    return Object.values(CDP).includes(cdp as CDP);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isCDPRelatedQuery(query: string): boolean {
    const cdpKeywords = [
      'cdp',
      'customer data platform',
      'segment',
      'mparticle',
      'lytics',
      'zeotap',
      'tracking',
      'analytics',
      'integration',
    ];

    return cdpKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }

  static validateSession(sessionId: string): boolean {
    return /^session-\d{13}$/.test(sessionId);
  }
}