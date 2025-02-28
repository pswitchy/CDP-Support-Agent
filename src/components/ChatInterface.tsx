'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import { CDP } from '@/lib/types/cdp';
import { ActivityLogger } from '@/lib/utils/activity-logger';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import CDPSelector from './CDPSelector';
import ChatStatus from './ChatStatus';
import { SYSTEM_CONSTANTS } from '@/lib/utils/constants';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedCDP, setSelectedCDP] = useState<CDP | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !selectedCDP) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: content.trim(),
      cdp: selectedCDP,
      createdAt: SYSTEM_CONSTANTS.CURRENT_TIME,
      userId: SYSTEM_CONSTANTS.CURRENT_USER
    };

    try {
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: content.trim(),
          cdp: selectedCDP,
          sessionId: 'default'
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'ASSISTANT',
        content: data.message,
        cdp: selectedCDP,
        createdAt: SYSTEM_CONSTANTS.CURRENT_TIME,
        userId: 'system'
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'sendMessage',
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        cdp: selectedCDP,
        content: content.trim()
      });

      setError('Failed to get response. Please try again.');

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <CDPSelector
        selectedCDP={selectedCDP}
        onSelect={setSelectedCDP}
      />
      <div className="flex-1 overflow-y-auto mb-4">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>
      <ChatStatus isLoading={isLoading} error={error} />
      <MessageInput
        onSend={sendMessage}
        isLoading={isLoading}
        disabled={!selectedCDP}
      />
    </div>
  );
}