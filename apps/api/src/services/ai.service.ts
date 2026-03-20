import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabaseAdmin } from '../lib/supabase'
import { env } from '../config/env'
import { NotificationService } from './notification.service'

const genAI = env.GOOGLE_GEMINI_API_KEY
  ? new GoogleGenerativeAI(env.GOOGLE_GEMINI_API_KEY)
  : null

const MODEL_NAME = 'gemini-2.0-flash'

interface InsightCard {
  type: 'PATTERN' | 'RISK_ALERT' | 'EMOTIONAL' | 'STRATEGY' | 'GOAL' | 'ANOMALY' | 'WEEKLY_SUMMARY' | 'TRADE_NOTE'
  title: string
  body: string
  supportingData?: Record<string, unknown>
}

interface AIAnalysisResponse {
  insights: InsightCard[]
}

export class AIService {
  static async generateInsights(userId: string): Promise<void> {
    if (!genAI) return

    const stats = await this.buildUserContext(userId)
    if (stats.totalTrades < 10) return

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: { responseMimeType: 'application/json' },
    })

    const systemPrompt = `
You are a trading performance analyst reviewing a trader's journal data.
Identify meaningful patterns, risks, and opportunities in their trading behaviour.
Analyze:
- Performance Patterns (best/worst times, days, assets)
- Risk Management (stop placement, R:R consistency)
- Psychological Profile (emotional patterns, FOMO)
- Strategy Effectiveness (win rate per setup)

Respond ONLY with JSON matching the requested schema.`.trim()

    const userPrompt = `
TRADING STATISTICS SUMMARY:
${JSON.stringify(stats.summary, null, 2)}

RECENT TRADES SAMPLE (last 50):
${JSON.stringify(stats.recentTrades, null, 2)}

Generate JSON with:
{
  "insights": [
    {
      "type": "PATTERN" | "RISK_ALERT" | "EMOTIONAL" | "STRATEGY" | "ANOMALY",
      "title": "Short title",
      "body": "Explanation with specific numbers",
      "supportingData": { }
    }
  ]
}`.trim()

    try {
      const result = await model.generateContent([systemPrompt, userPrompt])
      const response = result.response
      const text = response.text()
      const parsed: AIAnalysisResponse = JSON.parse(text)

      if (!parsed.insights?.length) return

      await supabaseAdmin.from('ai_insights').insert(
        parsed.insights.map((insight) => ({
          user_id: userId,
          insight_type: insight.type,
          title: insight.title,
          body: insight.body,
          supporting_data: insight.supportingData ?? null,
        }))
      )

      // Update last analysis trade count
      await supabaseAdmin
        .from('user_profiles')
        .update({ last_ai_analysis_trade_count: stats.totalTrades })
        .eq('user_id', userId)

    } catch (error) {
      console.error('Gemini Insight Error:', error)
    }
  }

  static async generateTradeNote(userId: string, tradeId: string): Promise<void> {
    if (!genAI) return

    const { data: trade } = await supabaseAdmin
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .eq('user_id', userId)
      .single()

    if (!trade) return

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: { responseMimeType: 'application/json' },
    })

    const systemPrompt = `You are a trading risk coach. Analyze the given trade and provide a brief, actionable note if there are risk violations or exceptional quality.`.trim()
    const userPrompt = `
TRADE DATA:
${JSON.stringify(trade, null, 2)}

Respond ONLY with JSON:
{
  "insight": {
    "type": "RISK_ALERT" | "TRADE_NOTE",
    "title": "Short title",
    "body": "Analysis note"
  }
}`.trim()

    try {
      const result = await model.generateContent([systemPrompt, userPrompt])
      const parsed = JSON.parse(result.response.text())
      const insight = parsed.insight

      if (insight) {
        await supabaseAdmin.from('ai_insights').insert({
          user_id: userId,
          trade_id: tradeId,
          insight_type: insight.type,
          title: insight.title,
          body: insight.body,
        })
      }
    } catch (error) {
      console.error('Gemini Trade Note Error:', error)
    }
  }

  static async generateWeeklySummary(userId: string): Promise<void> {
    if (!genAI) return

    const stats = await this.buildUserContext(userId)
    if (stats.totalTrades === 0) return

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: { responseMimeType: 'application/json' },
    })

    const prompt = `Analyze the trader's performance this week and provide a narrative summary.
STATS: ${JSON.stringify(stats.summary)}
Respond ONLY with JSON:
{
  "title": "Weekly Performance Summary",
  "body": "Your narrative summary here..."
}`

    try {
      const result = await model.generateContent(prompt)
      const parsed = JSON.parse(result.response.text())

      await supabaseAdmin.from('ai_insights').insert({
        user_id: userId,
        insight_type: 'WEEKLY_SUMMARY',
        title: parsed.title,
        body: parsed.body,
      })

      await NotificationService.sendPushNotification(
        userId,
        parsed.title,
        "Your weekly trading report is ready."
      )
    } catch (error) {
      console.error('Gemini Weekly Summary Error:', error)
    }
  }

  // --- Chat Methods ---

  static async createChatSession(userId: string, title?: string) {
    const { data, error } = await supabaseAdmin
      .from('ai_chat_sessions')
      .insert({ user_id: userId, title: title ?? 'New Conversation' })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async listChatSessions(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('ai_chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async getChatHistory(sessionId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('ai_chat_messages')
      .select('*, ai_chat_sessions!inner(user_id)')
      .eq('session_id', sessionId)
      .eq('ai_chat_sessions.user_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  }

  static async sendMessage(userId: string, sessionId: string, message: string) {
    if (!genAI) throw new Error('AI Service not configured')

    // 0. Verify session ownership
    const { data: session } = await supabaseAdmin
      .from('ai_chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!session) throw new Error('Unauthorized or session not found')

    // 1. Save user message
    await supabaseAdmin.from('ai_chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message,
    })

    // 2. Get history
    const history = await this.getChatHistory(sessionId, userId)
    const context = await this.buildUserContext(userId)

    const model = genAI.getGenerativeModel({ model: MODEL_NAME })
    const chat = model.startChat({
      history: history.map((m: any) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      systemInstruction: `You are an expert trading coach. You have access to the user's trading stats: ${JSON.stringify(context.summary)}. Help them improve their trading.`,
    })

    const result = await chat.sendMessage(message)
    const responseText = result.response.text()

    // 3. Save model response
    const { data: savedMessage } = await supabaseAdmin
      .from('ai_chat_messages')
      .insert({
        session_id: sessionId,
        role: 'model',
        content: responseText,
      })
      .select()
      .single()

    // 4. Update session timestamp
    await supabaseAdmin
      .from('ai_chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    return savedMessage
  }

  static async transcribeVoiceNote(voiceNoteId: string, userId: string): Promise<string | null> {
    if (!genAI) throw new Error('AI Service not configured')

    const { data: voiceNote, error: fetchError } = await supabaseAdmin
      .from('trade_voice_notes')
      .select('*')
      .eq('id', voiceNoteId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !voiceNote) {
      console.error('Failed to fetch voice note for transcription:', fetchError)
      return null
    }

    // Download audio from storage
    const { data: audioData, error: downloadError } = await supabaseAdmin
      .storage
      .from('trade_voice_notes')
      .download(voiceNote.storage_key)

    if (downloadError || !audioData) {
      console.error('Failed to download audio for transcription:', downloadError)
      return null
    }

    const audioBuffer = Buffer.from(await audioData.arrayBuffer())

    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    try {
      const result = await model.generateContent([
        {
          inlineData: {
            data: audioBuffer.toString('base64'),
            mimeType: voiceNote.mime_type || 'audio/m4a',
          },
        },
        'Transcribe the provided audio exactly. Return only the transcription text.',
      ])

      const transcription = result.response.text().trim()

      if (transcription) {
        await supabaseAdmin
          .from('trade_voice_notes')
          .update({ transcription })
          .eq('id', voiceNoteId)
      }

      return transcription
    } catch (error) {
      console.error('Gemini Transcription Error:', error)
      return null
    }
  }

  static async listInsights(
    userId: string,
    opts: { page?: number; pageSize?: number }
  ) {
    const page = opts.page ?? 1
    const pageSize = opts.pageSize ?? 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabaseAdmin
      .from('ai_insights')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error(`Failed to list insights: ${error.message}`)

    return {
      data: data ?? [],
      hasMore: (count ?? 0) > page * pageSize,
    }
  }

  static async updateInsight(
    userId: string,
    id: string,
    updates: { isRead?: boolean; isDismissed?: boolean }
  ) {
    const { error } = await supabaseAdmin
      .from('ai_insights')
      .update({
        ...(updates.isRead !== undefined && { is_read: updates.isRead }),
        ...(updates.isDismissed !== undefined && {
          is_dismissed: updates.isDismissed,
        }),
      })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(`Failed to update insight: ${error.message}`)
  }

  private static async buildUserContext(userId: string) {
    const [summary, trades] = await Promise.all([
      supabaseAdmin.rpc('get_user_trade_summary', { p_user_id: userId }),
      supabaseAdmin
        .from('trades')
        .select(
          'instrument, direction, asset_class, entry_time, exit_time, net_pnl, rr_ratio, outcome, session, emotional_state, trade_rating'
        )
        .eq('user_id', userId)
        .eq('is_draft', false)
        .order('entry_time', { ascending: false })
        .limit(50),
    ])

    return {
      totalTrades: (summary.data as any)?.total_trades ?? 0,
      summary: summary.data,
      recentTrades: trades.data ?? [],
    }
  }
}
