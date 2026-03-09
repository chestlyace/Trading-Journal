import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { supabase } from '../../src/lib/supabase'
import { useAuthStore } from '../../src/stores/auth.store'

const { width: SCREEN_W } = Dimensions.get('window')

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  totalTrades: number
  closedTrades: number
  wins: number
  losses: number
  breakEvens: number
  totalPnl: number
  grossPnl: number
  totalFees: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  expectancy: number
  sharpeRatio: number
  maxDrawdown: number
  openTrades: number
}

interface StrategyPnl {
  tag: string
  pnl: number
  trades: number
  wins: number
}

interface SessionPnl {
  session: string
  pnl: number
  trades: number
}

interface InstrumentStat {
  instrument: string
  assetClass: string
  pnl: number
  trades: number
  wins: number
}

// ── Static AI Insights ────────────────────────────────────────────────────────

const AI_INSIGHTS = [
  {
    id: '1',
    category: 'Risk',
    categoryColor: '#f97316',
    categoryBg: 'rgba(249, 115, 22, 0.1)',
    categoryBorder: 'rgba(249, 115, 22, 0.2)',
    title: 'Over-leveraging at Open',
    body:
      'Data shows your position sizes tend to be 24% larger during early session opens, leading to higher drawdowns compared to mid-session entries. Consider sizing down at market open.',
  },
  {
    id: '2',
    category: 'Performance',
    categoryColor: '#16a24e',
    categoryBg: 'rgba(22, 162, 78, 0.1)',
    categoryBorder: 'rgba(22, 162, 78, 0.2)',
    title: 'Best Setup: Breakout',
    body:
      'Your breakout trades have consistently delivered the highest profit factor in your portfolio. Prioritising this setup and reducing mean-reversion trades could improve overall returns.',
  },
  {
    id: '3',
    category: 'Psychology',
    categoryColor: '#3b82f6',
    categoryBg: 'rgba(59, 130, 246, 0.1)',
    categoryBorder: 'rgba(59, 130, 246, 0.2)',
    title: 'Stop-Loss Discipline',
    body:
      'Your last recorded trades show strong adherence to your stop-loss zones. Maintaining this discipline is the single most impactful habit for protecting your capital in volatile markets.',
  },
  {
    id: '4',
    category: 'Timing',
    categoryColor: '#a855f7',
    categoryBg: 'rgba(168, 85, 247, 0.1)',
    categoryBorder: 'rgba(168, 85, 247, 0.2)',
    title: 'NY Session Dominance',
    body:
      'Your highest win-rates consistently appear during New York session hours. Concentrating trading efforts on NY session and reducing Asian session activity may improve overall statistics.',
  },
]

const TIME_RANGES = ['1W', '1M', '3M', 'YTD', 'ALL'] as const
type TimeRange = typeof TIME_RANGES[number]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFromDate(range: TimeRange): string | null {
  const now = new Date()
  switch (range) {
    case '1W': {
      const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString()
    }
    case '1M': {
      const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString()
    }
    case '3M': {
      const d = new Date(now); d.setMonth(d.getMonth() - 3); return d.toISOString()
    }
    case 'YTD': {
      return new Date(now.getFullYear(), 0, 1).toISOString()
    }
    case 'ALL':
    default:
      return null
  }
}

function fmtPnl(val: number) {
  const abs = Math.abs(val).toFixed(2)
  return `${val >= 0 ? '+' : '-'}$${abs}`
}

