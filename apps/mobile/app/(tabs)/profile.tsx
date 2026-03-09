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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { supabase } from '../../src/lib/supabase'
import { useAuthStore } from '../../src/stores/auth.store'
import { router } from 'expo-router'

// ── Constants ────────────────────────────────────────────────────────────────

const TIMEZONES = [
    { label: 'UTC (GMT+0)', value: 'UTC' },
    { label: 'Eastern Standard Time (GMT-5)', value: 'EST' },
    { label: 'Central Standard Time (GMT-6)', value: 'CST' },
    { label: 'Mountain Standard Time (GMT-7)', value: 'MST' },
    { label: 'Pacific Standard Time (GMT-8)', value: 'PST' },
    { label: 'Central European Time (GMT+1)', value: 'CET' },
    { label: 'Eastern European Time (GMT+2)', value: 'EET' },
    { label: 'Gulf Standard Time (GMT+4)', value: 'GST' },
    { label: 'India Standard Time (GMT+5:30)', value: 'IST' },
    { label: 'China Standard Time (GMT+8)', value: 'CST+8' },
    { label: 'Japan Standard Time (GMT+9)', value: 'JST' },
    { label: 'Australian Eastern Time (GMT+10)', value: 'AET' },
]

const CURRENCIES = [
    { label: 'USD – United States Dollar', value: 'USD' },
    { label: 'EUR – Euro', value: 'EUR' },
    { label: 'GBP – British Pound', value: 'GBP' },
    { label: 'JPY – Japanese Yen', value: 'JPY' },
    { label: 'AUD – Australian Dollar', value: 'AUD' },
    { label: 'CAD – Canadian Dollar', value: 'CAD' },
    { label: 'CHF – Swiss Franc', value: 'CHF' },
    { label: 'NGN – Nigerian Naira', value: 'NGN' },
    { label: 'ZAR – South African Rand', value: 'ZAR' },
]

const TRADING_STYLES = [
    'Day Trader',
    'Swing Trader',
    'Scalper',
    'Position Trader',
    'Momentum',
]

// ── Menu section types ────────────────────────────────────────────────────────
type MenuView = 'main' | 'profile'

