export const SETTINGS = {
    APP: {
      NAME: 'CDP Support Agent',
      VERSION: '1.0.0',
      ENVIRONMENT: process.env.NODE_ENV || 'development',
    },
    CACHE: {
      TTL: 3600, // 1 hour
      MAX_SIZE: 1000, // Maximum number of items in cache
      PREFIX: 'cdp-support-',
    },
    RATE_LIMIT: {
      WINDOW_MS: 900000, // 15 minutes
      MAX_REQUESTS: 100,
      SKIP_SUCCESSFUL_REQUESTS: false,
    },
    LLM: {
      MAX_TOKENS: 2048,
      TEMPERATURE: 0.7,
      MODEL: 'llama2',
      TIMEOUT: 30000, // 30 seconds
      MAX_RETRIES: 3,
    },
    SCRAPER: {
      CONCURRENT_REQUESTS: 5,
      REQUEST_TIMEOUT: 30000, // 30 seconds
      USER_AGENT: 'CDP-Support-Agent/1.0',
      RETRY_DELAY: 1000, // 1 second
      MAX_RETRIES: 3,
    },
    ANALYTICS: {
      RETENTION_DAYS: 30,
      METRICS_CACHE_TTL: 300, // 5 minutes
      MAX_POPULAR_QUERIES: 10,
    },
    SECURITY: {
      MAX_REQUEST_SIZE: '1mb',
      CORS_ORIGINS: ['http://localhost:3000'],
      RATE_LIMIT_BYPASS_IPS: ['127.0.0.1'],
    },
  };