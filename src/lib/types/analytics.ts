import { CDP } from './cdp';

export interface QueryMetrics {
  totalQueries: number;
  averageResponseTime: number;
  successRate: number;
  popularQueries: PopularQuery[];
  cdpDistribution: Record<CDP, number>;
}

export interface PopularQuery {
  query: string;
  count: number;
}