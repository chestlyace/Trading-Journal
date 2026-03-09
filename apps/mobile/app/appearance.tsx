import React, { useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    useColorScheme,
    Appearance,
    Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useSettingsStore } from '../src/stores/settings.store'

export default function AppearanceScreen() {
    const systemScheme = useColorScheme()
    const isDark = systemScheme === 'dark'

    const {
        theme, setTheme,
        density, setDensity,
        thousandsSeparator, setThousandsSeparator,
        currencyPosition, setCurrencyPosition,
        loadSettings
    } = useSettingsStore()

    // Ensure settings are loaded on mount in case they weren't
    useEffect(() => {
        loadSettings()
    }, [loadSettings])

    const handleThemeChange = (t: 'light' | 'dark' | 'system') => {
        setTheme(t)
        if (t === 'light') {
            Appearance.setColorScheme('light')
        } else if (t === 'dark') {
            Appearance.setColorScheme('dark')
        } else {
            Appearance.setColorScheme(null) // Reset to system
        }
    }

    const c = isDark
        ? {
            bg: '#09090b',
            surface: '#18181b', // equivalent to bg-zinc-900 / surface
            surfaceLight: 'rgba(255,255,255,0.05)',
            text: '#fafafa',
            sub: '#a1a1aa',
            border: '#27272a',
            primary: '#16a24e',
        }
        : {
            bg: '#f6f8f7',
            surface: '#ffffff',
            surfaceLight: 'rgba(0,0,0,0.02)',
            text: '#0f172a',
            sub: '#64748b',
            border: '#e2e8f0',
            primary: '#16a24e',
        }

    // formatting helper for the preview
    const formatPreviewNumber = () => {
        const raw = 1452.80
        let str = raw.toFixed(2)

        if (thousandsSeparator === 'comma') {
            // standard US style: 1,452.80
            str = raw.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        } else {
            // european style: 1.452,80
            str = raw.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }

        if (currencyPosition === 'prefix') {
            return `+$${str}`
        } else {
            return `+${str} $`
        }
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: c.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={c.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: c.text }]}>Appearance</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Theme Selection ── */}
                <View style={[styles.section, { borderBottomColor: c.border }]}>
                    <Text style={[styles.sectionHeader, { color: c.sub }]}>Theme Selection</Text>

                    <View style={styles.themeGrid}>
                        {/* Light */}
                        <TouchableOpacity style={styles.themeCard} onPress={() => handleThemeChange('light')}>
                            <View style={[
                                styles.themeMockup,
                                { backgroundColor: '#f1f5f9', borderColor: theme === 'light' ? c.primary : c.border },
                                theme === 'light' && { borderWidth: 2 }
                            ]}>
                                <View style={[styles.mockupBar, { backgroundColor: '#cbd5e1' }]} />
                                <View style={[styles.mockupBarHalf, { backgroundColor: '#cbd5e1' }]} />
                                <View style={styles.mockupDot} />
                            </View>
                            <Text style={[styles.themeLabel, { color: theme === 'light' ? c.text : c.sub }]}>Light</Text>
                        </TouchableOpacity>

                        {/* Dark */}
                        <TouchableOpacity style={styles.themeCard} onPress={() => handleThemeChange('dark')}>
                            <View style={[
                                styles.themeMockup,
                                { backgroundColor: '#18181b', borderColor: theme === 'dark' ? c.primary : c.border },
                                theme === 'dark' && { borderWidth: 2 }
                            ]}>
                                <View style={[styles.mockupBar, { backgroundColor: '#27272a' }]} />
                                <View style={[styles.mockupBarHalf, { backgroundColor: '#27272a' }]} />
                                <View style={styles.mockupDot} />
                            </View>
                            <Text style={[styles.themeLabel, { color: theme === 'dark' ? c.text : c.sub }]}>Dark</Text>
                        </TouchableOpacity>

                        {/* System */}
                        <TouchableOpacity style={styles.themeCard} onPress={() => handleThemeChange('system')}>
                            <View style={[
                                styles.themeMockup,
                                { backgroundColor: '#18181b', borderColor: theme === 'system' ? c.primary : c.border, overflow: 'hidden' },
                                theme === 'system' && { borderWidth: 2 }
                            ]}>
                                {/* Split background for system mockup */}
                                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', backgroundColor: '#f1f5f9' }} />
                                <View style={{ padding: 6, gap: 4, zIndex: 10 }}>
                                    <View style={[styles.mockupBar, { backgroundColor: 'rgba(120,120,120,0.3)' }]} />
                                    <View style={[styles.mockupBarHalf, { backgroundColor: 'rgba(120,120,120,0.3)' }]} />
                                </View>
                            </View>
                            <Text style={[styles.themeLabel, { color: theme === 'system' ? c.text : c.sub }]}>System</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Display Density ── */}
                <View style={[styles.section, { borderBottomColor: c.border }]}>
                    <Text style={[styles.sectionHeader, { color: c.sub }]}>Display Density</Text>
                    <View style={[styles.segmentControl, { backgroundColor: c.surface, borderColor: c.border }]}>
                        {(['compact', 'default', 'comfortable'] as const).map(d => (
                            <TouchableOpacity
                                key={d}
                                style={[
                                    styles.segmentBtn,
                                    density === d && { backgroundColor: isDark ? '#27272a' : '#f1f5f9', borderColor: c.border, borderWidth: 1 }
                                ]}
                                onPress={() => setDensity(d)}
                            >
                                <Text style={[
                                    styles.segmentBtnText,
                                    { color: density === d ? c.text : c.sub, textTransform: 'capitalize' }
                                ]}>
                                    {d}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Number Formatting ── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: c.sub }]}>Number Formatting</Text>

                    {/* Thousands Separator */}
                    <View style={styles.fmtGroup}>
                        <Text style={[styles.fmtLabel, { color: c.sub }]}>Thousands Separator</Text>
                        <View style={styles.fmtGrid}>
                            <TouchableOpacity
                                style={[
                                    styles.fmtCard,
                                    { backgroundColor: c.surface, borderColor: thousandsSeparator === 'comma' ? c.primary : c.border },
                                    thousandsSeparator === 'comma' && { borderWidth: 2 }
                                ]}
                                onPress={() => setThousandsSeparator('comma')}
                            >
                                <Text style={[styles.fmtValue, { color: c.text }]}>1,234.56</Text>
                                <Text style={[styles.fmtType, { color: c.sub }]}>COMMA</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.fmtCard,
                                    { backgroundColor: c.surface, borderColor: thousandsSeparator === 'period' ? c.primary : c.border, opacity: thousandsSeparator === 'period' ? 1 : 0.6 },
                                    thousandsSeparator === 'period' && { borderWidth: 2 }
                                ]}
                                onPress={() => setThousandsSeparator('period')}
                            >
                                <Text style={[styles.fmtValue, { color: c.text }]}>1.234,56</Text>
                                <Text style={[styles.fmtType, { color: c.sub }]}>PERIOD</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Currency Position */}
                    <View style={styles.fmtGroup}>
                        <Text style={[styles.fmtLabel, { color: c.sub }]}>Currency Position</Text>
                        <View style={styles.fmtGrid}>
                            <TouchableOpacity
                                style={[
                                    styles.fmtCard,
                                    { backgroundColor: c.surface, borderColor: currencyPosition === 'prefix' ? c.primary : c.border },
                                    currencyPosition === 'prefix' && { borderWidth: 2 }
                                ]}
                                onPress={() => setCurrencyPosition('prefix')}
                            >
                                <Text style={[styles.fmtValue, { color: c.text }]}>$1,234.56</Text>
                                <Text style={[styles.fmtType, { color: c.sub }]}>PREFIX</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.fmtCard,
                                    { backgroundColor: c.surface, borderColor: currencyPosition === 'suffix' ? c.primary : c.border, opacity: currencyPosition === 'suffix' ? 1 : 0.6 },
                                    currencyPosition === 'suffix' && { borderWidth: 2 }
                                ]}
                                onPress={() => setCurrencyPosition('suffix')}
                            >
                                <Text style={[styles.fmtValue, { color: c.text }]}>1,234.56 $</Text>
                                <Text style={[styles.fmtType, { color: c.sub }]}>SUFFIX</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Daily P&L Preview */}
                    <View style={[styles.previewCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                        <View style={styles.previewCardHeader}>
                            <Text style={[styles.previewCardTitle, { color: c.sub }]}>Daily P&L Preview</Text>
                            <View style={styles.previewLiveBadge}>
                                <Text style={styles.previewLiveText}>Live</Text>
                            </View>
                        </View>
                        <Text style={styles.previewAmount}>{formatPreviewNumber()}</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
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

    scrollContent: { paddingBottom: 40 },

    section: {
        paddingHorizontal: 24,
        paddingVertical: 24,
        borderBottomWidth: 1,
    },
    sectionHeader: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 20,
    },

    // ── Themes ──
    themeGrid: { flexDirection: 'row', gap: 16 },
    themeCard: { flex: 1, gap: 12 },
    themeMockup: {
        height: 60,
        width: '100%',
        borderRadius: 4,
        borderWidth: 1,
        padding: 6,
        flexDirection: 'column',
        gap: 4,
    },
    mockupBar: { height: 8, width: '100%', borderRadius: 2 },
    mockupBarHalf: { height: 4, width: '66%', borderRadius: 2 },
    mockupDot: { height: 12, width: 12, borderRadius: 6, backgroundColor: '#16a24e', marginTop: 'auto' },
    themeLabel: { textAlign: 'center', fontSize: 12, fontWeight: '500' },

    // ── Density ──
    segmentControl: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 4,
        alignItems: 'center',
    },
    segmentBtnText: { fontSize: 13, fontWeight: '600' },

    // ── Formatting ──
    fmtGroup: { marginBottom: 28 },
    fmtLabel: { fontSize: 14, fontWeight: '500', marginBottom: 12 },
    fmtGrid: { flexDirection: 'row', gap: 12 },
    fmtCard: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
    },
    fmtValue: { fontSize: 18, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    fmtType: { fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' },

    // ── Preview ──
    previewCard: {
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 8,
    },
    previewCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    previewCardTitle: { fontSize: 12, fontWeight: '600' },
    previewLiveBadge: {
        backgroundColor: 'rgba(22,162,78,0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    previewLiveText: { color: '#16a24e', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    previewAmount: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#16a24e',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
})
