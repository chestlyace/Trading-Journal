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
import DateTimePicker from '@react-native-community/datetimepicker'
import { useState } from 'react'

export default function NewTradeStep3() {
    const isDark = useColorScheme() === 'dark'
    const store = useTradeFormStore()

    const [showPicker, setShowPicker] = useState(false)
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date')

    const currentExitDate = store.exitTime ? new Date(store.exitTime) : new Date()

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false)
        }
        if (selectedDate) {
            const newDateStr = selectedDate.toISOString()
            store.updateField('exitTime', newDateStr)

            if (Platform.OS === 'android' && pickerMode === 'date') {
                setPickerMode('time')
                setShowPicker(true)
            }
        }
    }

    const formattedDate = store.exitTime
        ? new Date(store.exitTime).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : 'Select Date & Time (Optional)'

    // Calculate generic simulated P&L for Step 3 Preview based on Entry / Exit difference
    const entry = parseFloat(store.entryPrice)
    const exit = parseFloat(store.exitPrice)
    const pnlPreview = (!isNaN(entry) && !isNaN(exit) && entry > 0)
        ? (store.direction === 'LONG' ? (exit - entry) / entry * 100 : (entry - exit) / entry * 100)
        : 0
    const isPositive = pnlPreview >= 0

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
                        <Text style={[styles.stepLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Exit Details</Text>
                        <Text style={styles.stepCount}>3 / 6</Text>
                    </View>
                    <View style={[styles.progressBarBg, isDark ? styles.progressBgDark : styles.progressBgLight]}>
                        <View style={[styles.progressBarFill, { width: '50%' }]} />
                    </View>
                </View>

                <View style={styles.titleSection}>
                    <Text style={[styles.mainTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Exit Details</Text>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.field}>
                        <Text style={[styles.label, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Exit Date & Time</Text>
                        <TouchableOpacity
                            style={styles.inputContainer}
                            onPress={() => {
                                setPickerMode('date')
                                setShowPicker(true)
                            }}
                        >
                            <Text style={[styles.input, { color: store.exitTime ? (isDark ? '#f8fafc' : '#0f172a') : (isDark ? '#475569' : '#94a3b8') }]}>
                                {formattedDate}
                            </Text>
                            <MaterialIcons name="calendar-today" size={24} color="rgba(22, 162, 78, 0.6)" />
                        </TouchableOpacity>

                        {showPicker && (
                            <DateTimePicker
                                value={currentExitDate}
                                mode={pickerMode}
                                is24Hour={true}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onDateChange}
                                themeVariant={isDark ? 'dark' : 'light'}
                                maximumDate={new Date()}
                            />
                        )}
                        {Platform.OS === 'ios' && showPicker && (
                            <TouchableOpacity
                                style={{ alignSelf: 'flex-end', padding: 8, marginTop: 4, backgroundColor: '#16a24e', borderRadius: 8 }}
                                onPress={() => setShowPicker(false)}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Done</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Exit Price</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.inputLarge, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                                placeholder="0.00"
                                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                                keyboardType="decimal-pad"
                                value={store.exitPrice}
                                onChangeText={(val) => store.updateField('exitPrice', val)}
                            />
                            <MaterialIcons name="payments" size={24} color="rgba(22, 162, 78, 0.6)" />
                        </View>
                    </View>

                    <View style={[styles.previewCard, isDark ? styles.borderDark : styles.borderLight]}>
                        <View style={styles.previewBgIcon}>
                            <MaterialIcons name="analytics" size={72} color="rgba(22, 162, 78, 0.1)" />
                        </View>
                        <Text style={[styles.previewLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>ESTIMATED P&L PREVIEW (PERCENTAGE)</Text>
                        <View style={styles.previewRow}>
                            <Text style={[styles.previewPnl, { color: pnlPreview === 0 ? '#64748b' : (isPositive ? '#16a24e' : '#ef4444') }]}>
                                {pnlPreview > 0 ? '+' : ''}{pnlPreview.toFixed(2)}%
                            </Text>
                        </View>
                        <Text style={[styles.previewSub, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                            Calculated based on entry of ${store.entryPrice || '0.00'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.push('/trade/step-4')}
                >
                    <Text style={styles.primaryBtnText}>Continue to Risk</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </ScrollView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 64 : 24,
        borderBottomWidth: 1,
        justifyContent: 'space-between',
    },
    iconBtn: { padding: 4 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
    headerSpacer: { width: 40 },

    scrollContent: { paddingBottom: 60 },

    progressSection: { paddingHorizontal: 24, paddingVertical: 16, gap: 12 },
    progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stepLabel: { fontSize: 14, fontWeight: '500', opacity: 0.8 },
    stepCount: { fontSize: 14, fontWeight: 'bold', color: '#16a24e', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#16a24e' },

    titleSection: { paddingHorizontal: 24, marginBottom: 32 },
    mainTitle: { fontSize: 32, fontWeight: 'bold' },

    formSection: { paddingHorizontal: 24, gap: 24, marginBottom: 48 },
    field: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(22, 162, 78, 0.05)', borderWidth: 1, borderColor: 'rgba(22, 162, 78, 0.2)', borderRadius: 12, paddingHorizontal: 16 },
    input: { flex: 1, paddingVertical: 16, fontSize: 16 },
    inputLarge: { flex: 1, paddingVertical: 16, fontSize: 20, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' },

    previewCard: { marginTop: 40, padding: 24, borderRadius: 16, backgroundColor: 'rgba(22, 162, 78, 0.1)', borderWidth: 1, position: 'relative', overflow: 'hidden' },
    previewBgIcon: { position: 'absolute', top: 16, right: 16 },
    previewLabel: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6, marginBottom: 8 },
    previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    previewPnl: { fontSize: 36, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    previewSub: { fontSize: 12, opacity: 0.5, fontStyle: 'italic', marginTop: 12 },

    primaryBtn: {
        marginHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#16a24e',
        paddingVertical: 20,
        borderRadius: 12,
        shadowColor: '#16a24e',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
