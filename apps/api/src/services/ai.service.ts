import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '../lib/supabase'
import { env } from '../config/env'

const anthropic = env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  : null

interface InsightCard {
  type: 'PATTERN' | 'RISK_ALERT' | 'EMOTIONAL' | 'STRATEGY' | 'GOAL' | 'ANOMALY'
  title: string
  body: string
  supportingData?: Record<string, unknown>
}

interface AIAnalysisResponse {
  insights: InsightCard[]
}

export class AIService {
  static async generateInsights(userId: string): Promise<void> {
    if (!anthropic) return

    const stats = await this.buildUserContext(userId)
    if (stats.totalTrades < 10) return

    const systemPrompt = `
You are a trading performance analyst reviewing a trader's journal data.
Identify meaningful patterns, risks, and opportunities in their trading behaviour.
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
      "type": "PATTERN" | "RISK_ALERT" | "EMOTIONAL" | "STRATEGY" | "GOAL" | "ANOMALY",
      "title": "Short title",
      "body": "Explanation with specific numbers",
      "supportingData": { }
    }
  ]
}`.trim()

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') return

    let parsed: AIAnalysisResponse
    try {
      const clean = content.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      parsed = JSON.parse(clean)
    } catch {
      return
    }

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

