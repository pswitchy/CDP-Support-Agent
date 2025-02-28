"use client";
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          CDP Support Agent
        </h1>
        <p className="text-gray-600">
          Get instant answers about Segment, mParticle, Lytics, and Zeotap
        </p>
      </header>
      <ChatInterface />
    </div>
  );
}