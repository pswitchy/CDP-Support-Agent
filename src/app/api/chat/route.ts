import { NextRequest, NextResponse } from 'next/server';
import { ChatService } from '../../../services/chat-service';
import { ActivityLogger } from '../../../lib/utils/activity-logger';
import { SYSTEM_CONSTANTS } from '../../../lib/utils/constants';

const chatService = new ChatService();

export async function POST(request: NextRequest) {
  try {
    const { query, cdp, sessionId = 'default' } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const response = await chatService.processQuery(query, cdp, sessionId);

    return NextResponse.json({
      message: response.message,
      relevantDocs: response.relevantDocs || [],
      timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
      cdp
    });

  } catch (error) {
    ActivityLogger.logError(error as Error, {
      operation: 'chat_route',
      timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
      user: SYSTEM_CONSTANTS.CURRENT_USER
    });

    return NextResponse.json(
      { 
        error: 'Failed to process query',
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME
      },
      { status: 500 }
    );
  }
}