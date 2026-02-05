'use client'

import { FormEvent, ChangeEvent } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export default function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        onSubmit(e as any)
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <textarea
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask me to analyze a token, execute a trade, or get a price prediction..."
        className="flex-1 resize-none rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        rows={3}
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors disabled:bg-slate-300 hover:bg-blue-600"
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  )
}
