import React, { useState, useEffect, useCallback } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    useColorScheme,
    Platform,
    Modal,
    KeyboardAvoidingView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { useAuthStore } from '../src/stores/auth.store'

// ── Types ─────────────────────────────────────────────────────────────────────

type AccountType = 'LIVE' | 'DEMO' | 'PROP'

interface TradingAccount {
    id: string
    user_id: string
    name: string
    broker: string | null
    currency: string
    type: AccountType
    initial_balance: number | null
    created_at: string
    isDefault?: boolean
    // Computed from trades
    tradeCount?: number
    netPnl?: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
    { value: 'LIVE', label: 'Live' },
    { value: 'DEMO', label: 'Demo' },
    { value: 'PROP', label: 'Prop Firm' },
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NGN', 'USDT', 'BTC']

// ── Component ─────────────────────────────────────────────────────────────────

export default function TradingAccountsScreen() {
    const isDark = useColorScheme() === 'dark'
    const { user } = useAuthStore()

    const [accounts, setAccounts] = useState<TradingAccount[]>([])
    const [loading, setLoading] = useState(true)

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null)

    // Form fields
    const [formName, setFormName] = useState('')
    const [formBroker, setFormBroker] = useState('')
    const [formCurrency, setFormCurrency] = useState('USD')
    const [formType, setFormType] = useState<AccountType>('LIVE')
    const [formBalance, setFormBalance] = useState('')
    const [formSaving, setFormSaving] = useState(false)

    // Action sheet
    const [activeActionId, setActiveActionId] = useState<string | null>(null)

    const c = isDark
        ? {
            bg: '#0a0f0c',
            surface: 'rgba(22,162,78,0.05)',
            text: '#f8fafc',
            sub: '#94a3b8',
            border: 'rgba(22,162,78,0.2)',
            inputBg: 'rgba(22,162,78,0.05)',
            innerBorder: 'rgba(22,162,78,0.1)',
            modalBg: '#0f1a12',
        }
        : {
            bg: '#f6f8f7',
            surface: '#ffffff',
            text: '#0f172a',
            sub: '#64748b',
            border: '#e2e8f0',
            inputBg: '#ffffff',
            innerBorder: '#f1f5f9',
            modalBg: '#f6f8f7',
        }

    // ── Data Fetching ──────────────────────────────────────────────────────────

