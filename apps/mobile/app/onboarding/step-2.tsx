import React, { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    useColorScheme,
    ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { supabase } from '../../src/lib/supabase'
import { useAuthStore } from '../../src/stores/auth.store'

const theme = {
    primary: '#16a24e',
    light: {
        bg: '#f6f8f7',
        text: '#0f172a',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        chipBg: 'transparent',
        chipSelectedBg: 'rgba(22, 162, 78, 0.1)',
        inputBg: '#f1f5f9',
        dotInactive: '#cbd5e1',
    },
    dark: {
        bg: '#112117',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        border: 'rgba(22, 162, 78, 0.2)',
        chipBg: 'transparent',
        chipSelectedBg: 'rgba(22, 162, 78, 0.1)',
        inputBg: 'rgba(15, 23, 42, 0.5)',
        dotInactive: '#334155',
    },
}

const TRADING_STYLES = ['Day Trader', 'Swing Trader', 'Scalper', 'Position Trader']
const SESSION_OPTIONS = ['London', 'New York', 'Asian', 'All Sessions']

export default function OnboardingStep2() {
    const [selectedStyles, setSelectedStyles] = useState<string[]>([])
    const [selectedSessions, setSelectedSessions] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const colorScheme = useColorScheme()
    const isDark = colorScheme === 'dark'
    const colors = isDark ? theme.dark : theme.light

    const { user, refreshProfile } = useAuthStore()

    const toggleStyle = (style: string) => {
        setSelectedStyles((prev) =>
            prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
        )
    }

    const toggleSession = (session: string) => {
        setSelectedSessions((prev) =>
            prev.includes(session) ? prev.filter((s) => s !== session) : [...prev, session]
        )
    }

    const onSubmit = async () => {
        if (!user) {
            setError('You must be logged in.')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const { error: updateError } = await supabase
                .from('user_profiles')
                .upsert({
                    user_id: user.id,
                    email: user.email,
                    trading_style: selectedStyles,
                    session_focus: selectedSessions,
                    onboarding_done: true,
                })

            if (updateError) {
                console.error('Update profile error:', JSON.stringify(updateError))
                throw new Error(`Profile update failed: ${updateError.message} (${updateError.code})`)
            }

            await refreshProfile()
            router.push('/onboarding/step-3')
        } catch (err: any) {
            console.error('Step 2 error:', err)
            setError(err?.message ?? 'Something went wrong.')
        } finally {
            setIsLoading(false)
        }
    }

    // Get home currency from the account that was just created (fallback to USD)
    const homeCurrency = 'USD'

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={[styles.nav, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.navTitle, { color: colors.text }]}>
                    Onboarding - Step 2
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressDot, { backgroundColor: colors.dotInactive }]} />
                <View style={[styles.progressDot, { backgroundColor: theme.primary }]} />
                <View style={[styles.progressDot, { backgroundColor: colors.dotInactive }]} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={[styles.title, { color: colors.text }]}>Set your preferences</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Tailor Tradge to your specific trading methodology.
                    </Text>
                </View>

                {/* Trading Style */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>TRADING STYLE</Text>
                    <View style={styles.chipRow}>
                        {TRADING_STYLES.map((style) => {
                            const isSelected = selectedStyles.includes(style)
                            return (
                                <TouchableOpacity
                                    key={style}
                                    style={[
                                        styles.chip,
                                        {
                                            borderColor: isSelected ? theme.primary : colors.border,
                                            backgroundColor: isSelected ? colors.chipSelectedBg : colors.chipBg,
                                        },
                                    ]}
                                    onPress={() => toggleStyle(style)}
                                    disabled={isLoading}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            { color: isSelected ? theme.primary : colors.textSecondary },
                                        ]}
                                    >
                                        {style}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </View>

                {/* Session Focus */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>SESSION FOCUS</Text>
                    <View style={styles.chipRow}>
                        {SESSION_OPTIONS.map((session) => {
                            const isSelected = selectedSessions.includes(session)
                            return (
                                <TouchableOpacity
                                    key={session}
                                    style={[
                                        styles.chip,
                                        {
                                            borderColor: isSelected ? theme.primary : colors.border,
                                            backgroundColor: isSelected ? colors.chipSelectedBg : colors.chipBg,
                                        },
                                    ]}
                                    onPress={() => toggleSession(session)}
                                    disabled={isLoading}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            { color: isSelected ? theme.primary : colors.textSecondary },
                                        ]}
                                    >
                                        {session}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </View>

                {/* Home Currency (read-only) */}
                <View style={styles.sectionLast}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>HOME CURRENCY</Text>
                    <View style={[styles.readOnlyInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                        <Text style={[styles.readOnlyText, { color: colors.text }]}>{homeCurrency}</Text>
                        <MaterialIcons name="lock" size={14} color={colors.textSecondary} />
                    </View>
                    <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                        PRIMARY ACCOUNT BASE CURRENCY
                    </Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.spacer} />

                {/* CTA */}
                <View style={styles.ctaContainer}>
                    <TouchableOpacity
                        style={[styles.primaryButton, isLoading && styles.disabledButton]}
                        onPress={onSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <Text style={styles.primaryButtonText}>Save Preferences</Text>
                                <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
                            </>
                        )}
                    </TouchableOpacity>
                    <Text style={[styles.stepIndicator, { color: colors.textSecondary }]}>
                        Step 2 of 3
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    nav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backButton: {
        padding: 4,
    },
    navTitle: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        flex: 1,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 24,
    },
    progressDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 48,
    },
    titleSection: {
        marginBottom: 40,
    },
    title: {
        fontSize: 30,
        fontWeight: '600',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
    },
    section: {
        marginBottom: 32,
    },
    sectionLast: {
        marginBottom: 48,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 16,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 9999,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    readOnlyInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    readOnlyText: {
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    helperText: {
        marginTop: 8,
        fontSize: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    spacer: {
        flex: 1,
    },
    ctaContainer: {
        marginTop: 'auto',
    },
    primaryButton: {
        backgroundColor: '#16a24e',
        flexDirection: 'row',
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    stepIndicator: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        marginBottom: 16,
    },
})
