import { CDP } from '@/lib/types/cdp';

export const CDP_ENDPOINTS = {
  [CDP.SEGMENT]: {
    DOCS: 'https://segment.com/docs',
    API: 'https://api.segment.io/v1',
    STATUS: 'https://status.segment.com',
  },
  [CDP.MPARTICLE]: {
    DOCS: 'https://docs.mparticle.com',
    API: 'https://api.mparticle.com/v1',
    STATUS: 'https://status.mparticle.com',
  },
  [CDP.LYTICS]: {
    DOCS: 'https://docs.lytics.com',
    API: 'https://api.lytics.com/v1',
    STATUS: 'https://status.lytics.com',
  },
  [CDP.ZEOTAP]: {
    DOCS: 'https://docs.zeotap.com',
    API: 'https://api.zeotap.com/v1',
    STATUS: 'https://status.zeotap.com',
  },
};

export const API_ROUTES = {
  CHAT: '/api/chat',
  ANALYTICS: '/api/analytics',
  HEALTH: '/api/health',
  DOCS: '/api/docs',
};

export const INTERNAL_ENDPOINTS = {
  OLLAMA: process.env.OLLAMA_URL || 'http://localhost:11434',
  DATABASE: process.env.DATABASE_URL,
  APP: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
};