    const fetchAccounts = useCallback(async () => {
        if (!user) return
        setLoading(true)

        const { data, error } = await supabase
            .from('trading_accounts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })

        if (error || !data) {
            setLoading(false)
            return
        }

        // Enrich each account with trade stats
        const enriched = await Promise.all(
            data.map(async (acc) => {
                const { data: trades } = await supabase
                    .from('trades')
                    .select('net_pnl, is_open')
                    .eq('account_id', acc.id)
                    .eq('is_open', false)

                const tradeCount = trades?.length ?? 0
                const netPnl = trades?.reduce((s, t) => s + (parseFloat(t.net_pnl) || 0), 0) ?? 0

                return { ...acc, tradeCount, netPnl }
            })
        )

        // Mark first account as default if none is explicitly marked
        const withDefault = enriched.map((acc, idx) => ({
            ...acc,
            isDefault: idx === 0,
        }))

        setAccounts(withDefault)
        setLoading(false)
    }, [user])

    useEffect(() => {
        fetchAccounts()
    }, [fetchAccounts])

    // ── Form Helpers ───────────────────────────────────────────────────────────

    const openAddModal = () => {
        setEditingAccount(null)
        setFormName('')
        setFormBroker('')
        setFormCurrency('USD')
        setFormType('LIVE')
        setFormBalance('')
        setShowModal(true)
    }

    const openEditModal = (acc: TradingAccount) => {
        setActiveActionId(null)
        setEditingAccount(acc)
        setFormName(acc.name)
        setFormBroker(acc.broker ?? '')
        setFormCurrency(acc.currency)
        setFormType(acc.type)
        setFormBalance(acc.initial_balance?.toString() ?? '')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingAccount(null)
    }

    const onSave = async () => {
        if (!user) return
        if (!formName.trim()) {
            Alert.alert('Required', 'Please enter an account name.')
            return
        }

        setFormSaving(true)
        try {
            const payload = {
                user_id: user.id,
                name: formName.trim(),
                broker: formBroker.trim() || null,
                currency: formCurrency,
                type: formType,
                initial_balance: formBalance ? parseFloat(formBalance) : null,
                updated_at: new Date().toISOString(),
            }

            if (editingAccount) {
                // Update existing
                const { error } = await supabase
                    .from('trading_accounts')
                    .update(payload)
                    .eq('id', editingAccount.id)
                if (error) throw error
            } else {
                // Insert new
                const { error } = await supabase
                    .from('trading_accounts')
                    .insert({ ...payload, created_at: new Date().toISOString() })
                if (error) throw error
            }

            closeModal()
            await fetchAccounts()
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to save account.')
        } finally {
            setFormSaving(false)
        }
    }

    const onDelete = (acc: TradingAccount) => {
        setActiveActionId(null)
        Alert.alert(
            'Delete Account',
            `Are you sure you want to delete "${acc.name}"? This will not delete associated trades.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('trading_accounts')
                            .delete()
                            .eq('id', acc.id)
                        if (error) Alert.alert('Error', error.message)
                        else fetchAccounts()
                    },
                },
            ]
        )
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    const initials = (name: string) =>
        name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')

    const typeBgColor = (type: AccountType) => {
        if (type === 'LIVE') return 'rgba(22,162,78,0.15)'
        if (type === 'PROP') return 'rgba(249,115,22,0.15)'
        return isDark ? 'rgba(148,163,184,0.15)' : '#f1f5f9'
    }
    const typeTextColor = (type: AccountType) => {
        if (type === 'LIVE') return '#16a24e'
        if (type === 'PROP') return '#f97316'
        return isDark ? '#94a3b8' : '#64748b'
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: c.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={c.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: c.text }]}>Trading Accounts</Text>
                <TouchableOpacity style={styles.iconBtn} onPress={openAddModal}>
                    <MaterialIcons name="add" size={26} color="#16a24e" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loaderBox}>
                    <ActivityIndicator size="large" color="#16a24e" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {accounts.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <MaterialIcons name="account-balance-wallet" size={56} color="rgba(22,162,78,0.3)" />
                            <Text style={[styles.emptyTitle, { color: c.text }]}>No accounts yet</Text>
                            <Text style={[styles.emptySub, { color: c.sub }]}>
                                Add a trading account to start tracking your performance per broker.
                            </Text>
                        </View>
                    ) : (
                        accounts.map(acc => (
                            <View key={acc.id} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                                {/* Card top row */}
                                <View style={styles.cardTop}>
                                    {/* Avatar */}
                                    <View style={[
                                        styles.cardAvatar,
                                        { backgroundColor: acc.isDefault ? 'rgba(22,162,78,0.2)' : (isDark ? 'rgba(22,162,78,0.08)' : '#f1f5f9') }
                                    ]}>
                                        <Text style={[styles.cardAvatarText, { color: acc.isDefault ? '#16a24e' : c.sub }]}>
                                            {initials(acc.name)}
                                        </Text>
                                    </View>

                                    {/* Name + broker */}
                                    <View style={styles.cardInfo}>
                                        <View style={styles.cardNameRow}>
                                            <Text style={[styles.cardName, { color: c.text }]} numberOfLines={1}>
                                                {acc.name}
                                            </Text>
                                            {acc.isDefault && (
                                                <View style={styles.defaultBadge}>
                                                    <Text style={styles.defaultBadgeText}>Default</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.cardBroker, { color: c.sub }]} numberOfLines={1}>
                                            {acc.broker || 'No broker set'}
                                        </Text>
                                    </View>

                                    {/* Type badge + menu */}
                                    <View style={styles.cardActions}>
                                        <View style={[styles.typeBadge, { backgroundColor: typeBgColor(acc.type) }]}>
                                            <Text style={[styles.typeBadgeText, { color: typeTextColor(acc.type) }]}>
                                                {acc.type}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.moreBtn}
                                            onPress={() => setActiveActionId(activeActionId === acc.id ? null : acc.id)}
                                        >
                                            <MaterialIcons name="more-vert" size={20} color={c.sub} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Inline Action Sheet */}
                                {activeActionId === acc.id && (
                                    <View style={[styles.actionSheet, { borderColor: c.border, backgroundColor: c.bg }]}>
                                        <TouchableOpacity style={styles.actionSheetItem} onPress={() => openEditModal(acc)}>
                                            <MaterialIcons name="edit" size={16} color={c.text} />
                                            <Text style={[styles.actionSheetItemText, { color: c.text }]}>Edit Account</Text>
                                        </TouchableOpacity>
                                        <View style={[styles.actionSheetDivider, { backgroundColor: c.border }]} />
                                        <TouchableOpacity style={styles.actionSheetItem} onPress={() => onDelete(acc)}>
                                            <MaterialIcons name="delete-outline" size={16} color="#ef4444" />
                                            <Text style={[styles.actionSheetItemText, { color: '#ef4444' }]}>Delete Account</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Stats footer */}
                                <View style={[styles.cardFooter, { borderTopColor: c.innerBorder }]}>
                                    <Text style={[styles.cardStats, { color: c.sub }]}>
                                        {acc.tradeCount} trade{acc.tradeCount !== 1 ? 's' : ''} · {' '}
                                        <Text style={{ color: (acc.netPnl ?? 0) >= 0 ? '#16a24e' : '#ef4444' }}>
                                            {(acc.netPnl ?? 0) >= 0 ? '+' : '-'}${Math.abs(acc.netPnl ?? 0).toFixed(2)} net P&L
                                        </Text>
                                        {' '} · {acc.currency}
                                    </Text>
                                    {acc.initial_balance != null && (
                                        <Text style={[styles.cardBalance, { color: c.sub }]}>
                                            Starting: {acc.currency} {acc.initial_balance.toLocaleString()}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))
                    )}

                    {/* Add New Account CTA */}
                    <TouchableOpacity
                        style={[styles.addCta, { borderColor: 'rgba(22,162,78,0.4)' }]}
                        onPress={openAddModal}
                    >
                        <MaterialIcons name="add" size={20} color="#16a24e" />
                        <Text style={styles.addCtaText}>Add New Account</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}

            {/* ── Add / Edit Modal ── */}
            <Modal
                visible={showModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.modalContainer, { backgroundColor: c.modalBg }]}
                >
                    {/* Modal Header */}
                    <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
                        <TouchableOpacity onPress={closeModal} style={styles.iconBtn}>
                            <MaterialIcons name="close" size={24} color={c.text} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: c.text }]}>
                            {editingAccount ? 'Edit Account' : 'New Account'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.modalSaveBtn, formSaving && { opacity: 0.6 }]}
                            onPress={onSave}
                            disabled={formSaving}
                        >
                            {formSaving
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={styles.modalSaveBtnText}>Save</Text>
                            }
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">

                        {/* Account Name */}
                        <FormField label="Account Name" required>
                            <TextInput
                                style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.inputBg }]}
                                value={formName}
                                onChangeText={setFormName}
                                placeholder="e.g. Futures Main"
                                placeholderTextColor={c.sub}
                            />
                        </FormField>

                        {/* Broker */}
                        <FormField label="Broker / Platform">
                            <TextInput
                                style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.inputBg }]}
                                value={formBroker}
                                onChangeText={setFormBroker}
                                placeholder="e.g. Interactive Brokers"
                                placeholderTextColor={c.sub}
                            />
                        </FormField>

                        {/* Account Type */}
                        <FormField label="Account Type">
                            <View style={styles.chipRow}>
                                {ACCOUNT_TYPES.map(t => (
                                    <TouchableOpacity
                                        key={t.value}
                                        style={[
                                            styles.typeChip,
                                            formType === t.value
                                                ? { backgroundColor: typeBgColor(t.value), borderColor: typeTextColor(t.value) }
                                                : { borderColor: c.border, backgroundColor: c.inputBg }
                                        ]}
                                        onPress={() => setFormType(t.value)}
                                    >
                                        <Text style={[
                                            styles.typeChipText,
                                            { color: formType === t.value ? typeTextColor(t.value) : c.sub }
                                        ]}>
                                            {t.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </FormField>

                        {/* Currency */}
                        <FormField label="Account Currency">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                                {CURRENCIES.map(cur => (
                                    <TouchableOpacity
                                        key={cur}
                                        style={[
                                            styles.typeChip,
                                            formCurrency === cur
                                                ? { backgroundColor: 'rgba(22,162,78,0.15)', borderColor: '#16a24e' }
                                                : { borderColor: c.border, backgroundColor: c.inputBg }
                                        ]}
                                        onPress={() => setFormCurrency(cur)}
                                    >
                                        <Text style={[
                                            styles.typeChipText,
                                            { color: formCurrency === cur ? '#16a24e' : c.sub }
                                        ]}>
                                            {cur}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </FormField>

                        {/* Starting Balance */}
                        <FormField label="Starting Balance (optional)">
                            <TextInput
                                style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.inputBg }]}
                                value={formBalance}
                                onChangeText={setFormBalance}
                                placeholder="0.00"
                                placeholderTextColor={c.sub}
                                keyboardType="decimal-pad"
                            />
                        </FormField>

                        {/* Save button at bottom */}
                        <TouchableOpacity
                            style={[styles.saveBtnFull, formSaving && { opacity: 0.7 }]}
                            onPress={onSave}
                            disabled={formSaving}
                        >
                            {formSaving
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.saveBtnFullText}>
                                    {editingAccount ? 'Save Changes' : 'Create Account'}
                                </Text>
                            }
                        </TouchableOpacity>

                        <View style={{ height: 60 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>

        </SafeAreaView>
    )
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <View style={styles.formField}>
            <Text style={styles.formLabel}>
                {label}{required ? <Text style={{ color: '#ef4444' }}> *</Text> : ''}
            </Text>
            {children}
        </View>
    )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    loaderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    iconBtn: { width: 40, padding: 4, alignItems: 'center' },

    scrollContent: { padding: 20, gap: 16 },

    // ── Empty ──
    emptyBox: { alignItems: 'center', paddingVertical: 64, gap: 16, paddingHorizontal: 32 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold' },
    emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

    // ── Card ──
    card: {
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
        padding: 0,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
    },
    cardAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    cardAvatarText: { fontSize: 14, fontWeight: 'bold' },
    cardInfo: { flex: 1, gap: 3 },
    cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    cardName: { fontSize: 15, fontWeight: 'bold' },
    defaultBadge: {
        backgroundColor: 'rgba(22,162,78,0.12)',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    defaultBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#16a24e',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cardBroker: { fontSize: 13 },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
    typeBadge: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    moreBtn: { padding: 4 },

    // ── Inline Action Sheet ──
    actionSheet: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderRadius: 10,
        overflow: 'hidden',
    },
    actionSheetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 13,
    },
    actionSheetItemText: { fontSize: 14, fontWeight: '500' },
    actionSheetDivider: { height: 1 },

    cardFooter: {
        borderTopWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 4,
    },
    cardStats: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    cardBalance: {
        fontSize: 11,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },

    // ── Add CTA ──
    addCta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 18,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 16,
        marginTop: 4,
    },
    addCtaText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#16a24e',
    },

    // ── Modal ──
    modalContainer: { flex: 1 },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'ios' ? 24 : 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalSaveBtn: {
        backgroundColor: '#16a24e',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    modalSaveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    modalScroll: { padding: 24, gap: 24 },

    formField: { gap: 8 },
    formLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        color: '#64748b',
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
    },

    chipRow: { flexDirection: 'row', gap: 8 },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 8,
    },
    typeChipText: { fontSize: 13, fontWeight: '600' },

    saveBtnFull: {
        backgroundColor: '#16a24e',
        paddingVertical: 17,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    saveBtnFullText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
})
