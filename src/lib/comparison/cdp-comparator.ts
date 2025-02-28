import { CDPComparison, CDPFeature, CDPFeatureComparison } from '@/lib/types/index';
import { CDP } from '@/lib/types/cdp';
import { prisma } from '@/lib/db/prisma';
import { memoryCache } from '@/lib/cache/memory-cache';

export class CDPComparator {
  async compareFeatures(feature: string, cdps: CDP[]): Promise<CDPComparison> {
    const cacheKey = `comparison:${feature}:${cdps.sort().join(',')}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    try {
      const comparison: Record<CDP, CDPFeature> = {
        SEGMENT: {
            name: '',
            supported: false,
            description: '',
            lastVerified: '2025-02-28 07:58:57',
            verifiedBy: 'drhousevicodine'
        },
        MPARTICLE: {
            name: '',
            supported: false,
            description: '',
            lastVerified: '2025-02-28 07:58:57',
            verifiedBy: 'drhousevicodine'
        },
        LYTICS: {
            name: '',
            supported: false,
            description: '',
            lastVerified: '2025-02-28 07:58:57',
            verifiedBy: 'drhousevicodine'
        },
        ZEOTAP: {
            name: '',
            supported: false,
            description: '',
            lastVerified: '2025-02-28 07:58:57',
            verifiedBy: 'drhousevicodine'
        }
      };
      
      for (const cdp of cdps) {
        const docs = await this.getRelevantDocs(feature, cdp);
        comparison[cdp] = this.analyzeFeatureSupport(feature, docs);
      }

      const featureComparison: CDPFeatureComparison = {
        featureName: feature,
        comparison: comparison,
        recommendedCDP: undefined,
        comparisonNotes: ''
      };

      const result: CDPComparison = {
        timestamp: '2025-02-28 07:58:57',
        comparedBy: 'drhousevicodine',
        cdps,
        features: { [feature]: featureComparison },
        summary: `Comparison of ${feature} across ${cdps.length} CDPs`
      };

      memoryCache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('CDP comparison error:', error);
      throw new Error('Failed to compare CDP features');
    }
  }

  private async getRelevantDocs(feature: string, cdp: CDP) {
    return await prisma.document.findMany({
      where: {
        cdp,
        content: {
          contains: feature,
          mode: 'insensitive',
        },
      },
      select: {
        content: true,
        title: true,
        url: true,
      },
    });
  }

  private analyzeFeatureSupport(feature: string, docs: any[]): CDPFeature {
    const keywordMatches = this.countKeywordMatches(feature, docs);
    const supported = keywordMatches > 0;

    return {
      name: feature,
      supported,
      description: this.extractFeatureDescription(feature, docs),
      details: supported ? this.summarizeFeatureDetails(docs) : undefined,
      lastVerified: new Date().toISOString(),
      verifiedBy: 'system'
    };
  }

  private countKeywordMatches(feature: string, docs: any[]): number {
    const featureWords = feature.toLowerCase().split(/\s+/);
    let matches = 0;

    for (const doc of docs) {
      const content = doc.content.toLowerCase();
      if (featureWords.every(word => content.includes(word))) {
        matches++;
      }
    }

    return matches;
  }

  private extractFeatureDescription(feature: string, docs: any[]): string {
    if (docs.length === 0) return '';

    // Find the most relevant paragraph mentioning the feature
    for (const doc of docs) {
      const paragraphs = doc.content.split('\n\n');
      for (const paragraph of paragraphs) {
        if (paragraph.toLowerCase().includes(feature.toLowerCase())) {
          return paragraph.slice(0, 200) + '...';
        }
      }
    }

    return docs[0].content.slice(0, 200) + '...';
  }

  private summarizeFeatureDetails(docs: any[]) {
    if (docs.length === 0) return undefined;

    const urls = docs.map(doc => doc.url).slice(0, 3);
    const summary = docs[0].content.slice(0, 150) + '...';

    return {
      setup: summary,
      configuration: `Documentation URLs:\n${urls.join('\n')}`,
      bestPractices: [],
      commonIssues: []
    };
  }
}