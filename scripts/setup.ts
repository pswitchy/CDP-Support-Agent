import { PrismaClient } from '@prisma/client';
import { SegmentScraper } from '../src/lib/scrapers/segment-scraper';
import { MParticleScraper } from '../src/lib/scrapers/mparticle-scraper';
import { LyticsScraper } from '../src/lib/scrapers/lytics-scraper';
import { ZeotapScraper } from '../src/lib/scrapers/zeotap-scraper';
import { ActivityLogger } from '../src/lib/utils/activity-logger';
import { execSync } from 'child_process';

const prisma = new PrismaClient();
const CURRENT_TIME = '2025-02-28 13:55:27';
const CURRENT_USER = 'drhousevicodine';

async function initializeDatabase() {
  try {
    // Run migrations
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    ActivityLogger.logActivity('DATABASE_INIT', {
      message: 'Database initialization completed successfully',
      timestamp: CURRENT_TIME,
      user: CURRENT_USER
    });
  } catch (error) {
    ActivityLogger.logError(error as Error, {
      operation: 'database_init',
      timestamp: CURRENT_TIME,
      user: CURRENT_USER
    });
    throw error;
  }
}

async function setup() {
  ActivityLogger.logActivity('SETUP_START', {
    timestamp: CURRENT_TIME,
    user: CURRENT_USER
  });

  try {
    // Initialize database
    await initializeDatabase();

    // Initialize scrapers
    const scrapers = [
      new SegmentScraper(),
      new MParticleScraper(),
      new LyticsScraper(),
      new ZeotapScraper()
    ];

    // Run scrapers sequentially
    for (const scraper of scrapers) {
      await scraper.scrape();
    }

    ActivityLogger.logActivity('SETUP_COMPLETE', {
      timestamp: CURRENT_TIME,
      status: 'success',
      user: CURRENT_USER
    });

  } catch (error) {
    ActivityLogger.logError(error as Error, {
      operation: 'setup',
      timestamp: CURRENT_TIME,
      user: CURRENT_USER
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setup();