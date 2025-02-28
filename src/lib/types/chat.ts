import { CDP } from './cdp';

export interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  cdp?: CDP;
  createdAt: Date;
}

export interface ChatResponse {
  message: string;
  error?: string;
  relevantDocs?: {
    title: string;
    url: string;
    content: string;
  }[];
  comparison?: CDPComparison;
}

export interface CDPComparison {
  feature: string;
  cdps: CDP[];
  comparison: string;
  details: Record<CDP, string>;
}