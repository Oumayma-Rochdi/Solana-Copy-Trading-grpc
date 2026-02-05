import { streamText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

// Mock trading service - replace with your actual gRPC service
const tradingService = {
  executeTrade: async (symbol: string, action: string, amount: number) => {
    console.log(`[Trading] ${action} ${amount} of ${symbol}`)
    return {
      success: true,
      orderId: `ORD-${Date.now()}`,
      symbol,
      action,
      amount,
      price: (Math.random() * 100 + 50).toFixed(2),
    }
  },
  getPrice: async (symbol: string) => {
    return {
      symbol,
      price: (Math.random() * 100 + 50).toFixed(2),
      change: (Math.random() * 10 - 5).toFixed(2),
    }
  },
}

// Mock analysis service - replace with your actual analysis service
const analysisService = {
  analyzeToken: async (symbol: string) => {
    return {
      symbol,
      sentiment: ['bullish', 'neutral', 'bearish'][Math.floor(Math.random() * 3)],
      score: (Math.random() * 100).toFixed(2),
      volume24h: (Math.random() * 1000000000).toFixed(0),
    }
  },
  getPrediction: async (symbol: string) => {
    return {
      symbol,
      prediction: ['UP', 'DOWN', 'HOLD'][Math.floor(Math.random() * 3)],
      confidence: (Math.random() * 100).toFixed(2),
    }
  },
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `You are a professional crypto trading assistant powered by AI. You help users analyze tokens, 
execute trades, and make informed investment decisions. You have access to real-time market data and trading capabilities.
Always provide detailed analysis and explain your recommendations. Be cautious and risk-aware in your trading suggestions.`,
    messages,
    tools: {
      executeTrade: tool({
        description:
          'Execute a buy or sell trade for a specific cryptocurrency token',
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The symbol of the token (e.g., BTC, ETH, SOL)',
            ),
          action: z
            .enum(['BUY', 'SELL'])
            .describe('Whether to buy or sell the token'),
          amount: z.number().describe('The amount to trade'),
        }),
        execute: async ({ symbol, action, amount }) => {
          return await tradingService.executeTrade(symbol, action, amount)
        },
      }),
      getTokenPrice: tool({
        description: 'Get the current price of a cryptocurrency token',
        parameters: z.object({
          symbol: z.string().describe('The symbol of the token (e.g., BTC, ETH)'),
        }),
        execute: async ({ symbol }) => {
          return await tradingService.getPrice(symbol)
        },
      }),
      analyzeToken: tool({
        description: 'Analyze a token with sentiment analysis and scoring',
        parameters: z.object({
          symbol: z.string().describe('The symbol of the token to analyze'),
        }),
        execute: async ({ symbol }) => {
          return await analysisService.analyzeToken(symbol)
        },
      }),
      getPrediction: tool({
        description: 'Get AI prediction for token price movement',
        parameters: z.object({
          symbol: z.string().describe('The symbol of the token'),
        }),
        execute: async ({ symbol }) => {
          return await analysisService.getPrediction(symbol)
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
