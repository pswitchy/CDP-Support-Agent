import { NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/analytics/analytics-service';

const analyticsService = new AnalyticsService();

export async function GET() {
  try {
    const metrics = await analyticsService.getMetrics();
    
    return NextResponse.json({
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}