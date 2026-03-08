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

// Setup theme configuration similar to how they had it in standard app
const theme = {
    primary: '#16a24e',
    light: {
        bg: '#f6f8f7',
        surface: '#ffffff',
        text: '#0f172a',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        inputPlaceholder: '#94a3b8',
        surfaceSelected: '#16a24e',
        surfaceUnselected: '#f1f5f9',
    },
    dark: {
        bg: '#112117',
        surface: 'rgba(22, 162, 78, 0.05)',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        border: 'rgba(22, 162, 78, 0.2)',
        inputPlaceholder: '#475569',
        surfaceSelected: '#16a24e',
        surfaceUnselected: 'rgba(22, 162, 78, 0.1)',
    },
}

export default function OnboardingScreen() {
    const [accountName, setAccountName] = useState('')
    const [broker, setBroker] = useState('')
    const [accountType, setAccountType] = useState<'LIVE' | 'DEMO' | 'PROP'>('LIVE')
    const [currency, setCurrency] = useState('USD')
    const [initialBalance, setInitialBalance] = useState('')

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const colorScheme = useColorScheme()
    const isDark = colorScheme === 'dark'
    const colors = isDark ? theme.dark : theme.light

    const { user, refreshProfile } = useAuthStore()

    const onSubmit = async () => {
        if (!accountName || !broker || !currency || !initialBalance) {
            setError('Please fill out all fields.')
            return
        }

        const balanceFloat = parseFloat(initialBalance.replace(/,/g, ''))
        if (isNaN(balanceFloat) || balanceFloat < 0) {
            setError('Initial balance must be a positive number.')
            return
        }

        if (!user) {
            setError('You must be logged in.')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // 1. Insert trading account directly via Supabase
            const { error: insertError } = await supabase
                .from('trading_accounts')
                .insert({
                    user_id: user.id,
                    name: accountName,
                    broker,
                    currency,
                    type: accountType,
                    initial_balance: balanceFloat,
                })

            if (insertError) {
                console.error('Insert account error:', JSON.stringify(insertError))
                throw new Error(`Account insert failed: ${insertError.message} (${insertError.code})`)
            }

            // Navigate to step 2 (preferences)
            router.push('/onboarding/step-2')
        } catch (err: any) {
            console.error('Onboarding error:', err)
            setError(err?.message ?? 'Something went wrong.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Top Navigation */}
            <View style={styles.nav}>
                <View style={styles.backButtonPlaceholder}>
                    {/* In HTML: A hidden/back arrow, no action needed on first step potentially. */}
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </View>
                <Text style={[styles.navTitle, { color: colors.text }]}>Add Account</Text>
                <View style={styles.backButtonPlaceholder} />
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressDotActive, { backgroundColor: theme.primary }]} />
                <View style={[styles.progressDotInactive, { backgroundColor: isDark ? 'rgba(22, 162, 78, 0.2)' : 'rgba(22, 162, 78, 0.2)' }]} />
                <View style={[styles.progressDotInactive, { backgroundColor: isDark ? 'rgba(22, 162, 78, 0.2)' : 'rgba(22, 162, 78, 0.2)' }]} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header Area */}
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(22, 162, 78, 0.1)' : 'rgba(22, 162, 78, 0.1)', borderColor: isDark ? 'rgba(22, 162, 78, 0.2)' : 'rgba(22, 162, 78, 0.2)' }]}>
                        <MaterialIcons name="work" size={48} color={theme.primary} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Add your first trading account</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Connect your broker to start tracking your performance with ease.</Text>
                </View>

                <View style={styles.form}>
                    {/* Account Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Account Name</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="e.g. Personal Portfolio"
                            placeholderTextColor={colors.inputPlaceholder}
                            value={accountName}
                            onChangeText={setAccountName}
                            editable={!isLoading}
                        />
                    </View>

                    {/* Broker Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Broker Name</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="e.g. Oanda, MetaTrader"
                            placeholderTextColor={colors.inputPlaceholder}
                            value={broker}
                            onChangeText={setBroker}
                            editable={!isLoading}
                        />
                    </View>

                    {/* Account Type  */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Account Type</Text>
                        <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceUnselected, borderColor: colors.border }]}>
                            {['LIVE', 'DEMO', 'PROP'].map((type) => {
                                const isSelected = accountType === type
                                return (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.segmentButton,
                                            isSelected && { backgroundColor: isDark ? theme.primary : colors.surface },
                                        ]}
                                        onPress={() => setAccountType(type as any)}
                                        disabled={isLoading}
                                    >
                                        <Text
                                            style={[
                                                styles.segmentButtonText,
                                                { color: isSelected ? (isDark ? '#fff' : theme.primary) : colors.textSecondary },
                                            ]}
                                        >
                                            {type === 'PROP' ? 'Prop Firm' : type.charAt(0) + type.slice(1).toLowerCase()}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    </View>

                    <View style={styles.rowGroup}>
                        {/* Base Currency */}
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Base Currency</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    },
                                ]}
                                placeholder="USD"
                                placeholderTextColor={colors.inputPlaceholder}
                                value={currency}
                                onChangeText={setCurrency}
                                maxLength={3}
                                autoCapitalize="characters"
                                editable={!isLoading}
                            />
                        </View>

                        {/* Starting Balance */}
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Starting Balance</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                        color: colors.text,
                                        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                                    },
                                ]}
                                placeholder="10,000.00"
                                placeholderTextColor={colors.inputPlaceholder}
                                keyboardType="decimal-pad"
                                value={initialBalance}
                                onChangeText={setInitialBalance}
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>

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
                                <Text style={styles.primaryButtonText}>Add Account</Text>
                                <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
                            </>
                        )}
                    </TouchableOpacity>
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
        paddingTop: 16,
        paddingBottom: 8,
    },
    backButtonPlaceholder: {
        width: 48,
        height: 48,
        justifyContent: 'center',
    },
    navTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
    },
    progressDotActive: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    progressDotInactive: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 32,
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 16,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 34,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    form: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    segmentedControl: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    segmentButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    rowGroup: {
        flexDirection: 'row',
        gap: 16,
    },
    spacer: {
        flex: 1,
    },
    ctaContainer: {
        padding: 24,
    },
    primaryButton: {
        backgroundColor: '#16a24e',
        flexDirection: 'row',
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#16a24e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        marginTop: 8,
    },
})
