import { PrismaClient } from '@prisma/client';
import { CDP } from '../types/cdp';
import { ActivityLogger } from '../utils/activity-logger';
import prismaClient from '../db/prisma-client';
import { SYSTEM_CONSTANTS } from '../utils/constants';

// Define interface for conversation messages
interface ConversationMessage {
  query: string;
  response: string;
  timestamp: Date;
}

// Define interface for conversation input data
interface ConversationInput {
  query: string;
  response: string;
  cdp?: CDP;
  sessionId: string;
}

export class ConversationManager {
  private readonly maxContextLength = 5;
  private readonly currentTime = SYSTEM_CONSTANTS.CURRENT_TIME;
  private readonly currentUser = SYSTEM_CONSTANTS.CURRENT_USER;
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = prismaClient;
  }

  async getConversationContext(sessionId: string, cdp?: CDP): Promise<string> {
    try {
      const previousMessages = await this.prisma.conversation.findMany({
        where: {
          sessionId,
          userId: this.currentUser,
          cdp: cdp || undefined
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: this.maxContextLength,
        select: {
          query: true,
          response: true,
          timestamp: true
        }
      });

      if (!previousMessages.length) {
        ActivityLogger.logActivity('NO_PREVIOUS_CONTEXT', {
          sessionId,
          cdp,
          timestamp: this.currentTime,
          user: this.currentUser
        });
        return '';
      }

      // Format context as a conversation with proper typing
      const context = previousMessages
        .reverse()
        .map((msg: ConversationMessage) => `User: ${msg.query}\nAssistant: ${msg.response}`)
        .join('\n\n');

      ActivityLogger.logActivity('CONTEXT_RETRIEVED', {
        sessionId,
        cdp,
        timestamp: this.currentTime,
        user: this.currentUser,
        messageCount: previousMessages.length
      });

      return context;

    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'get_conversation_context',
        sessionId,
        cdp,
        timestamp: this.currentTime,
        user: this.currentUser
      });
      return '';
    }
  }

  async saveConversation(data: ConversationInput): Promise<void> {
    try {
      await this.prisma.conversation.create({
        data: {
          query: data.query,
          response: data.response,
          cdp: data.cdp,
          sessionId: data.sessionId,
          userId: this.currentUser,
          timestamp: new Date(this.currentTime)
        },
      });

      ActivityLogger.logActivity('CONVERSATION_SAVED', {
        sessionId: data.sessionId,
        cdp: data.cdp,
        timestamp: this.currentTime,
        user: this.currentUser,
        queryLength: data.query.length,
        responseLength: data.response.length
      });
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'save_conversation',
        sessionId: data.sessionId,
        cdp: data.cdp,
        timestamp: this.currentTime,
        user: this.currentUser
      });
      throw error;
    }
  }

  async clearContext(sessionId: string): Promise<void> {
    try {
      const deleteResult = await this.prisma.conversation.deleteMany({
        where: {
          sessionId,
          userId: this.currentUser
        }
      });

      ActivityLogger.logActivity('CONTEXT_CLEARED', {
        sessionId,
        timestamp: this.currentTime,
        user: this.currentUser,
        deletedCount: deleteResult.count
      });
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'clear_context',
        sessionId,
        timestamp: this.currentTime,
        user: this.currentUser
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      ActivityLogger.logActivity('PRISMA_DISCONNECTED', {
        timestamp: this.currentTime,
        user: this.currentUser
      });
    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'prisma_disconnect',
        timestamp: this.currentTime,
        user: this.currentUser
      });
    }
  }
}