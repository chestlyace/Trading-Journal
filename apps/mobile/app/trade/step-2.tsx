import React, { useEffect, useState } from 'react'
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
import { supabase } from '../../src/lib/supabase'
import { useAuthStore } from '../../src/stores/auth.store'
import DateTimePicker from '@react-native-community/datetimepicker'

export default function NewTradeStep2() {
    const isDark = useColorScheme() === 'dark'
    const store = useTradeFormStore()
    const { user } = useAuthStore()

    const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])

    useEffect(() => {
        async function loadAccounts() {
            if (!user) return
            const { data } = await supabase
                .from('trading_accounts')
                .select('id, name')
                .eq('user_id', user.id)

            if (data && data.length > 0) {
                setAccounts(data)
                if (!store.accountId) {
                    store.updateField('accountId', data[0].id)
                }
            }
        }
        loadAccounts()
    }, [user])

    const [showPicker, setShowPicker] = useState(false)
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date')

    const currentEntryDate = store.entryTime ? new Date(store.entryTime) : new Date()

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false)
        }
        if (selectedDate) {
            // Keep the selected date, but if mode was date, maybe open time picker next
            const newDateStr = selectedDate.toISOString()
            store.updateField('entryTime', newDateStr)

            if (Platform.OS === 'android' && pickerMode === 'date') {
                setPickerMode('time')
                setShowPicker(true)
            }
        }
    }

    const formattedDate = store.entryTime
        ? new Date(store.entryTime).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : 'Select Date & Time'

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
                <TouchableOpacity onPress={() => { store.reset(); router.replace('/(tabs)') }} style={styles.iconBtn}>
                    <MaterialIcons name="close" size={28} color={isDark ? '#f8fafc' : '#0f172a'} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.progressSection}>
                    <View style={styles.progressTop}>
                        <Text style={styles.stepLabel}>Step 2: Timing & Price</Text>
                        <Text style={styles.stepCount}>02 / 06</Text>
                    </View>
                    <View style={[styles.progressBarBg, isDark ? styles.progressBgDark : styles.progressBgLight]}>
                        <View style={[styles.progressBarFill, { width: '33.33%' }]} />
                    </View>
                </View>

                <View style={styles.titleSection}>
                    <Text style={[styles.mainTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                        Timing &{'\n'}Price
                    </Text>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.field}>
                        <Text style={styles.label}>Entry Date/Time</Text>
                        <TouchableOpacity
                            style={[styles.inputRow, styles.borderActive]}
                            onPress={() => {
                                setPickerMode('date')
                                setShowPicker(true)
                            }}
                        >
                            <Text style={[styles.input, { color: store.entryTime ? (isDark ? '#f8fafc' : '#0f172a') : (isDark ? '#475569' : '#94a3b8') }]}>
                                {formattedDate}
                            </Text>
                            <MaterialIcons name="calendar-today" size={24} color="#16a24e" />
                        </TouchableOpacity>

                        {showPicker && (
                            <DateTimePicker
                                value={currentEntryDate}
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
                        <Text style={styles.label}>Entry Price</Text>
                        <View style={[styles.inputRow, styles.borderActive]}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={[styles.inputLarge, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                                placeholder="0.00"
                                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                                value={store.entryPrice}
                                onChangeText={(val) => store.updateField('entryPrice', val)}
                                keyboardType="decimal-pad"
                            />
                            <MaterialIcons name="payments" size={24} color="#94a3b8" />
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Select Account</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                            {accounts.map((ac) => {
                                const isActive = store.accountId === ac.id
                                return (
                                    <TouchableOpacity
                                        key={ac.id}
                                        style={[
                                            styles.chip,
                                            isActive ? styles.chipActive : (isDark ? styles.chipDark : styles.chipLight)
                                        ]}
                                        onPress={() => store.updateField('accountId', ac.id)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            isActive ? { color: '#fff' } : (isDark ? { color: '#f8fafc' } : { color: '#0f172a' })
                                        ]}>
                                            {ac.name}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </ScrollView>
                    </View>

                    <View style={[styles.infoCard, isDark ? styles.borderDark : styles.borderLight]}>
                        <MaterialIcons name="info" size={20} color="#16a24e" />
                        <Text style={styles.infoText}>
                            Prices are manually entered. Ensure your entry price matches your execution receipt.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, isDark ? styles.borderDark : styles.borderLight, { backgroundColor: isDark ? '#112117' : '#f6f8f7' }]}>
                <TouchableOpacity style={[styles.btnOutline, isDark ? styles.borderDark : styles.borderLight]} onPress={() => router.back()}>
                    <Text style={[styles.btnOutlineText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.btnPrimary}
                    disabled={!store.entryPrice || !store.accountId}
                    onPress={() => router.push('/trade/step-3')}
                >
                    <Text style={styles.btnPrimaryText}>Next Step</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 64 : 24,
        justifyContent: 'space-between',
    },
    iconBtn: { padding: 4 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },

    scrollContent: { paddingBottom: 120 },

    progressSection: { paddingHorizontal: 24, paddingVertical: 16, gap: 12 },
    progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    stepLabel: { fontSize: 12, fontWeight: 'bold', color: '#16a24e', textTransform: 'uppercase', letterSpacing: 1 },
    stepCount: { fontSize: 14, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', opacity: 0.8 },
    progressBarBg: { height: 4 },
    progressBarFill: { height: '100%', backgroundColor: '#16a24e' },

    titleSection: { paddingHorizontal: 24, paddingVertical: 32 },
    mainTitle: { fontSize: 36, fontWeight: '800', letterSpacing: -1, lineHeight: 40 },

    formSection: { paddingHorizontal: 24, gap: 32 },
    field: { gap: 8 },
    label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2 },
    borderActive: { borderBottomColor: '#16a24e' },
    input: { flex: 1, paddingVertical: 16, fontSize: 18, fontWeight: '500' },
    inputLarge: { flex: 1, paddingVertical: 16, fontSize: 28, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    currencySymbol: { fontSize: 24, fontWeight: 'bold', color: '#16a24e', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', paddingRight: 8 },

    chipsContainer: { gap: 12, paddingVertical: 4 },
    chip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 1 },
    chipActive: { backgroundColor: '#16a24e', borderColor: '#16a24e' },
    chipLight: { backgroundColor: 'rgba(22, 162, 78, 0.05)', borderColor: 'rgba(22, 162, 78, 0.2)' },
    chipDark: { backgroundColor: 'rgba(22, 162, 78, 0.1)', borderColor: 'rgba(22, 162, 78, 0.2)' },
    chipText: { fontSize: 14, fontWeight: 'bold' },

    infoCard: { flexDirection: 'row', gap: 12, padding: 16, borderWidth: 1, backgroundColor: 'rgba(22, 162, 78, 0.05)', marginTop: 16 },
    infoText: { flex: 1, fontSize: 14, color: '#64748b', lineHeight: 22 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 24, borderTopWidth: 1, gap: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    btnOutline: { flex: 1, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    btnOutlineText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    btnPrimary: { flex: 2, backgroundColor: '#16a24e', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    btnPrimaryText: { color: '#112117', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
})
