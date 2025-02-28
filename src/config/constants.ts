import { CDP } from '@/lib/types/cdp';

export const CDP_KEYWORDS = {
  [CDP.SEGMENT]: [
    'tracking plan',
    'source',
    'destination',
    'workspace',
    'protocols',
    'tracking api',
    'personas',
    'connections',
    'schema',
  ],
  [CDP.MPARTICLE]: [
    'data planning',
    'inputs',
    'outputs',
    'workspace',
    'audience',
    'data master',
    'identity',
    'rules',
  ],
  [CDP.LYTICS]: [
    'collection',
    'segments',
    'campaigns',
    'behavioral scoring',
    'orchestration',
    'audiences',
    'personalization',
  ],
  [CDP.ZEOTAP]: [
    'unify',
    'activate',
    'identity resolution',
    'enrichment',
    'consent management',
    'data clean room',
  ],
};

export const ERROR_MESSAGES = {
  INVALID_CDP: 'Invalid CDP platform specified',
  INVALID_QUERY: 'Invalid query format',
  SERVER_ERROR: 'An unexpected error occurred',
  RATE_LIMIT: 'Too many requests. Please try again later',
  UNAUTHORIZED: 'Unauthorized access',
};

export const MAX_QUERY_LENGTH = 1000;
export const MAX_CACHE_AGE = 3600; // 1 hour in seconds
export const DEFAULT_PAGE_SIZE = 10;