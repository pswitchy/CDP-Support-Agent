import { CDP } from '@/lib/types/cdp';

export const CDP_KEYWORDS: Record<CDP, string[]> = {
  SEGMENT: [
    'workspace',
    'source',
    'destination',
    'tracking plan',
    'connections',
    'events',
    'identify',
    'track',
    'page',
    'group',
    'protocols',
    'schema',
    'functions',
    'personas',
    'journeys'
  ],
  MPARTICLE: [
    'workspace',
    'input',
    'output',
    'data plan',
    'audience',
    'user attribute',
    'identity',
    'custom attributes',
    'forwarding rules',
    'data master',
    'live stream',
    'calculated attributes'
  ],
  LYTICS: [
    'collection',
    'identity',
    'audiences',
    'campaigns',
    'segments',
    'integrations',
    'behaviors',
    'entities',
    'workflows',
    'journey orchestration'
  ],
  ZEOTAP: [
    'unified data',
    'identity resolution',
    'audience builder',
    'connectors',
    'activation',
    'enrichment',
    'attributes',
    'segments',
    'flows',
    'touchpoints'
  ]
};