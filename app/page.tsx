import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 px-4">
      <div className="max-w-2xl text-center">
        <div className="mb-8 text-6xl">🤖</div>
        <h1 className="mb-4 text-4xl font-bold text-white">
          Trading Bot
        </h1>
        <p className="mb-8 text-lg text-slate-300">
          An AI-powered cryptocurrency trading assistant with real-time analysis and intelligent execution.
          Powered by OpenAI and integrated with the Vercel AI Gateway.
        </p>
        
        <div className="mb-12 space-y-3 rounded-lg bg-slate-800 p-6 text-left">
          <h2 className="mb-4 text-xl font-semibold text-white">Features:</h2>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-3">
              <span className="text-blue-400">✓</span>
              <span>Real-time token price analysis and market sentiment</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400">✓</span>
              <span>AI-powered trading recommendations and predictions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400">✓</span>
              <span>Direct trade execution with tool integration</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400">✓</span>
              <span>Risk assessment and portfolio analysis</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400">✓</span>
              <span>Seamless OpenAI integration via AI Gateway (Zero-config)</span>
            </li>
          </ul>
        </div>

        <Link
          href="/chat"
          className="inline-block rounded-lg bg-blue-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
        >
          Start Trading
        </Link>
      </div>
    </main>
  )
}
