import { CDP } from './cdp';
// Message type
export interface Message {
    id: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    cdp?: CDP;
    createdAt: string; // UTC timestamp
    userId: string;
  }
  
  // QueryMetrics type
  export interface QueryMetrics {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    averageResponseTime: number; // in milliseconds
    successRate: number; // percentage
    cdpDistribution: Record<CDP, number>;
    popularQueries: Array<{
      query: string;
      count: number;
      successRate: number;
    }>;
    timeRange: {
      start: string; // UTC timestamp
      end: string; // UTC timestamp
    };
  }
  
  // CDPComparison type
  export interface CDPComparison {
    timestamp: string; // UTC timestamp
    comparedBy: string; // user who initiated the comparison
    cdps: CDP[];
    features: Record<string, CDPFeatureComparison>;
    summary: string;
  }
  
  // CDPFeature type
  export interface CDPFeature {
    name: string;
    supported: boolean;
    version?: string;
    description: string;
    limitations?: string[];
    documentation?: string;
    lastVerified: string; // UTC timestamp
    verifiedBy: string;
    score?: number; // 0-100
    details?: {
      setup?: string;
      configuration?: string;
      bestPractices?: string[];
      commonIssues?: string[];
    };
  }
  
  // Additional type for feature comparison
  export interface CDPFeatureComparison {
    featureName: string;
    comparison: Record<CDP, CDPFeature>;
    recommendedCDP?: CDP;
    comparisonNotes?: string;
  }