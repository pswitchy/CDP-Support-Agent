import { OllamaClient, OllamaGenerateParams, OllamaResponse } from './ollama-client';
import { ActivityLogger } from '../utils/activity-logger';
import { SYSTEM_CONSTANTS } from '../utils/constants';

export class OllamaService {
  private client: OllamaClient;
  private readonly defaultModel = 'llama2';

  constructor() {
    this.client = new OllamaClient();
  }

  async generateResponse(prompt: string, options: Partial<OllamaGenerateParams> = {}): Promise<OllamaResponse> {
    try {
      await this.ensureConnection();

      const params: OllamaGenerateParams = {
        model: options.model || this.defaultModel,
        prompt,
        ...options,
        options: {
          temperature: 0.7,
          top_k: 40,
          top_p: 0.9,
          ...options.options,
        }
      };

      ActivityLogger.logActivity('OLLAMA_GENERATE_START', {
        model: params.model,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER
      });

      const response = await this.client.generate(params);

      ActivityLogger.logActivity('OLLAMA_GENERATE_COMPLETE', {
        model: params.model,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        duration: response.total_duration,
        created_at: response.created_at
      });

      return response;
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'ollama_generate',
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER
      });
      throw error;
    }
  }

  async generateText(prompt: string, options: Partial<OllamaGenerateParams> = {}): Promise<string> {
    const response = await this.generateResponse(prompt, options);
    return response.response;
  }

  private async ensureConnection(): Promise<void> {
    const isConnected = await this.client.ping();
    if (!isConnected) {
      throw new Error('Unable to connect to Ollama service');
    }
  }

  async getModelMetadata(model: string = this.defaultModel): Promise<{
    model: string;
    created_at: string;
    total_duration?: number;
  }> {
    const response = await this.client.generate({
      model,
      prompt: 'Return model metadata',
      options: {
        temperature: 0
      }
    });

    return {
      model: response.model,
      created_at: response.created_at,
      total_duration: response.total_duration
    };
  }
}