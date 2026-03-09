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

export default function NewTradeStep4() {
    const isDark = useColorScheme() === 'dark'
    const store = useTradeFormStore()

    // Calculate generic math for display
    const pos = parseFloat(store.positionSize) || 0
    const sl = parseFloat(store.stopLoss) || 0
    const tp = parseFloat(store.takeProfit) || 0
    const entry = parseFloat(store.entryPrice) || 0

    let riskReward = '—'
    let potentialLoss = '—'

    if (entry > 0 && pos > 0) {
        const units = pos
        if (sl > 0) {
            const lossAmt = (store.direction === 'LONG') ? (entry - sl) * units : (sl - entry) * units
            if (lossAmt > 0) potentialLoss = `-$${lossAmt.toFixed(2)}`

            if (tp > 0) {
                const profitAmt = (store.direction === 'LONG') ? (tp - entry) * units : (entry - tp) * units
                if (profitAmt > 0) {
                    const ratio = (profitAmt / lossAmt).toFixed(1)
                    riskReward = `1:${ratio}`
                }
            }
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}
        >
            <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <MaterialIcons name="arrow-back" size={28} color={isDark ? '#f8fafc' : '#0f172a'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>New Trade</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.progressSection}>
                    <View style={styles.progressTop}>
                        <Text style={styles.stepLabel}>Step 4 of 6</Text>
                        <Text style={styles.stepCount}>66%</Text>
                    </View>
                    <View style={[styles.progressBarBg, isDark ? styles.progressBgDark : styles.progressBgLight]}>
                        <View style={[styles.progressBarFill, { width: '66.6%' }]} />
                    </View>
                </View>

                <View style={styles.titleSection}>
                    <Text style={[styles.mainTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Position & Risk</Text>
                    <Text style={[styles.subTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Define your exposure and risk parameters for this entry.</Text>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.field}>
                        <Text style={styles.label}>Position Size (Shares / Units / Lots)</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.inputPrimary, { color: isDark ? '#f8fafc' : '#0f172a' }, isDark ? styles.borderDark : styles.borderLight]}
                                placeholder="0.00"
                                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                                keyboardType="decimal-pad"
                                value={store.positionSize}
                                onChangeText={(val) => store.updateField('positionSize', val)}
                            />
                            <Text style={styles.unitRight}>UNITS</Text>
                        </View>
                    </View>

                    <View style={styles.gridFields}>
                        <View style={[styles.field, { flex: 1 }]}>
                            <Text style={styles.labelSecondary}>Stop Loss</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.inputSecondary, { color: isDark ? '#f8fafc' : '#0f172a' }, isDark ? styles.borderDark : styles.borderLight]}
                                    placeholder="0.00"
                                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                                    keyboardType="decimal-pad"
                                    value={store.stopLoss}
                                    onChangeText={(val) => store.updateField('stopLoss', val)}
                                />
                            </View>
                        </View>
                        <View style={[styles.field, { flex: 1 }]}>
                            <Text style={styles.labelSecondary}>Take Profit</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.inputSecondary, { color: isDark ? '#f8fafc' : '#0f172a' }, isDark ? styles.borderDark : styles.borderLight]}
                                    placeholder="0.00"
                                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                                    keyboardType="decimal-pad"
                                    value={store.takeProfit}
                                    onChangeText={(val) => store.updateField('takeProfit', val)}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.labelSecondary}>Estimated Fees</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.inputSecondary, { color: isDark ? '#f8fafc' : '#0f172a' }, isDark ? styles.borderDark : styles.borderLight]}
                                placeholder="0.00"
                                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                                keyboardType="decimal-pad"
                                value={store.fees}
                                onChangeText={(val) => store.updateField('fees', val)}
                            />
                            <Text style={styles.unitRightSmall}>USD</Text>
                        </View>
                    </View>

                    <View style={[styles.summaryCard, isDark ? styles.borderDark : styles.borderLight]}>
                        <View>
                            <Text style={styles.summaryLabel}>Risk/Reward Ratio</Text>
                            <Text style={[styles.summaryValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{riskReward}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.summaryLabel}>Potential Loss</Text>
                            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{potentialLoss}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, isDark ? styles.borderDark : styles.borderLight, { backgroundColor: isDark ? 'rgba(17,33,23,0.8)' : 'rgba(246,248,247,0.8)' }]}>
                <TouchableOpacity style={[styles.btnOutline, isDark ? styles.borderDark : styles.borderLight]} onPress={() => router.back()}>
                    <Text style={[styles.btnOutlineText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/trade/step-5')}>
                    <Text style={styles.btnPrimaryText}>Continue</Text>
                    <MaterialIcons name="arrow-forward" size={16} color="#fff" />
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
    progressBgDark: { backgroundColor: 'rgba(22, 162, 78, 0.1)' },

    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: Platform.OS === 'ios' ? 64 : 24, borderBottomWidth: 1, justifyContent: 'space-between' },
    iconBtn: { padding: 4 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
    headerSpacer: { width: 40 },

    scrollContent: { paddingBottom: 150 },

    progressSection: { paddingHorizontal: 24, paddingVertical: 16, gap: 12 },
    progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stepLabel: { fontSize: 14, fontWeight: 'bold', color: '#16a24e', textTransform: 'uppercase', letterSpacing: 1 },
    stepCount: { fontSize: 14, color: '#64748b', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#16a24e' },

    titleSection: { paddingHorizontal: 24, marginBottom: 32 },
    mainTitle: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
    subTitle: { fontSize: 16 },

    formSection: { paddingHorizontal: 24, gap: 32 },
    field: { gap: 8 },
    gridFields: { flexDirection: 'row', gap: 24 },

    label: { fontSize: 12, fontWeight: 'bold', color: '#16a24e', textTransform: 'uppercase', letterSpacing: 1 },
    labelSecondary: { fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },

    inputContainer: { position: 'relative', justifyContent: 'center' },
    inputPrimary: { borderBottomWidth: 2, paddingVertical: 16, fontSize: 32, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', paddingRight: 60 },
    inputSecondary: { borderBottomWidth: 2, paddingVertical: 16, fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', paddingRight: 40 },

    unitRight: { position: 'absolute', right: 0, bottom: 20, fontSize: 14, color: '#94a3b8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    unitRightSmall: { position: 'absolute', right: 0, bottom: 16, fontSize: 12, color: '#94a3b8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

    summaryCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, borderRadius: 12, backgroundColor: 'rgba(22, 162, 78, 0.05)', borderWidth: 1, marginTop: 16 },
    summaryLabel: { fontSize: 10, fontWeight: 'bold', color: '#16a24e', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
    summaryValue: { fontSize: 24, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

    footer: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', padding: 24, borderTopWidth: 1, gap: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    btnOutline: { flex: 1, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
    btnOutlineText: { fontSize: 16, fontWeight: 'bold' },
    btnPrimary: { flex: 2, backgroundColor: '#16a24e', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 8, shadowColor: '#16a24e', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 },
    btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
