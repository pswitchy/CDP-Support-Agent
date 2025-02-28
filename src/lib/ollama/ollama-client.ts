import axios from 'axios';
import { SYSTEM_CONSTANTS } from '../utils/constants';

export interface OllamaGenerateParams {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
  format?: 'json';
  options?: {
    num_predict?: number;
    temperature?: number;
    top_k?: number;
    top_p?: number;
    stop?: string[];
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
}

export class OllamaClient {
  private readonly baseUrl: string;

  constructor() {
    const ollamaUrl = process.env.OLLAMA_URL;
    if (!ollamaUrl) {
      throw new Error('OLLAMA_URL environment variable is not set');
    }
    this.baseUrl = ollamaUrl;
  }

  async generate(params: OllamaGenerateParams): Promise<OllamaResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, params);
      
      return {
        ...response.data,
        created_at: SYSTEM_CONSTANTS.CURRENT_TIME,
      };
    } catch (error) {
      console.error('Error generating response from Ollama:', error);
      throw error;
    }
  }

  async ping(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/version`);
      return true;
    } catch (error) {
      return false;
    }
  }
}