import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { supabase } from '../../src/lib/supabase'
import { useAuthStore } from '../../src/stores/auth.store'

// ─── Theme ──────────────────────────────────────────────
const theme = {
  primary: '#16a24e',
  red: '#ef4444',
  light: {
    bg: '#f6f8f7',
    text: '#0f172a',
    textSecondary: '#64748b',
    cardBg: '#ffffff',
    border: '#e2e8f0',
    borderSubtle: 'rgba(22, 162, 78, 0.1)',
    tabInactive: '#94a3b8',
    navBg: '#ffffff',
  },
  dark: {
    bg: '#112117',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    cardBg: 'rgba(22, 162, 78, 0.05)',
    border: 'rgba(22, 162, 78, 0.1)',
    borderSubtle: 'rgba(22, 162, 78, 0.2)',
    tabInactive: '#475569',
    navBg: 'rgba(17, 33, 23, 0.8)',
  },
}

const PERIOD_TABS = ['1W', '1M', '3M', 'YTD', 'ALL'] as const
type Period = (typeof PERIOD_TABS)[number]

interface DashboardStats {
  netPnl: number
  winRate: number
  totalTrades: number
  avgRR: number | null
  wins: number
  losses: number
}

interface RecentTrade {
  id: string
  instrument: string
  direction: string
  net_pnl: number | null
  rr_ratio: number | null
  outcome: string | null
  entry_time: string
}

function getDateFilter(period: Period): string | null {
  const now = new Date()
  switch (period) {
    case '1W': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return d.toISOString()
    }
    case '1M': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      return d.toISOString()
    }
    case '3M': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 3)
      return d.toISOString()
    }
    case 'YTD': {
      return new Date(now.getFullYear(), 0, 1).toISOString()
    }
    case 'ALL':
      return null
  }
}

