import { prisma } from '../db/prisma';
import { CDP } from '../types/cdp';

export class MetricsService {
  async trackQueryMetrics(
    query: string,
    cdp: CDP | undefined,
    sessionId: string,
    startTime: number,
    successful: boolean,
    response?: string
  ) {
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

  async getAverageResponseTime(timeWindow: number = 24 * 60 * 60 * 1000) {
    const results = await prisma.queryAnalytics.aggregate({
      where: {
        timestamp: {
          gte: new Date(Date.now() - timeWindow),
        },
        successful: true,
      },
      _avg: {
        duration: true,
      },
    });

    return results._avg.duration || 0;
  }

  async getSuccessRate(timeWindow: number = 24 * 60 * 60 * 1000) {
    const total = await prisma.queryAnalytics.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - timeWindow),
        },
      },
    });

    const successful = await prisma.queryAnalytics.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - timeWindow),
        },
        successful: true,
      },
    });

    return total > 0 ? (successful / total) * 100 : 0;
  }

  async getMostCommonQueries(limit: number = 10) {
    return await prisma.queryAnalytics.groupBy({
      by: ['query'],
      _count: {
        query: true,
      },
      orderBy: {
        _count: {
          query: 'desc',
        },
      },
      take: limit,
    });
  }
}