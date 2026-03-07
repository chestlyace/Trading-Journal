import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native'
import { useCreateTrade } from '../../src/hooks/useTrades'

export default function NewTradeScreen() {
  const createTrade = useCreateTrade()
  const [accountId, setAccountId] = useState('')
  const [instrument, setInstrument] = useState('')
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG')
  const [entryPrice, setEntryPrice] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [positionSize, setPositionSize] = useState('')

  const onSubmit = async () => {
    await createTrade.mutateAsync({
      accountId,
      instrument,
      assetClass: 'FOREX',
      direction,
      entryPrice: Number(entryPrice),
      exitPrice: exitPrice ? Number(exitPrice) : undefined,
      entryTime: new Date().toISOString(),
      exitTime: exitPrice ? new Date().toISOString() : undefined,
      positionSize: Number(positionSize),
      fees: 0,
      isDraft: false,
      strategyTags: [],
      mistakeTags: [],
    } as any)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>New Trade</Text>
      <TextInput
        style={styles.input}
        placeholder="Account ID"
        value={accountId}
        onChangeText={setAccountId}
      />
      <TextInput
        style={styles.input}
        placeholder="Instrument"
        value={instrument}
        onChangeText={setInstrument}
      />
      <TextInput
        style={styles.input}
        placeholder="Direction (LONG/SHORT)"
        value={direction}
        onChangeText={(v) =>
          setDirection(v.toUpperCase() === 'SHORT' ? 'SHORT' : 'LONG')
        }
      />
      <TextInput
        style={styles.input}
        placeholder="Entry price"
        keyboardType="decimal-pad"
        value={entryPrice}
        onChangeText={setEntryPrice}
      />
      <TextInput
        style={styles.input}
        placeholder="Exit price"
        keyboardType="decimal-pad"
        value={exitPrice}
        onChangeText={setExitPrice}
      />
      <TextInput
        style={styles.input}
        placeholder="Position size"
        keyboardType="decimal-pad"
        value={positionSize}
        onChangeText={setPositionSize}
      />
      <Button title="Save trade" onPress={onSubmit} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
})

