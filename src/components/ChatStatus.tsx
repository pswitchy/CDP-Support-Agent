import React from 'react';

interface ChatStatusProps {
  isLoading: boolean;
  error?: string | null;
}

export default function ChatStatus({ isLoading, error }: ChatStatusProps) {
  if (!isLoading && !error) return null;

  return (
    <div className="mt-4">
      {isLoading && (
        <div className="flex items-center text-gray-600">
          <div className="loading-dots">
            <div />
            <div />
            <div />
          </div>
          <span className="ml-2">Thinking...</span>
        </div>
      )}
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-md">
          <p className="text-sm">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}