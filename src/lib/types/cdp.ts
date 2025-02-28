export enum CDP {
    SEGMENT = 'SEGMENT',
    MPARTICLE = 'MPARTICLE',
    LYTICS = 'LYTICS',
    ZEOTAP = 'ZEOTAP'
  }
  
  export type CDPFeature = {
    name: string;
    description: string;
    supported: boolean;
    details?: string;
    lastVerified?: string;
    verifiedBy?: string;
  }
  
  export interface CDPComparison {
    feature: string;
    comparison: Record<CDP, CDPFeature>;
  }