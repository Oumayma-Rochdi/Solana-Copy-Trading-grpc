'use client'

import { UIMessage } from 'ai'

interface ChatMessageProps {
  message: UIMessage
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const text = message.parts
    ?.filter((p) => p.type === 'text')
    .map((p) => (p as any).text)
    .join('')

  if (!text) return null

  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs rounded-lg px-4 py-2 text-sm ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-slate-200 text-slate-900'
        }`}
      >
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  )
}
