import { CDP } from '../lib/types/cdp';
import { Message } from '../lib/types/index';
import { OllamaClient } from '../lib/ollama/ollama-client';
import { prisma } from '../lib/db/prisma';
import { ConversationManager } from '../lib/context/conversation-manager';
import { ActivityLogger } from '../lib/utils/activity-logger';
import { PerformanceMonitor } from '../lib/utils/performance-monitor';
import { RateLimiter } from '../lib/utils/rate-limiter';
import { TextProcessor } from '../lib/utils/text-processor';
import { SYSTEM_CONSTANTS } from '../lib/utils/constants';
import { DateTime } from '../lib/utils/datetime';

export class ChatService {
  private readonly llm: OllamaClient;
  private readonly conversationManager: ConversationManager;
  private readonly rateLimiter: RateLimiter;

  constructor() {
    this.llm = new OllamaClient();
    this.conversationManager = new ConversationManager();
    this.rateLimiter = new RateLimiter();
  }

  async processQuery(
    query: string,
    cdp?: CDP,
    sessionId: string = 'default'
  ): Promise<{ message: string; relevantDocs?: any[] }> {
    const startTime = Date.now();

    try {
      // Log query receipt
      ActivityLogger.logActivity('CHAT_QUERY_RECEIVED', {
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        cdp,
        query
      });

      // Rate limiting check
      await this.rateLimiter.checkLimit(SYSTEM_CONSTANTS.CURRENT_USER);

      const sanitizedQuery = this.sanitizeInput(query);
      
      // Get relevant documents
      const relevantDocs = await PerformanceMonitor.measure('find_relevant_docs', 
        () => this.findRelevantDocs(sanitizedQuery, cdp)
      );

      // Get conversation context
      const context = await PerformanceMonitor.measure('get_conversation_context',
        () => this.conversationManager.getConversationContext(sessionId, cdp)
      );

      // Build and process prompt
      const promptText = this.buildPrompt(relevantDocs, context);
      const llmResponse = await PerformanceMonitor.measure('llm_response', async () => {
        return await this.llm.generate({
          model: 'llama2',
          prompt: sanitizedQuery,
          system: promptText,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 2048,
            stop: ['<END>']
          }
        });
      });

      if (!llmResponse?.response) {
        throw new Error('Failed to generate response from LLM');
      }

      const message = TextProcessor.truncateText(llmResponse.response, 4000);

      // Save conversation
      await PerformanceMonitor.measure('save_conversation', () =>
        this.saveConversation({
          query: sanitizedQuery,
          response: message,
          cdp,
          sessionId
        })
      );

      // Log completion
      ActivityLogger.logActivity('CHAT_QUERY_COMPLETED', {
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        duration: Date.now() - startTime,
        cdp,
        sessionId
      });

      return {
        message,
        relevantDocs
      };

    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'processQuery',
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        cdp,
        query,
        sessionId
      });
      throw error;
    }
  }

  private sanitizeInput(query: string): string {
    return TextProcessor.sanitizeInput(query);
  }

  private async findRelevantDocs(query: string, cdp?: CDP) {
    try {
      const keywords = TextProcessor.extractKeywords(query);
      const keywordQuery = keywords.join(' ');

      const docs = await prisma.document.findMany({
        where: {
          cdp: cdp || undefined,
          OR: [
            {
              content: {
                contains: keywordQuery,
                mode: 'insensitive'
              }
            },
            {
              title: {
                contains: keywordQuery,
                mode: 'insensitive'
              }
            }
          ]
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 5,
        select: {
          title: true,
          content: true,
          url: true
        }
      });

      return docs.sort((a: { content: string; }, b: { content: string; }) => {
        const similarityA = TextProcessor.calculateSimilarity(query, a.content);
        const similarityB = TextProcessor.calculateSimilarity(query, b.content);
        return similarityB - similarityA;
      });

    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'find_relevant_docs',
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        query
      });
      return [];
    }
  }

  private buildPrompt(docs: any[], context: string): string {
    let prompt = `You are a helpful CDP support agent. Current time: ${SYSTEM_CONSTANTS.CURRENT_TIME}\n\n`;

    if (context) {
      prompt += `Previous conversation:\n${context}\n\n`;
    }

    if (docs.length > 0) {
      prompt += 'Relevant documentation:\n';
      docs.forEach(doc => {
        const truncatedContent = TextProcessor.truncateText(doc.content, 500);
        prompt += `${doc.title}:\n${truncatedContent}\n\n`;
      });
    }

    prompt += `Remember: You are operating at ${SYSTEM_CONSTANTS.CURRENT_TIME} as user ${SYSTEM_CONSTANTS.CURRENT_USER}.\n`;
    prompt += 'Please provide accurate, helpful responses based on the available documentation.';

    return TextProcessor.truncateText(prompt, 4000);
  }

  private async saveConversation(data: {
    query: string;
    response: string;
    cdp?: CDP;
    sessionId: string;
  }): Promise<void> {
    try {
      await prisma.conversation.create({
        data: {
          query: TextProcessor.truncateText(data.query, 1000),
          response: TextProcessor.truncateText(data.response, 4000),
          cdp: data.cdp,
          sessionId: data.sessionId,
          userId: SYSTEM_CONSTANTS.CURRENT_USER,
          timestamp: DateTime.parse(SYSTEM_CONSTANTS.CURRENT_TIME)
        },
      });
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'save_conversation',
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        sessionId: data.sessionId
      });
    }
  }

  async getConversationHistory(
    sessionId: string,
    limit: number = 10
  ): Promise<Message[]> {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          sessionId,
          userId: SYSTEM_CONSTANTS.CURRENT_USER,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
      });

      return conversations.map((conv: { id: any; query: string | null | undefined; cdp: CDP; timestamp: any; userId: any; response: string | null | undefined; }) => ([
        {
          id: `${conv.id}-q`,
          role: 'user',
          content: TextProcessor.truncateText(conv.query),
          cdp: conv.cdp as CDP,
          createdAt: conv.timestamp,
          userId: conv.userId,
        },
        {
          id: `${conv.id}-a`,
          role: 'assistant',
          content: TextProcessor.truncateText(conv.response),
          cdp: conv.cdp as CDP,
          createdAt: conv.timestamp,
          userId: 'system',
        }
      ])).flat();
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'get_conversation_history',
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        sessionId
      });
      return [];
    }
  }

  async deleteConversation(sessionId: string): Promise<void> {
    try {
      await this.conversationManager.clearContext(sessionId);
      ActivityLogger.logActivity('CONVERSATION_DELETED', {
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        sessionId
      });
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'delete_conversation',
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        sessionId
      });
      throw error;
    }
  }
}