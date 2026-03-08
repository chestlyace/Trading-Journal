import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import type { TradeFilters, Trade } from '@tradge/types'
import { useTrades } from '../../src/hooks/useTrades'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function TradesScreen() {
  const isDark = useColorScheme() === 'dark'
  const [filters, setFilters] = useState<TradeFilters>({
    sortBy: 'entryTime',
    sortOrder: 'desc'
  })

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const { data, isLoading, refetch } = useTrades(filters)

  const trades = data?.data ?? []
  const total = data?.total ?? 0

  const toggleOutcomeFilter = (outcome: any) => {
    setFilters((prev: TradeFilters) => ({
      ...prev,
      outcome: prev.outcome === outcome ? undefined : outcome
    }))
  }

  const renderTrade = ({ item }: { item: Trade }) => {
    let outcomeText = item.isOpen ? 'OPEN' : item.outcome || 'BE'
    if (outcomeText === 'BREAK_EVEN') outcomeText = 'BE'

    let pnlText = '$0.00'
    let pnlColor = isDark ? '#f8fafc' : '#0f172a'
    let stripeColor = '#64748b' // default/open string

    if (item.netPnl !== null && item.netPnl !== undefined) {
      if (item.outcome === 'WIN' || item.netPnl > 0) {
        pnlText = `+$${item.netPnl.toFixed(2)}`
        pnlColor = '#16a24e'
        stripeColor = '#16a24e'
      } else if (item.outcome === 'LOSS' || item.netPnl < 0) {
        pnlText = `-$${Math.abs(item.netPnl).toFixed(2)}`
        pnlColor = '#ef4444'
        stripeColor = '#ef4444'
      } else {
        pnlText = `+$0.00`
        pnlColor = isDark ? '#94a3b8' : '#64748b'
        stripeColor = '#94a3b8' // BE
      }
    }

    if (item.isOpen) {
      outcomeText = 'OPEN'
      pnlText = '$0.00'
      pnlColor = isDark ? '#f8fafc' : '#0f172a'
      stripeColor = '#64748b'
    }

    const dateStr = item.entryTime ? new Date(item.entryTime).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '--'
    const strategyTag = item.tags?.find((t: any) => t.tagType === 'STRATEGY')?.tagValue || item.tags?.[0]?.tagValue

    return (
      <TouchableOpacity style={[styles.tradeRow, isDark ? styles.borderDark : styles.borderLight]} activeOpacity={0.7}>
        <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
        <View style={styles.tradeContent}>

          <View style={styles.tradeLeft}>
            <Text style={[styles.instrument, isDark ? styles.textDark : styles.textLight]}>{item.instrument}</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>

          <View style={styles.tradeMiddle}>
            {strategyTag ? (
              <View style={[styles.tagBadge, isDark ? styles.bgSlate800 : styles.bgSlate100]}>
                <Text style={[styles.tagText, isDark ? styles.textSlate400 : styles.textSlate600]}>{strategyTag}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.tradeRight}>
            <Text style={[styles.pnl, { color: pnlColor }]}>{pnlText}</Text>
            <Text style={styles.outcomeText}>{outcomeText}</Text>
          </View>

        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.bgDark : styles.bgLight]} edges={['top']}>
      {/* Header Section */}
      <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
        <View style={styles.headerInner}>
          <Text style={[styles.headerTitle, isDark ? styles.textDark : styles.textLight]}>Trade History</Text>
          <Text style={styles.headerCount}>{total}</Text>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={[styles.filterBar, isDark ? styles.borderDark : styles.borderLight]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterBtn, isDark ? styles.filterBtnDark : styles.filterBtnLight, filters.outcome ? styles.filterBtnActive : null]}
            onPress={() => setIsFilterModalOpen(true)}
          >
            <MaterialIcons name="tune" size={18} color={filters.outcome ? '#fff' : (isDark ? '#f8fafc' : '#0f172a')} />
            <Text style={[styles.filterText, filters.outcome ? { color: '#fff' } : (isDark ? styles.textDark : styles.textLight)]}>
              {filters.outcome ? filters.outcome : 'Filter'}
            </Text>
            <MaterialIcons name="expand-more" size={16} color={filters.outcome ? '#fff' : (isDark ? '#f8fafc' : '#0f172a')} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.filterBtn, isDark ? styles.filterBtnDark : styles.filterBtnLight]}>
            <MaterialIcons name="calendar-today" size={18} color={isDark ? '#f8fafc' : '#0f172a'} />
            <Text style={[styles.filterText, isDark ? styles.textDark : styles.textLight]}>All Time</Text>
            <MaterialIcons name="expand-more" size={16} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Trades List */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#16a24e" />
        </View>
      ) : (
        <FlatList
          data={trades}
          keyExtractor={(t: Trade) => t.id}
          renderItem={renderTrade}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="analytics" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text style={[styles.emptyText, isDark ? styles.textSlate400 : styles.textSlate600]}>No trades found.</Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal visible={isFilterModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark ? styles.bgDark : styles.bgLight]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>Filters</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
                <MaterialIcons name="close" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.filterSectionTitle, isDark ? styles.textSlate400 : styles.textSlate600]}>Outcome</Text>
            <View style={styles.filterGrid}>
              {(['WIN', 'LOSS', 'BREAK_EVEN'] as const).map(out => (
                <TouchableOpacity
                  key={out}
                  style={[styles.modalFilterBtn, filters.outcome === out ? styles.modalFilterBtnActive : (isDark ? styles.filterBtnDark : styles.filterBtnLight)]}
                  onPress={() => toggleOutcomeFilter(out)}
                >
                  <Text style={[styles.filterText, filters.outcome === out ? { color: '#fff' } : (isDark ? styles.textDark : styles.textLight)]}>{out === 'BREAK_EVEN' ? 'BE' : out}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={() => setIsFilterModalOpen(false)}>
              <Text style={styles.applyBtnText}>Apply / Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  bgLight: { backgroundColor: '#f6f8f7' },
  bgDark: { backgroundColor: '#112117' },
  textLight: { color: '#0f172a' },
  textDark: { color: '#f8fafc' },
  borderLight: { borderBottomColor: '#e2e8f0', borderBottomWidth: 1 },
  borderDark: { borderBottomColor: 'rgba(30, 41, 59, 0.5)', borderBottomWidth: 1 },
  textSlate400: { color: '#94a3b8' },
  textSlate600: { color: '#475569' },
  bgSlate800: { backgroundColor: 'rgba(30, 41, 59, 0.5)' },
  bgSlate100: { backgroundColor: '#f1f5f9' },

  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  headerInner: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  headerCount: { fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#94a3b8', paddingBottom: 4 },

  filterBar: { paddingHorizontal: 16, paddingVertical: 12 },
  filterScroll: { gap: 12, alignItems: 'center' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', height: 36, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
  filterBtnLight: { backgroundColor: '#f1f5f9' },
  filterBtnDark: { backgroundColor: 'rgba(30, 41, 59, 0.5)' },
  filterBtnActive: { backgroundColor: '#16a24e' },
  filterText: { fontSize: 13, fontWeight: '600' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 80 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, gap: 16 },
  emptyText: { fontSize: 16, fontWeight: '600' },

  tradeRow: { height: 72, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  tradeContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingLeft: 16 },

  tradeLeft: { flexDirection: 'column', justifyContent: 'center' },
  instrument: { fontSize: 16, fontWeight: '800' },
  date: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#64748b' },

  tradeMiddle: { flex: 1, alignItems: 'flex-start', paddingLeft: 16 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tagText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  tradeRight: { alignItems: 'flex-end' },
  pnl: { fontSize: 16, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  outcomeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', color: '#64748b' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  filterSectionTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  modalFilterBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  modalFilterBtnActive: { backgroundColor: '#16a24e' },
  applyBtn: { backgroundColor: '#16a24e', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
})

