import { prisma } from '@/lib/db/prisma';
import { QueryMetrics } from '@/lib/types/index';
import { CDP } from '@/lib/types/cdp';
import { SETTINGS } from '@/config/settings';

export class AnalyticsService {
  async trackQuery(
    query: string,
    cdp: CDP | undefined,
    sessionId: string,
    startTime: number,
    successful: boolean,
    response?: string
  ): Promise<void> {
    const duration = Date.now() - startTime;

    await prisma.queryAnalytics.create({
      data: {
        query,
        cdp,
        sessionId,
        successful,
        response,
        duration,
        timestamp: new Date(),
      },
    });
  }

  async getMetrics(timeWindow: number = 24 * 60 * 60 * 1000): Promise<QueryMetrics> {
    const cutoff = new Date(Date.now() - timeWindow);

    const [totalQueries, successfulQueries, cdpDistribution, popularQueries, avgDuration] = 
      await Promise.all([
        this.getTotalQueries(cutoff),
        this.getSuccessfulQueries(cutoff),
        this.getCDPDistribution(cutoff),
        this.getPopularQueries(cutoff),
        this.getAverageResponseTime(cutoff),
      ]);

    const end = new Date();
    const start = new Date(end.getTime() - timeWindow);

    return {
      totalQueries,
      successfulQueries,
      failedQueries: totalQueries - successfulQueries,
      successRate: (successfulQueries / totalQueries) * 100,
      averageResponseTime: avgDuration,
      popularQueries,
      cdpDistribution,
      timeRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  }

  private async getTotalQueries(cutoff: Date): Promise<number> {
    return prisma.queryAnalytics.count({
      where: { timestamp: { gte: cutoff } },
    });
  }

  private async getSuccessfulQueries(cutoff: Date): Promise<number> {
    return prisma.queryAnalytics.count({
      where: {
        timestamp: { gte: cutoff },
        successful: true,
      },
    });
  }

  private async getCDPDistribution(cutoff: Date): Promise<Record<CDP, number>> {
    const distribution = await prisma.queryAnalytics.groupBy({
      by: ['cdp'],
      where: { timestamp: { gte: cutoff } },
      _count: true,
    });

    return Object.values(CDP).reduce((acc, cdp) => {
      acc[cdp] = distribution.find((d: { cdp: CDP; }) => d.cdp === cdp)?._count ?? 0;
      return acc;
    }, {} as Record<CDP, number>);
  }

  private async getPopularQueries(cutoff: Date) {
    return prisma.queryAnalytics.groupBy({
      by: ['query'],
      where: { timestamp: { gte: cutoff } },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10,
    });
  }

  private async getAverageResponseTime(cutoff: Date): Promise<number> {
    const result = await prisma.queryAnalytics.aggregate({
      where: { timestamp: { gte: cutoff } },
      _avg: { duration: true },
    });

    return result._avg.duration ?? 0;
  }
}