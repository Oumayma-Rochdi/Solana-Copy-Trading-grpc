'use client'

interface ToolResponseProps {
  toolName: string
  result: any
}

export default function ToolResponse({ toolName, result }: ToolResponseProps) {
  return (
    <div className="my-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="font-semibold text-slate-700">{toolName}</span>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-slate-600">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )
}