function formatPnl(value: number): string {
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return value >= 0 ? `+$${formatted}` : `-$${formatted}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── Component ──────────────────────────────────────────
export default function HomeScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? theme.dark : theme.light

  const { user } = useAuthStore()

  const [period, setPeriod] = useState<Period>('1M')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([])
  const [equityPoints, setEquityPoints] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboard = useCallback(async () => {
    if (!user) return

    const fromDate = getDateFilter(period)

    // Build query for trades in the period
    let query = supabase
      .from('trades')
      .select('id, instrument, direction, net_pnl, rr_ratio, outcome, entry_time, exit_time, is_open, is_draft')
      .eq('user_id', user.id)
      .eq('is_draft', false)
      .order('entry_time', { ascending: true })

    if (fromDate) {
      query = query.gte('entry_time', fromDate)
    }

    const { data: trades } = await query

    if (!trades || trades.length === 0) {
      setStats({ netPnl: 0, winRate: 0, totalTrades: 0, avgRR: null, wins: 0, losses: 0 })
      setRecentTrades([])
      setEquityPoints([])
      setIsLoading(false)
      return
    }

    // Calculate stats
    const closedTrades = trades.filter((t: any) => !t.is_open && t.outcome)
    const totalPnl = closedTrades.reduce((sum: number, t: any) => sum + (parseFloat(t.net_pnl) || 0), 0)
    const wins = closedTrades.filter((t: any) => t.outcome === 'WIN').length
    const losses = closedTrades.filter((t: any) => t.outcome === 'LOSS').length
    const totalWithOutcome = closedTrades.filter((t: any) => t.outcome === 'WIN' || t.outcome === 'LOSS').length
    const winRate = totalWithOutcome > 0 ? (wins / totalWithOutcome) * 100 : 0

    const rrValues = closedTrades
      .map((t: any) => parseFloat(t.rr_ratio))
      .filter((v: number) => !isNaN(v) && v > 0)
    const avgRR = rrValues.length > 0
      ? rrValues.reduce((a: number, b: number) => a + b, 0) / rrValues.length
      : null

    setStats({
      netPnl: totalPnl,
      winRate,
      totalTrades: closedTrades.length,
      avgRR,
      wins,
      losses,
    })

    // Equity curve: cumulative P&L over time
    let cumPnl = 0
    const points = closedTrades.map((t: any) => {
      cumPnl += parseFloat(t.net_pnl) || 0
      return cumPnl
    })
    setEquityPoints(points)

    // Recent trades: last 5 by entry_time desc
    const recent = [...trades]
      .filter((t: any) => !t.is_open)
      .sort((a: any, b: any) => new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime())
      .slice(0, 5)
    setRecentTrades(recent)

    setIsLoading(false)
  }, [user, period])

  useEffect(() => {
    setIsLoading(true)
    fetchDashboard()
  }, [fetchDashboard])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchDashboard()
    setRefreshing(false)
  }, [fetchDashboard])

  const pnlIsPositive = (stats?.netPnl ?? 0) >= 0

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoIcon}>
            <MaterialIcons name="account-balance-wallet" size={22} color={theme.primary} />
          </View>
          <Text style={[styles.logoText, { color: colors.text }]}>TRADGE</Text>
        </View>
        <TouchableOpacity style={[styles.swapButton, { backgroundColor: isDark ? 'rgba(22,162,78,0.1)' : '#f1f5f9' }]}>
          <MaterialIcons name="swap-horiz" size={22} color={isDark ? theme.primary : '#475569'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Period Tabs */}
        <View style={[styles.periodTabs, { borderBottomColor: colors.border }]}>
          {PERIOD_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.periodTab, period === tab && styles.periodTabActive]}
              onPress={() => setPeriod(tab)}
            >
              <Text
                style={[
                  styles.periodTabText,
                  { color: period === tab ? theme.primary : colors.tabInactive },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {/* Net P&L */}
              <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{"Net P&L"}</Text>
                <Text style={[styles.statValueMono, { color: pnlIsPositive ? theme.primary : theme.red }]}>
                  {formatPnl(stats?.netPnl ?? 0)}
                </Text>
                <View style={styles.statBadgeRow}>
                  <MaterialIcons
                    name={pnlIsPositive ? 'trending-up' : 'trending-down'}
                    size={14}
                    color={pnlIsPositive ? theme.primary : theme.red}
                  />
                </View>
              </View>

              {/* Win Rate */}
              <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Win Rate</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {(stats?.winRate ?? 0).toFixed(1)}%
                </Text>
                <View style={styles.statBadgeRow}>
                  <MaterialIcons name="check-circle" size={14} color={theme.primary} />
                  <Text style={[styles.statBadgeText, { color: theme.primary }]}>
                    {stats?.wins ?? 0}W / {stats?.losses ?? 0}L
                  </Text>
                </View>
              </View>

              {/* Total Trades */}
              <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Trades</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats?.totalTrades ?? 0}
                </Text>
              </View>

              {/* Avg R:R */}
              <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg R:R</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats?.avgRR != null ? `1:${stats.avgRR.toFixed(1)}` : '—'}
                </Text>
              </View>
            </View>

            {/* Equity Curve */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>EQUITY CURVE</Text>
              <View style={[styles.chartContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                {equityPoints.length > 1 ? (
                  <EquityCurve points={equityPoints} color={theme.primary} />
                ) : (
                  <View style={styles.chartEmpty}>
                    <Text style={[styles.chartEmptyText, { color: colors.textSecondary }]}>
                      {equityPoints.length === 0 ? 'No trade data yet' : 'Need more trades for chart'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* AI Insight (static) */}
            <View style={styles.section}>
              <View style={[styles.insightCard, { borderColor: 'rgba(22, 162, 78, 0.3)' }]}>
                <View style={styles.insightHeader}>
                  <MaterialIcons name="auto-awesome" size={20} color={theme.primary} />
                  <Text style={[styles.insightLabel, { color: theme.primary }]}>AI INSIGHT</Text>
                </View>
                <Text style={[styles.insightText, { color: isDark ? '#e2e8f0' : '#475569' }]}>
                  Your win rate is 12% higher on Tuesday mornings. Consider increasing your position size for{' '}
                  <Text style={{ fontWeight: 'bold', color: theme.primary }}>USD/JPY</Text>
                  {' '}during London open.
                </Text>
              </View>
            </View>

            {/* Recent Trades */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT TRADES</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/trades')}>
                  <Text style={[styles.viewAllButton, { color: theme.primary }]}>View All</Text>
                </TouchableOpacity>
              </View>

              {recentTrades.length === 0 ? (
                <View style={[styles.emptyTradesCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <Text style={[styles.emptyTradesText, { color: colors.textSecondary }]}>No trades yet. Log your first trade!</Text>
                </View>
              ) : (
                <View style={styles.tradesList}>
                  {recentTrades.map((trade) => {
                    const pnl = parseFloat(String(trade.net_pnl)) || 0
                    const isWin = trade.outcome === 'WIN'
                    const isLoss = trade.outcome === 'LOSS'
                    const barColor = isWin ? theme.primary : isLoss ? theme.red : colors.tabInactive
                    const pnlColor = isWin ? theme.primary : isLoss ? theme.red : colors.textSecondary
                    const rr = parseFloat(String(trade.rr_ratio))

                    return (
                      <View
                        key={trade.id}
                        style={[styles.tradeCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                      >
                        <View style={[styles.tradeBar, { backgroundColor: barColor }]} />
                        <View style={styles.tradeContent}>
                          <View>
                            <Text style={[styles.tradeInstrument, { color: colors.text }]}>{trade.instrument}</Text>
                            <Text style={[styles.tradeMeta, { color: colors.textSecondary }]}>
                              {trade.direction === 'LONG' ? 'Long' : 'Short'} {'\u2022'} {timeAgo(trade.entry_time)}
                            </Text>
                          </View>
                          <View style={styles.tradeRight}>
                            <Text style={[styles.tradePnl, { color: pnlColor }]}>
                              {formatPnl(pnl)}
                            </Text>
                            {!isNaN(rr) && rr > 0 && (
                              <Text style={[styles.tradeRR, { color: colors.textSecondary }]}>
                                RR 1:{rr.toFixed(1)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

// ─── Simple Equity Curve using Views ────────────────────
function EquityCurve({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const chartHeight = 120

  return (
    <View style={[equityStyles.chart, { height: chartHeight }]}>
      {points.map((val, i) => {
        const normalized = ((val - min) / range) * (chartHeight - 16)
        const barWidth = 100 / points.length
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              bottom: 0,
              left: `${(i / points.length) * 100}%`,
              width: `${barWidth}%`,
              height: normalized + 4,
              backgroundColor: color,
              opacity: 0.15 + (0.85 * (i / points.length)),
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
            }}
          />
        )
      })}
      {/* Line connecting tops */}
      {points.map((val, i) => {
        if (i === 0) return null
        const normalized = ((val - min) / range) * (chartHeight - 16)
        return (
          <View
            key={`dot-${i}`}
            style={{
              position: 'absolute',
              bottom: normalized + 2,
              left: `${((i + 0.5) / points.length) * 100}%`,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: color,
            }}
          />
        )
      })}
    </View>
  )
}

const equityStyles = StyleSheet.create({
  chart: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
})

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: {
    backgroundColor: 'rgba(22,162,78,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  logoText: { fontSize: 20, fontWeight: 'bold', letterSpacing: -0.5 },
  swapButton: { padding: 8, borderRadius: 8 },

  scrollContent: { paddingBottom: 100 },

  periodTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  periodTabActive: { borderBottomColor: '#16a24e' },
  periodTabText: { fontSize: 14, fontWeight: '600' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 64 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
  },
  statCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  statLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', letterSpacing: -0.5 },
  statValueMono: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statBadgeText: { fontSize: 10, fontWeight: 'bold' },

  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  viewAllButton: { fontSize: 12, fontWeight: 'bold' },

  chartContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
    minHeight: 140,
    justifyContent: 'center',
  },
  chartEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  chartEmptyText: { fontSize: 14 },

  insightCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(22, 162, 78, 0.05)',
    overflow: 'hidden',
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  insightLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  insightText: { fontSize: 14, lineHeight: 22 },

  tradesList: { gap: 8 },
  tradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tradeBar: { width: 5, height: 48 },
  tradeContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tradeInstrument: { fontSize: 14, fontWeight: 'bold' },
  tradeMeta: { fontSize: 10, marginTop: 2 },
  tradeRight: { alignItems: 'flex-end' },
  tradePnl: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  tradeRR: { fontSize: 10, marginTop: 2 },

  emptyTradesCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  emptyTradesText: { fontSize: 14 },
})
