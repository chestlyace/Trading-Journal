import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import type { TradeFilters } from '@tradge/types'
import { useTrades } from '../../src/hooks/useTrades'

export default function TradesScreen() {
  const filters: TradeFilters = {}
  const { data, isLoading } = useTrades(filters)
  const trades = data?.data ?? []

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading trades...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trades</Text>
      <FlatList
        data={trades}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.instrument}>{item.instrument}</Text>
            <Text>{item.direction}</Text>
            <Text>{item.netPnl}</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  instrument: { fontWeight: '600' },
})

