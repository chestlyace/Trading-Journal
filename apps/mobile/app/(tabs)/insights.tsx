import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { useInsights } from '../../src/hooks/useInsights'

export default function InsightsScreen() {
  const { data, isLoading } = useInsights()
  const insights = data?.data ?? []

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading insights...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Insights</Text>
      <FlatList
        data={insights}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.heading}>{item.title}</Text>
            <Text>{item.body}</Text>
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
  heading: { fontWeight: '600', marginBottom: 4 },
})

