import { SegmentScraper } from '@/lib/scrapers/segment-scraper';
import { MParticleScraper } from '@/lib/scrapers/mparticle-scraper';
import { LyticsScraper } from '@/lib/scrapers/lytics-scraper';
import { ZeotapScraper } from '@/lib/scrapers/zeotap-scraper';

async function runScrapers() {
  console.log('Starting documentation scraping...');
  
  const scrapers = [
    new SegmentScraper(),
    new MParticleScraper(),
    new LyticsScraper(),
    new ZeotapScraper()
  ];

  for (const scraper of scrapers) {
    try {
      console.log(`Running ${scraper.constructor.name}...`);
      await scraper.scrape();
      console.log(`Completed ${scraper.constructor.name}`);
    } catch (error) {
      console.error(`Error in ${scraper.constructor.name}:`, error);
    }
  }
}

runScrapers().catch(console.error);