// ── Component ────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
    const isDark = useColorScheme() === 'dark'
    const { user, profile, refreshProfile } = useAuthStore()

    const [view, setView] = useState<MenuView>('main')

    // Profile fields
    const [displayName, setDisplayName] = useState('')
    const [timezone, setTimezone] = useState('UTC')
    const [homeCurrency, setHomeCurrency] = useState('USD')
    const [tradingStyles, setTradingStyles] = useState<string[]>([])

    const [saving, setSaving] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const [showTimezones, setShowTimezones] = useState(false)
    const [showCurrencies, setShowCurrencies] = useState(false)

    const c = isDark
        ? {
            bg: '#0a0f0c',
            surface: '#121d16',
            surfaceAlt: 'rgba(22,162,78,0.04)',
            text: '#f8fafc',
            sub: '#94a3b8',
            border: '#1e2d22',
            divider: 'rgba(22,162,78,0.12)',
            inputBg: 'rgba(22,162,78,0.05)',
            sectionBg: 'rgba(22,162,78,0.06)',
        }
        : {
            bg: '#f6f8f7',
            surface: '#ffffff',
            surfaceAlt: 'rgba(22,162,78,0.03)',
            text: '#0f172a',
            sub: '#64748b',
            border: '#e2e8f0',
            divider: '#e2e8f0',
            inputBg: '#fff',
            sectionBg: 'rgba(0,0,0,0.03)',
        }

    // Populate form from store profile on mount / view change
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.displayName ?? '')
            setTimezone(profile.timezone ?? 'UTC')
            setHomeCurrency(profile.homeCurrency ?? 'USD')
            setTradingStyles(Array.isArray(profile.tradingStyle) ? profile.tradingStyle : [])
        }
    }, [profile, view])

    // ── Helpers ────────────────────────────────────────────────────────────────

    const initials = useCallback(() => {
        const name = profile?.displayName || user?.email || ''
        return name.split(/\s+|@/).filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('')
    }, [profile, user])

    const toggleStyle = (style: string) => {
        setTradingStyles(prev =>
            prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
        )
    }

    // ── Actions ────────────────────────────────────────────────────────────────

    const onSaveProfile = async () => {
        if (!user) return
        setSaving(true)
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    display_name: displayName.trim() || null,
                    timezone,
                    home_currency: homeCurrency,
                    trading_style: tradingStyles,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)

            if (error) throw error
            await refreshProfile()
            Alert.alert('Saved', 'Profile updated successfully.')
            setView('main')
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to save profile.')
        } finally {
            setSaving(false)
        }
    }

    const onLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        setLoggingOut(true)
                        try {
                            await supabase.auth.signOut()
                            router.replace('/(auth)/login')
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to sign out.')
                        } finally {
                            setLoggingOut(false)
                        }
                    },
                },
            ]
        )
    }

    // ── Renders ────────────────────────────────────────────────────────────────

    if (view === 'profile') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: c.border }]}>
                    <TouchableOpacity onPress={() => setView('main')} style={styles.iconBtn}>
                        <MaterialIcons name="arrow-back" size={24} color={c.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: c.text }]}>Profile Information</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">

                    {/* Avatar */}
                    <View style={styles.avatarSection}>
                        <View style={[styles.avatar, { backgroundColor: c.surface, borderColor: '#16a24e' }]}>
                            <Text style={styles.avatarInitials}>{initials()}</Text>
                        </View>
                        <TouchableOpacity style={[styles.changePhotoBtn, { borderColor: c.border }]}>
                            <Text style={[styles.changePhotoText, { color: c.sub }]}>Change photo</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formBlock}>

                        {/* Display Name */}
                        <View style={styles.formField}>
                            <Text style={[styles.fieldLabel, { color: c.sub }]}>Display Name</Text>
                            <TextInput
                                style={[styles.fieldInput, { color: c.text, borderColor: c.border, backgroundColor: c.inputBg }]}
                                value={displayName}
                                onChangeText={setDisplayName}
                                placeholder="Your name"
                                placeholderTextColor={c.sub}
                            />
                        </View>

                        {/* Email (read only) */}
                        <View style={styles.formField}>
                            <View style={styles.fieldLabelRow}>
                                <Text style={[styles.fieldLabel, { color: c.sub }]}>Email Address</Text>
                                <Text style={styles.fieldLabelAction}>Read Only</Text>
                            </View>
                            <View style={[styles.fieldReadOnly, { borderColor: c.border, backgroundColor: c.sectionBg }]}>
                                <Text style={[styles.fieldReadOnlyText, { color: c.sub }]} numberOfLines={1}>
                                    {user?.email ?? '—'}
                                </Text>
                            </View>
                        </View>

                        {/* Timezone */}
                        <View style={styles.formField}>
                            <Text style={[styles.fieldLabel, { color: c.sub }]}>Timezone</Text>
                            <TouchableOpacity
                                style={[styles.selectBtn, { borderColor: c.border, backgroundColor: c.inputBg }]}
                                onPress={() => { setShowTimezones(!showTimezones); setShowCurrencies(false) }}
                            >
                                <Text style={[styles.selectBtnText, { color: c.text }]} numberOfLines={1}>
                                    {TIMEZONES.find(t => t.value === timezone)?.label ?? timezone}
                                </Text>
                                <MaterialIcons name={showTimezones ? 'expand-less' : 'expand-more'} size={20} color={c.sub} />
                            </TouchableOpacity>
                            {showTimezones && (
                                <View style={[styles.dropdown, { backgroundColor: c.surface, borderColor: c.border }]}>
                                    {TIMEZONES.map(t => (
                                        <TouchableOpacity
                                            key={t.value}
                                            style={[styles.dropdownItem, timezone === t.value && { backgroundColor: 'rgba(22,162,78,0.1)' }]}
                                            onPress={() => { setTimezone(t.value); setShowTimezones(false) }}
                                        >
                                            <Text style={[styles.dropdownItemText, { color: timezone === t.value ? '#16a24e' : c.text }]}>
                                                {t.label}
                                            </Text>
                                            {timezone === t.value && <MaterialIcons name="check" size={16} color="#16a24e" />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Home Currency */}
                        <View style={styles.formField}>
                            <Text style={[styles.fieldLabel, { color: c.sub }]}>Home Currency</Text>
                            <TouchableOpacity
                                style={[styles.selectBtn, { borderColor: c.border, backgroundColor: c.inputBg }]}
                                onPress={() => { setShowCurrencies(!showCurrencies); setShowTimezones(false) }}
                            >
                                <Text style={[styles.selectBtnText, { color: c.text }]}>
                                    {CURRENCIES.find(cx => cx.value === homeCurrency)?.label ?? homeCurrency}
                                </Text>
                                <MaterialIcons name={showCurrencies ? 'expand-less' : 'expand-more'} size={20} color={c.sub} />
                            </TouchableOpacity>
                            {showCurrencies && (
                                <View style={[styles.dropdown, { backgroundColor: c.surface, borderColor: c.border }]}>
                                    {CURRENCIES.map(cx => (
                                        <TouchableOpacity
                                            key={cx.value}
                                            style={[styles.dropdownItem, homeCurrency === cx.value && { backgroundColor: 'rgba(22,162,78,0.1)' }]}
                                            onPress={() => { setHomeCurrency(cx.value); setShowCurrencies(false) }}
                                        >
                                            <Text style={[styles.dropdownItemText, { color: homeCurrency === cx.value ? '#16a24e' : c.text }]}>
                                                {cx.label}
                                            </Text>
                                            {homeCurrency === cx.value && <MaterialIcons name="check" size={16} color="#16a24e" />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Trading Style */}
                        <View style={styles.formField}>
                            <Text style={[styles.fieldLabel, { color: c.sub }]}>Trading Style</Text>
                            <View style={styles.stylesWrap}>
                                {TRADING_STYLES.map(style => {
                                    const active = tradingStyles.includes(style)
                                    return (
                                        <TouchableOpacity
                                            key={style}
                                            style={[
                                                styles.styleChip,
                                                active
                                                    ? { backgroundColor: 'rgba(22,162,78,0.12)', borderColor: '#16a24e' }
                                                    : { borderColor: c.border, backgroundColor: c.inputBg }
                                            ]}
                                            onPress={() => toggleStyle(style)}
                                        >
                                            <Text style={[styles.styleChipText, { color: active ? '#16a24e' : c.sub }]}>
                                                {style}
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 120 }} />
                </ScrollView>

                {/* Save footer */}
                <View style={[styles.saveFooter, { borderTopColor: c.border, backgroundColor: c.bg }]}>
                    <TouchableOpacity
                        style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                        onPress={onSaveProfile}
                        disabled={saving}
                    >
                        {saving
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.saveBtnText}>Save Changes</Text>
                        }
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }

    // ── Main Settings View ─────────────────────────────────────────────────────
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: c.border }]}>
                <Text style={[styles.headerTitle, { color: c.text }]}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>

                {/* Profile Hero */}
                <View style={[styles.heroSection, { borderBottomColor: c.border, backgroundColor: c.surfaceAlt }]}>
                    <View style={[styles.heroAvatar, { backgroundColor: c.surface, borderColor: '#16a24e' }]}>
                        <Text style={styles.heroAvatarText}>{initials()}</Text>
                    </View>
                    <View style={styles.heroInfo}>
                        <Text style={[styles.heroName, { color: c.text }]}>
                            {profile?.displayName || 'Trader'}
                        </Text>
                        <Text style={[styles.heroEmail, { color: '#16a24e' }]} numberOfLines={1}>
                            {user?.email ?? ''}
                        </Text>
                        <View style={styles.heroBadges}>
                            {(Array.isArray(profile?.tradingStyle) ? profile.tradingStyle : []).slice(0, 2).map((s: string) => (
                                <View key={s} style={styles.heroBadge}>
                                    <Text style={styles.heroBadgeText}>{s}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* ── PERSONAL section ── */}
                <MenuSection label="Personal" color={c.sub} bg={c.sectionBg} border={c.border} />

                <MenuItem
                    icon="person"
                    label="Profile Information"
                    c={c}
                    onPress={() => setView('profile')}
                />
                <MenuItem
                    icon="account-balance-wallet"
                    label="Trading Accounts"
                    c={c}
                    onPress={() => router.push('/accounts' as any)}
                />
                <MenuItem
                    icon="label"
                    label="Tags & Templates"
                    c={c}
                    onPress={() => Alert.alert('Coming Soon', 'Tag management will be available in a future update.')}
                />

                {/* ── SYSTEM section ── */}
                <MenuSection label="System" color={c.sub} bg={c.sectionBg} border={c.border} />

                <MenuItem
                    icon="notifications"
                    label="Notifications"
                    c={c}
                    onPress={() => Alert.alert('Coming Soon', 'Notification preferences coming soon.')}
                />
                <MenuItem
                    icon="dark-mode"
                    label="Appearance"
                    c={c}
                    onPress={() => router.push('/appearance' as any)}
                />
                <MenuItem
                    icon="security"
                    label="Data & Privacy"
                    c={c}
                    onPress={() => Alert.alert('Coming Soon', 'Data & privacy settings coming soon.')}
                />

                {/* ── Sign Out ── */}
                <TouchableOpacity
                    style={[styles.signOutBtn, { borderTopColor: c.divider, borderBottomColor: c.divider }]}
                    onPress={onLogout}
                    disabled={loggingOut}
                >
                    {loggingOut ? (
                        <ActivityIndicator color="#ef4444" />
                    ) : (
                        <>
                            <MaterialIcons name="logout" size={22} color="#ef4444" />
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* App version */}
                <View style={styles.versionRow}>
                    <Text style={[styles.versionText, { color: c.sub }]}>Tradge Journal · v0.1.0</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MenuSection({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
    return (
        <View style={[styles.menuSection, { backgroundColor: bg, borderTopColor: border, borderBottomColor: border }]}>
            <Text style={[styles.menuSectionLabel, { color }]}>{label}</Text>
        </View>
    )
}

function MenuItem({
    icon,
    label,
    c,
    onPress,
}: {
    icon: string
    label: string
    c: any
    onPress: () => void
}) {
    return (
        <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: c.border, backgroundColor: c.bg }]}
            onPress={onPress}
            activeOpacity={0.6}
        >
            <MaterialIcons name={icon as any} size={22} color={c.sub} />
            <Text style={[styles.menuItemLabel, { color: c.text }]}>{label}</Text>
            <MaterialIcons name="chevron-right" size={22} color={c.sub} />
        </TouchableOpacity>
    )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 18,
        borderBottomWidth: 1,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    iconBtn: { padding: 4, width: 40 },

    // ── Hero ──
    heroSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        padding: 28,
        borderBottomWidth: 1,
    },
    heroAvatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroAvatarText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#16a24e',
    },
    heroInfo: { flex: 1, gap: 6 },
    heroName: { fontSize: 20, fontWeight: 'bold' },
    heroEmail: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        textTransform: 'lowercase',
    },
    heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    heroBadge: {
        backgroundColor: 'rgba(22,162,78,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(22,162,78,0.25)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    heroBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#16a24e', textTransform: 'uppercase', letterSpacing: 1 },

    // ── Menu ──
    menuSection: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },
    menuSectionLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 24,
        paddingVertical: 18,
        borderBottomWidth: 1,
    },
    menuItemLabel: { flex: 1, fontSize: 15, fontWeight: '500' },

    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 24,
        paddingVertical: 22,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        marginTop: 24,
    },
    signOutText: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#ef4444',
    },

    versionRow: { padding: 24, alignItems: 'center' },
    versionText: { fontSize: 12, fontStyle: 'italic' },

    // ── Profile Edit ──
    formScroll: { paddingBottom: 24 },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 16,
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: { fontSize: 32, fontWeight: 'bold', color: '#16a24e' },
    changePhotoBtn: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderWidth: 1,
        borderRadius: 8,
    },
    changePhotoText: { fontSize: 13, fontWeight: '500' },

    formBlock: { paddingHorizontal: 24, gap: 24 },
    formField: { gap: 8 },
    fieldLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    fieldLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    fieldLabelAction: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#16a24e',
    },
    fieldInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
    },
    fieldReadOnly: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    fieldReadOnlyText: {
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },

    selectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    selectBtnText: { flex: 1, fontSize: 14 },

    dropdown: {
        borderWidth: 1,
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 4,
        maxHeight: 220,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    dropdownItemText: { fontSize: 13 },

    stylesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    styleChip: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderWidth: 1,
        borderRadius: 8,
    },
    styleChipText: { fontSize: 13, fontWeight: '500' },

    saveFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 20,
        borderTopWidth: 1,
    },
    saveBtn: {
        backgroundColor: '#16a24e',
        paddingVertical: 17,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
})
