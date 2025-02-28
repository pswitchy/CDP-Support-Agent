// import { CDP } from '../types';

import { InvalidQueryError, NonCDPQueryError } from "../errors/custom-errors";

export class QueryValidator {
  private cdpKeywords = [
    'segment', 'mparticle', 'lytics', 'zeotap',
    'cdp', 'customer data platform',
    'integration', 'tracking', 'analytics',
    'audience', 'profile', 'source', 'destination'
  ];

  isCDPRelated(query: string): boolean {
    const normalizedQuery = query.toLowerCase();
    return this.cdpKeywords.some(keyword => 
      normalizedQuery.includes(keyword.toLowerCase())
    );
  }

  async validateQuery(query: string): Promise<void> {
    if (!query.trim()) {
      throw new InvalidQueryError('Query cannot be empty');
    }

    if (!this.isCDPRelated(query)) {
      throw new NonCDPQueryError();
    }
  }
}