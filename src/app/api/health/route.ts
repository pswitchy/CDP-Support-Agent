import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { memoryCache } from '@/lib/cache/memory-cache';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check memory cache
    const cacheSize = memoryCache.size();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        cache: {
          status: 'operational',
          size: cacheSize
        },
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}