function fmtPct(val: number) {
  return `${val.toFixed(1)}%`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const isDark = useColorScheme() === 'dark'
  const { user } = useAuthStore()

  const [tab, setTab] = useState<'ai' | 'perf'>('ai')
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [stats, setStats] = useState<Stats | null>(null)
  const [strategyData, setStrategyData] = useState<StrategyPnl[]>([])
  const [sessionData, setSessionData] = useState<SessionPnl[]>([])
  const [instrumentData, setInstrumentData] = useState<InstrumentStat[]>([])

  const c = isDark
    ? {
      bg: '#0a0f0c',
      surface: '#121d16',
      text: '#f8fafc',
      sub: '#94a3b8',
      border: 'rgba(22,162,78,0.2)',
      divider: 'rgba(22,162,78,0.15)',
      card: '#121d16',
      tabActive: '#16a24e',
      tabInactive: '#334155',
    }
    : {
      bg: '#f6f8f7',
      surface: '#ffffff',
      text: '#0f172a',
      sub: '#64748b',
      border: 'rgba(22,162,78,0.2)',
      divider: 'rgba(22,162,78,0.12)',
      card: '#ffffff',
      tabActive: '#16a24e',
      tabInactive: '#94a3b8',
    }

  const fetchData = useCallback(async () => {
    if (!user) return

    const from = getFromDate(timeRange)
    let query = supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_open', false) // only closed trades for analytics

    if (from) query = query.gte('entry_time', from)

    const { data: trades, error } = await query

    if (error || !trades) {
      setLoading(false)
      setRefreshing(false)
      return
    }

    // ── Stats ──────────────────────────────────────────────────────────────
    const wins = trades.filter(t => t.outcome === 'WIN')
    const losses = trades.filter(t => t.outcome === 'LOSS')
    const bes = trades.filter(t => t.outcome === 'BREAK_EVEN')
    const total = trades.length
    const totalPnl = trades.reduce((s, t) => s + (parseFloat(t.net_pnl) || 0), 0)
    const grossPnl = trades.reduce((s, t) => s + (parseFloat(t.gross_pnl) || 0), 0)
    const totalFees = trades.reduce((s, t) => s + (parseFloat(t.fees) || 0), 0)
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (parseFloat(t.net_pnl) || 0), 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (parseFloat(t.net_pnl) || 0), 0) / losses.length) : 0
    const winRate = total > 0 ? (wins.length / total) * 100 : 0

    // Profit Factor = Gross Profit / Gross Loss
    const grossProfit = wins.reduce((s, t) => s + (parseFloat(t.net_pnl) || 0), 0)
    const grossLoss = Math.abs(losses.reduce((s, t) => s + (parseFloat(t.net_pnl) || 0), 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 9.99 : 0

    // Expectancy = (WinRate × AvgWin) − (LossRate × AvgLoss)
    const lossRate = total > 0 ? losses.length / total : 0
    const expectancy = (winRate / 100) * avgWin - lossRate * avgLoss

    // Simplified Sharpe (daily PnL stdev)
    const pnlArr = trades.map(t => parseFloat(t.net_pnl) || 0)
    const mean = pnlArr.length > 0 ? pnlArr.reduce((a, b) => a + b, 0) / pnlArr.length : 0
    const variance = pnlArr.length > 1 ? pnlArr.reduce((s, v) => s + (v - mean) ** 2, 0) / (pnlArr.length - 1) : 1
    const sharpeRatio = variance > 0 ? mean / Math.sqrt(variance) : 0

    // Max Drawdown (% peak to trough on cumulative PnL)
    let peak = 0, cum = 0, maxDD = 0
    for (const t of trades.sort((a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime())) {
      cum += parseFloat(t.net_pnl) || 0
      if (cum > peak) peak = cum
      const dd = peak > 0 ? ((peak - cum) / peak) * 100 : 0
      if (dd > maxDD) maxDD = dd
    }

    setStats({
      totalTrades: total,
      closedTrades: total,
      wins: wins.length,
      losses: losses.length,
      breakEvens: bes.length,
      totalPnl,
      grossPnl,
      totalFees,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      expectancy,
      sharpeRatio,
      maxDrawdown: maxDD,
      openTrades: 0,
    })

    // ── By Strategy ────────────────────────────────────────────────────────
    const { data: tagData } = await supabase
      .from('trade_tags')
      .select('trade_id, tag_value')
      .eq('tag_type', 'STRATEGY')
      .in('trade_id', trades.map(t => t.id))

    const strategyMap: Record<string, { pnl: number; trades: number; wins: number }> = {}
    for (const tag of tagData || []) {
      const trade = trades.find(t => t.id === tag.trade_id)
      if (!trade) continue
      if (!strategyMap[tag.tag_value]) strategyMap[tag.tag_value] = { pnl: 0, trades: 0, wins: 0 }
      strategyMap[tag.tag_value].pnl += parseFloat(trade.net_pnl) || 0
      strategyMap[tag.tag_value].trades += 1
      if (trade.outcome === 'WIN') strategyMap[tag.tag_value].wins += 1
    }
    const stratArr = Object.entries(strategyMap)
      .map(([tag, v]) => ({ tag, ...v }))
      .sort((a, b) => b.pnl - a.pnl)
    setStrategyData(stratArr)

    // ── By Session ─────────────────────────────────────────────────────────
    const sessionMap: Record<string, { pnl: number; trades: number }> = {}
    for (const t of trades) {
      const s = t.session || 'UNTAGGED'
      if (!sessionMap[s]) sessionMap[s] = { pnl: 0, trades: 0 }
      sessionMap[s].pnl += parseFloat(t.net_pnl) || 0
      sessionMap[s].trades += 1
    }
    const sessArr = Object.entries(sessionMap)
      .map(([session, v]) => ({ session, ...v }))
      .sort((a, b) => b.pnl - a.pnl)
    setSessionData(sessArr)

    // ── By Instrument ──────────────────────────────────────────────────────
    const instrMap: Record<string, { assetClass: string; pnl: number; trades: number; wins: number }> = {}
    for (const t of trades) {
      const key = t.instrument
      if (!instrMap[key]) instrMap[key] = { assetClass: t.asset_class || '—', pnl: 0, trades: 0, wins: 0 }
      instrMap[key].pnl += parseFloat(t.net_pnl) || 0
      instrMap[key].trades += 1
      if (t.outcome === 'WIN') instrMap[key].wins += 1
    }
    const instrArr = Object.entries(instrMap)
      .map(([instrument, v]) => ({ instrument, ...v }))
      .sort((a, b) => b.pnl - a.pnl)
    setInstrumentData(instrArr)

    setLoading(false)
    setRefreshing(false)
  }, [user, timeRange])

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // ── Bar chart helpers ──────────────────────────────────────────────────────
  const maxAbsSession = Math.max(...sessionData.map(s => Math.abs(s.pnl)), 1)
  const maxAbsStrategy = Math.max(...strategyData.map(s => Math.abs(s.pnl)), 1)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>

      {/* ── Top Header ── */}
      <View style={[styles.topBar, { borderBottomColor: c.border }]}>
        <View>
          <Text style={[styles.topTitle, { color: c.text }]}>Insights</Text>
          <Text style={[styles.topSub, { color: '#16a24e' }]}>TRADGE JOURNAL</Text>
        </View>
        <View style={[styles.tabSwitcher, { backgroundColor: c.surface, borderColor: c.border }]}>
          <TouchableOpacity
            style={[styles.tabSwitchBtn, tab === 'ai' && { backgroundColor: '#16a24e' }]}
            onPress={() => setTab('ai')}
          >
            <MaterialIcons name="auto-awesome" size={14} color={tab === 'ai' ? '#fff' : c.sub} />
            <Text style={[styles.tabSwitchText, { color: tab === 'ai' ? '#fff' : c.sub }]}>AI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabSwitchBtn, tab === 'perf' && { backgroundColor: '#16a24e' }]}
            onPress={() => setTab('perf')}
          >
            <MaterialIcons name="bar-chart" size={14} color={tab === 'perf' ? '#fff' : c.sub} />
            <Text style={[styles.tabSwitchText, { color: tab === 'perf' ? '#fff' : c.sub }]}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Time Range (Analytics only) ── */}
      {tab === 'perf' && (
        <View style={[styles.timeRangeBar, { borderBottomColor: c.border, backgroundColor: c.bg }]}>
          {TIME_RANGES.map(r => (
            <TouchableOpacity
              key={r}
              style={[
                styles.timeRangeBtn,
                timeRange === r && { backgroundColor: '#16a24e' }
              ]}
              onPress={() => { setTimeRange(r); setLoading(true) }}
            >
              <Text style={[
                styles.timeRangeBtnText,
                { color: timeRange === r ? '#fff' : c.sub }
              ]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Content ── */}
      {tab === 'ai' ? (
        // ── AI INSIGHTS TAB ──────────────────────────────────────────────────
        <ScrollView
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Weekly Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroCardBgIcon}>
              <MaterialIcons name="trending-up" size={80} color="rgba(22,162,78,0.15)" />
            </View>
            <Text style={styles.heroCardLabel}>Weekly Performance</Text>
            <Text style={styles.heroCardTitle}>Your AI Coach Summary</Text>
            <View style={styles.heroCardGrid}>
              <View style={styles.heroCardStat}>
                <Text style={styles.heroCardStatLabel}>Status</Text>
                <Text style={[styles.heroCardStatVal, { color: '#16a24e' }]}>Active</Text>
              </View>
              <View style={styles.heroCardStat}>
                <Text style={styles.heroCardStatLabel}>Insights</Text>
                <Text style={styles.heroCardStatVal}>{AI_INSIGHTS.length}</Text>
              </View>
              <View style={[styles.heroCardStat, { borderBottomWidth: 0 }]}>
                <Text style={styles.heroCardStatLabel}>Type</Text>
                <Text style={styles.heroCardStatVal}>Static AI</Text>
              </View>
            </View>
          </View>

          {/* Insight Feed */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.sub }]}>Insight Feed</Text>
            <MaterialIcons name="filter-list" size={18} color={c.sub} />
          </View>

          {AI_INSIGHTS.map(insight => (
            <View key={insight.id} style={[styles.insightCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[
                styles.insightCategoryBadge,
                { backgroundColor: insight.categoryBg, borderColor: insight.categoryBorder }
              ]}>
                <Text style={[styles.insightCategoryText, { color: insight.categoryColor }]}>
                  {insight.category}
                </Text>
              </View>
              <Text style={[styles.insightTitle, { color: c.text }]}>{insight.title}</Text>
              <Text style={[styles.insightBody, { color: c.sub }]}>"{insight.body}"</Text>
              <TouchableOpacity style={styles.insightLink}>
                <Text style={styles.insightLinkText}>View related trades</Text>
                <MaterialIcons name="arrow-forward" size={14} color="#16a24e" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Ask AI Box */}
          <View style={[styles.askAiBox, { borderColor: c.border }]}>
            <View style={styles.askAiHeader}>
              <MaterialIcons name="chat-bubble-outline" size={20} color="#16a24e" />
              <Text style={[styles.askAiTitle, { color: c.text }]}>ASK YOUR DATA</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.askAiChips}>
              {['When do I trade best?', "What's my best setup?", 'Compare to last month'].map(q => (
                <View key={q} style={[styles.askAiChip, { borderColor: c.border }]}>
                  <Text style={[styles.askAiChipText, { color: c.sub }]}>{q}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={[styles.askAiInputRow, { borderColor: c.border, backgroundColor: isDark ? '#0a0f0c' : '#f6f8f7' }]}>
              <Text style={[styles.askAiPlaceholder, { color: c.sub }]}>Type a question…</Text>
              <View style={styles.askAiSendBtn}>
                <MaterialIcons name="send" size={16} color="#fff" />
              </View>
            </View>
            <Text style={[styles.askAiNote, { color: c.sub }]}>AI chat — coming soon</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        // ── PERFORMANCE ANALYTICS TAB ────────────────────────────────────────
        loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#16a24e" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a24e" />}
          >
            {/* ── Stat Cards Grid ── */}
            <View style={styles.statGrid}>
              {[
                { label: 'Win Rate', value: stats ? fmtPct(stats.winRate) : '—', color: '#16a24e' },
                { label: 'Expectancy', value: stats ? `$${stats.expectancy.toFixed(2)}` : '—', color: c.text },
                { label: 'Profit Factor', value: stats ? stats.profitFactor.toFixed(2) : '—', color: c.text },
                { label: 'Max Drawdown', value: stats ? `-${fmtPct(stats.maxDrawdown)}` : '—', color: '#ef4444' },
              ].map(st => (
                <View key={st.label} style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
                  <Text style={[styles.statLabel, { color: c.sub }]}>{st.label}</Text>
                  <Text style={[styles.statValue, { color: st.color }]}>{st.value}</Text>
                </View>
              ))}

              {/* Sharpe ratio full-width */}
              <View style={[styles.statCard, styles.statCardFull, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.statLabel, { color: c.sub }]}>Sharpe Ratio</Text>
                <Text style={[styles.statValue, { color: c.text }]}>{stats ? stats.sharpeRatio.toFixed(2) : '—'}</Text>
              </View>
            </View>

            {/* Overview counts */}
            <View style={[styles.overviewRow, { borderColor: c.border, backgroundColor: c.surface }]}>
              {[
                { label: 'Trades', value: stats?.totalTrades ?? 0 },
                { label: 'Wins', value: stats?.wins ?? 0, color: '#16a24e' },
                { label: 'Losses', value: stats?.losses ?? 0, color: '#ef4444' },
                { label: 'Net P&L', value: stats ? fmtPnl(stats.totalPnl) : '—', color: stats && stats.totalPnl >= 0 ? '#16a24e' : '#ef4444' },
              ].map((item, i) => (
                <View key={item.label} style={[styles.overviewItem, i < 3 && { borderRightWidth: 1, borderRightColor: c.border }]}>
                  <Text style={[styles.overviewVal, { color: item.color ?? c.text }]}>{item.value}</Text>
                  <Text style={[styles.overviewLabel, { color: c.sub }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* ── P&L by Strategy ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.sub }]}>P&L by Strategy</Text>
              {strategyData.length === 0 ? (
                <Text style={[styles.emptyText, { color: c.sub }]}>No strategy tags found for this period.</Text>
              ) : (
                strategyData.map(item => (
                  <View key={item.tag} style={styles.barRow}>
                    <View style={styles.barLabelRow}>
                      <Text style={[styles.barLabel, { color: c.text }]}>{item.tag}</Text>
                      <Text style={[styles.barVal, { color: item.pnl >= 0 ? '#16a24e' : '#ef4444' }]}>
                        {fmtPnl(item.pnl)}
                      </Text>
                    </View>
                    <View style={[styles.barTrack, { backgroundColor: isDark ? '#1e3126' : '#e2e8f0' }]}>
                      <View style={[
                        styles.barFill,
                        {
                          width: `${Math.min(100, (Math.abs(item.pnl) / maxAbsStrategy) * 100)}%`,
                          backgroundColor: item.pnl >= 0 ? '#16a24e' : '#ef4444',
                        }
                      ]} />
                    </View>
                    <Text style={[styles.barSub, { color: c.sub }]}>
                      {item.trades} trades · {item.trades > 0 ? Math.round((item.wins / item.trades) * 100) : 0}% WR
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* ── P&L by Session ── */}
            <View style={[styles.section, { borderTopWidth: 1, borderTopColor: c.divider }]}>
              <Text style={[styles.sectionTitle, { color: c.sub }]}>P&L by Session</Text>
              {sessionData.length === 0 ? (
                <Text style={[styles.emptyText, { color: c.sub }]}>No session data found.</Text>
              ) : (
                <View style={styles.barChart}>
                  {sessionData.map(item => {
                    const pct = Math.min(100, (Math.abs(item.pnl) / maxAbsSession) * 100)
                    return (
                      <View key={item.session} style={styles.barChartCol}>
                        <Text style={[styles.barChartVal, { color: item.pnl >= 0 ? '#16a24e' : '#ef4444' }]}>
                          {fmtPnl(item.pnl)}
                        </Text>
                        <View style={styles.barChartBarWrapper}>
                          <View style={[
                            styles.barChartBar,
                            {
                              height: `${Math.max(8, pct)}%`,
                              backgroundColor: item.pnl >= 0 ? '#16a24e' : '#ef4444',
                            }
                          ]} />
                        </View>
                        <Text style={[styles.barChartLabel, { color: c.sub }]}>
                          {item.session.length > 6 ? item.session.slice(0, 6) : item.session}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              )}
            </View>

            {/* ── Deep Analysis by Instrument ── */}
            <View style={[styles.section, { borderTopWidth: 1, borderTopColor: c.divider }]}>
              <Text style={[styles.sectionTitle, { color: c.sub }]}>Deep Analysis</Text>
              {instrumentData.length === 0 ? (
                <Text style={[styles.emptyText, { color: c.sub }]}>No instrument data found.</Text>
              ) : (
                <View style={[styles.deepCard, { backgroundColor: c.card, borderColor: c.border }]}>
                  {instrumentData.map((item, idx) => (
                    <View
                      key={item.instrument}
                      style={[
                        styles.deepRow,
                        idx < instrumentData.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }
                      ]}
                    >
                      <View>
                        <Text style={[styles.deepInstr, { color: c.text }]}>{item.instrument}</Text>
                        <Text style={[styles.deepClass, { color: c.sub }]}>{item.assetClass}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.deepPnl, { color: item.pnl >= 0 ? '#16a24e' : '#ef4444' }]}>
                          {fmtPnl(item.pnl)}
                        </Text>
                        <Text style={[styles.deepWr, { color: c.sub }]}>
                          {item.trades > 0 ? Math.round((item.wins / item.trades) * 100) : 0}% WR · {item.trades}T
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )
      )}
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  topTitle: { fontSize: 22, fontWeight: 'bold' },
  topSub: { fontSize: 10, letterSpacing: 2, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },

  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  tabSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabSwitchText: { fontSize: 12, fontWeight: 'bold' },

  timeRangeBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 1,
  },
  timeRangeBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeBtnText: { fontSize: 11, fontWeight: 'bold' },

  scrollPad: { padding: 20, paddingBottom: 80 },
  loaderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── AI ──
  heroCard: {
    backgroundColor: '#0d1f14',
    borderWidth: 1,
    borderColor: 'rgba(22,162,78,0.25)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCardBgIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 16,
  },
  heroCardLabel: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: 'bold',
    color: '#16a24e',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  heroCardGrid: { flexDirection: 'row', gap: 16 },
  heroCardStat: {
    flex: 1,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(22,162,78,0.4)',
  },
  heroCardStatLabel: { fontSize: 10, color: '#94a3b8' },
  heroCardStatVal: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },

  insightCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    gap: 10,
  },
  insightCategoryBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  insightCategoryText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  insightTitle: { fontSize: 16, fontWeight: 'bold' },
  insightBody: { fontSize: 13, lineHeight: 21, fontStyle: 'italic' },
  insightLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  insightLinkText: { fontSize: 12, fontWeight: 'bold', color: '#16a24e' },

  askAiBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(22,162,78,0.04)',
    marginTop: 12,
    gap: 16,
  },
  askAiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  askAiTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },
  askAiChips: { flexDirection: 'row', gap: 8 },
  askAiChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  askAiChipText: { fontSize: 12 },
  askAiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  askAiPlaceholder: { flex: 1, fontSize: 14 },
  askAiSendBtn: {
    backgroundColor: '#16a24e',
    padding: 8,
    borderRadius: 8,
  },
  askAiNote: { fontSize: 11, textAlign: 'center', fontStyle: 'italic' },

  // ── Analytics ──
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (SCREEN_W - 52) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  statCardFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 'bold' },
  statValue: { fontSize: 22, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  overviewRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 28,
  },
  overviewItem: { flex: 1, padding: 14, alignItems: 'center', gap: 4 },
  overviewVal: { fontSize: 16, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  overviewLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },

  section: { paddingTop: 24, marginBottom: 8, gap: 16 },
  emptyText: { fontSize: 13, fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },

  barRow: { gap: 6, marginBottom: 6 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel: { fontSize: 14, fontWeight: 'bold' },
  barVal: { fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barSub: { fontSize: 11 },

  barChart: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 8,
  },
  barChartCol: { flex: 1, alignItems: 'center', height: '100%', gap: 4 },
  barChartVal: { fontSize: 10, fontWeight: 'bold' },
  barChartBarWrapper: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barChartBar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barChartLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

  deepCard: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  deepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  deepInstr: { fontSize: 14, fontWeight: 'bold' },
  deepClass: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  deepPnl: { fontSize: 14, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  deepWr: { fontSize: 10, marginTop: 2 },
})
