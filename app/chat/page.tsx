'use client'

import { useChat } from '@ai-sdk/react'
import { useState } from 'react'
import ChatMessage from '@/components/ChatMessage'
import ChatInput from '@/components/ChatInput'
import ToolResponse from '@/components/ToolResponse'

export default function ChatPage() {
  const { messages, input, setInput, append, isLoading } = useChat({
    api: '/api/chat',
  })

  return (
    <main className="flex h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Trading Bot</h1>
        <p className="text-sm text-slate-600">Powered by OpenAI API</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center">
              <div className="mb-4 text-5xl">🤖</div>
              <h2 className="mb-2 text-xl font-bold text-slate-900">
                Welcome to Trading Bot
              </h2>
              <p className="text-slate-600">
                Ask me to analyze tokens, execute trades, or get price predictions. 
                I'm integrated with your trading services.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessage message={message} />
                {message.parts?.map((part, idx) => {
                  if (
                    part.type === 'tool-result' &&
                    part.toolName &&
                    part.result
                  ) {
                    return (
                      <ToolResponse
                        key={`${message.id}-tool-${idx}`}
                        toolName={part.toolName}
                        result={part.result}
                      />
                    )
                  }
                  return null
                })}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-center gap-2 text-slate-600">
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white px-6 py-4">
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim()) {
              append({ role: 'user', content: input })
              setInput('')
            }
          }}
          isLoading={isLoading}
        />
      </div>
    </main>
  )
}
