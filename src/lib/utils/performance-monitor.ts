import { ActivityLogger } from './activity-logger';
import { SYSTEM_CONSTANTS } from './constants';

export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static async measure<T>(
    operation: string,
    callback: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await callback();
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${operation}_error`, duration);
      throw error;
    }
  }

  private static recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const metrics = this.metrics.get(operation)!;
    metrics.push(duration);

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }

    ActivityLogger.logActivity('PERFORMANCE_METRIC', {
      operation,
      duration,
      timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
      user: SYSTEM_CONSTANTS.CURRENT_USER,
      average: this.getAverageMetric(operation),
      p95: this.getP95Metric(operation)
    });
  }

  static getAverageMetric(operation: string): number {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / metrics.length) * 100) / 100;
  }

  static getP95Metric(operation: string): number {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) return 0;
    const sortedMetrics = [...metrics].sort((a, b) => a - b);
    const index = Math.ceil(sortedMetrics.length * 0.95) - 1;
    return Math.round(sortedMetrics[index] * 100) / 100;
  }
}