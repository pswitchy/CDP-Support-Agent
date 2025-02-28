import React from 'react';
import { Message } from '@/lib/types/index';
import { DateFormatter } from '@/lib/utils/date-formatter';

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'USER' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-3/4 rounded-lg p-4 ${
              message.role === 'USER'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <div className="text-sm mb-1">
              {message.role === 'USER' ? 'You' : 'CDP Assistant'}
              {message.cdp && ` - ${message.cdp}`}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
            <div className="text-xs mt-2 opacity-75">
              {DateFormatter.getRelativeTime(new Date(message.createdAt))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}