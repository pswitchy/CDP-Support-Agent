import { prisma } from '../db/prisma';

export class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  async createOrUpdateSession(sessionId: string, metadata?: any): Promise<void> {
    await prisma.userSession.upsert({
      where: { id: sessionId },
      create: {
        id: sessionId,
        lastSeen: new Date(),
        metadata: metadata || {},
      },
      update: {
        lastSeen: new Date(),
        metadata: metadata || {},
      },
    });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const expiredBefore = new Date(Date.now() - SessionManager.SESSION_TIMEOUT);
    const { count } = await prisma.userSession.deleteMany({
      where: {
        lastSeen: {
          lt: expiredBefore,
        },
      },
    });
    return count;
  }
}