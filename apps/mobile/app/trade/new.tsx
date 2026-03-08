import React from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useColorScheme,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useTradeFormStore } from '../../src/stores/trade-form.store'

const ASSET_CLASSES = ['CRYPTO', 'FOREX', 'STOCKS', 'COMMODITIES'] as const

export default function NewTradeStep1() {
  const isDark = useColorScheme() === 'dark'
  const store = useTradeFormStore()

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
    >
      {/* Header */}
      <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>New Trade</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressTop}>
            <View>
              <Text style={styles.stepLabel}>Step 1 of 6</Text>
              <Text style={[styles.stepTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Trade Definition
              </Text>
            </View>
            <Text style={styles.stepCount}>1/6</Text>
          </View>
          <View style={[styles.progressBarBg, isDark ? styles.progressBgDark : styles.progressBgLight]}>
            <View style={[styles.progressBarFill, { width: '16.66%' }]} />
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.field}>
            <Text style={styles.label}>Instrument</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight, { color: isDark ? '#f8fafc' : '#0f172a' }]}
              placeholder="e.g. BTC/USDT"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              value={store.instrument}
              onChangeText={(val) => store.updateField('instrument', val.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Asset Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
              {ASSET_CLASSES.map((ac) => {
                const isActive = store.assetClass === ac
                return (
                  <TouchableOpacity
                    key={ac}
                    style={[
                      styles.chip,
                      isActive ? styles.chipActive : (isDark ? styles.chipDark : styles.chipLight)
                    ]}
                    onPress={() => store.updateField('assetClass', ac)}
                  >
                    <Text style={[
                      styles.chipText,
                      isActive ? { color: '#fff' } : (isDark ? { color: '#f8fafc' } : { color: '#0f172a' })
                    ]}>
                      {ac}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Direction</Text>
            <View style={[styles.directionGrid, isDark ? styles.borderDark : styles.borderLight]}>
              <TouchableOpacity
                style={[
                  styles.directionBtn,
                  store.direction === 'LONG' ? styles.directionBtnActive : (isDark ? styles.directionBtnDark : styles.directionBtnLight)
                ]}
                onPress={() => store.updateField('direction', 'LONG')}
              >
                <MaterialIcons name="trending-up" size={20} color={store.direction === 'LONG' ? '#fff' : '#94a3b8'} />
                <Text style={[styles.directionText, store.direction === 'LONG' ? { color: '#fff' } : { color: '#94a3b8' }]}>
                  LONG
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.directionBtn,
                  store.direction === 'SHORT' ? styles.directionBtnActive : (isDark ? styles.directionBtnDark : styles.directionBtnLight)
                ]}
                onPress={() => store.updateField('direction', 'SHORT')}
              >
                <MaterialIcons name="trending-down" size={20} color={store.direction === 'SHORT' ? '#fff' : '#94a3b8'} />
                <Text style={[styles.directionText, store.direction === 'SHORT' ? { color: '#fff' } : { color: '#94a3b8' }]}>
                  SHORT
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Context Card */}
          <View style={[styles.contextCard, isDark ? styles.borderDark : styles.borderLight]}>
            <View style={styles.contextHeader}>
              <Text style={styles.contextLabel}>Market Status</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.contextText}>
              Defining your trade parameters is the first step toward disciplined execution. Ensure the instrument name matches your primary exchange ticker.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, isDark ? styles.borderDark : styles.borderLight]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/trade/step-2')}
          disabled={!store.instrument || !store.assetClass}
        >
          <Text style={styles.primaryBtnText}>Next Step</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  bgLight: { backgroundColor: '#f6f8f7' },
  bgDark: { backgroundColor: '#112117' },
  borderLight: { borderColor: 'rgba(22, 162, 78, 0.2)' },
  borderDark: { borderColor: 'rgba(22, 162, 78, 0.2)' },
  progressBgLight: { backgroundColor: 'rgba(22, 162, 78, 0.1)' },
  progressBgDark: { backgroundColor: 'rgba(22, 162, 78, 0.05)' },

  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 64 : 24,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  backButton: { width: 40, alignItems: 'flex-start' },
  headerSpacer: { width: 40 },

  progressSection: { marginBottom: 32 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  stepLabel: { fontSize: 12, fontWeight: 'bold', color: '#16a24e', textTransform: 'uppercase', letterSpacing: 1 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  stepCount: { fontSize: 14, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', opacity: 0.6 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#16a24e' },

  formSection: { gap: 32 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  input: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontWeight: '500',
  },
  inputLight: { borderColor: 'rgba(22, 162, 78, 0.2)', backgroundColor: 'transparent' },
  inputDark: { borderColor: 'rgba(22, 162, 78, 0.1)', backgroundColor: 'transparent' },
  inputActive: { borderColor: '#16a24e' },

  chipsContainer: { gap: 12, paddingVertical: 4 },
  chip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 1 },
  chipActive: { backgroundColor: '#16a24e', borderColor: '#16a24e' },
  chipLight: { backgroundColor: 'rgba(22, 162, 78, 0.05)', borderColor: 'rgba(22, 162, 78, 0.2)' },
  chipDark: { backgroundColor: 'rgba(22, 162, 78, 0.1)', borderColor: 'rgba(22, 162, 78, 0.2)' },
  chipText: { fontSize: 14, fontWeight: 'bold' },

  directionGrid: { flexDirection: 'row', borderWidth: 2, borderRadius: 12, overflow: 'hidden' },
  directionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  directionBtnActive: { backgroundColor: '#16a24e' },
  directionBtnLight: { backgroundColor: 'transparent' },
  directionBtnDark: { backgroundColor: 'transparent' },
  directionText: { fontWeight: 'bold', fontSize: 16, letterSpacing: -0.5 },

  contextCard: {
    padding: 24,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 162, 78, 0.05)',
    marginTop: 16,
  },
  contextHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  contextLabel: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.5 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a24e' },
  liveText: { fontSize: 10, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  contextText: { fontSize: 14, opacity: 0.6, lineHeight: 24 },

  footer: {
    padding: 24,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a24e',
    paddingVertical: 20,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
