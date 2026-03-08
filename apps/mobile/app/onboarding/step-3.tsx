import React, { useEffect, useState } from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    useColorScheme,
    Platform,
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
        cardBg: '#f1f5f9',
        cardBorder: '#e2e8f0',
        dotInactive: '#cbd5e1',
        primaryBtnBg: '#0f172a',
        primaryBtnText: '#ffffff',
    },
    dark: {
        bg: '#112117',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        border: '#1e293b',
        cardBg: 'rgba(30, 41, 59, 0.5)',
        cardBorder: '#1e293b',
        dotInactive: '#334155',
        primaryBtnBg: '#ffffff',
        primaryBtnText: '#0f172a',
    },
}

export default function OnboardingStep3() {
    const colorScheme = useColorScheme()
    const isDark = colorScheme === 'dark'
    const colors = isDark ? theme.dark : theme.light

    const { user, profile } = useAuthStore()

    const [accountName, setAccountName] = useState('—')
    const [tradingStyle, setTradingStyle] = useState('—')

    useEffect(() => {
        async function fetchSummary() {
            if (!user) return

            // Fetch the user's first trading account name
            const { data: accounts } = await supabase
                .from('trading_accounts')
                .select('name, type')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true })
                .limit(1)

            if (accounts && accounts.length > 0) {
                const acct = accounts[0]
                const typeLabel = acct.type === 'LIVE' ? 'Live' : acct.type === 'DEMO' ? 'Demo' : 'Prop Firm'
                setAccountName(`${acct.name}`)
            }

            // Get trading style from profile
            if (profile?.tradingStyle && profile.tradingStyle.length > 0) {
                setTradingStyle(profile.tradingStyle.join(', '))
            }
        }

        fetchSummary()
    }, [user, profile])

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={styles.content}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressDotSmall, { backgroundColor: colors.dotInactive }]} />
                    <View style={[styles.progressDotSmall, { backgroundColor: colors.dotInactive }]} />
                    <View style={[styles.progressDotLarge, { backgroundColor: isDark ? '#ffffff' : '#0f172a' }]} />
                </View>

                {/* Check Icon */}
                <View style={styles.iconWrapper}>
                    <View style={[styles.checkCircle, { backgroundColor: 'rgba(22, 162, 78, 0.1)', borderColor: theme.primary }]}>
                        <MaterialIcons name="check" size={48} color={theme.primary} />
                    </View>
                </View>

                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={[styles.title, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        {"You're ready."}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Your journal is set up and ready to track your performance.
                    </Text>
                </View>

                {/* Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        JOURNAL SUMMARY
                    </Text>
                    <View style={styles.summaryRows}>
                        <View style={[styles.summaryRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                            <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>Account</Text>
                            <Text style={[styles.summaryValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                                {accountName}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>Style</Text>
                            <Text style={[styles.summaryValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                                {tradingStyle}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Buttons */}
                <View style={styles.buttonGroup}>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.primaryBtnBg }]}
                        onPress={() => router.replace('/trade/new')}
                        activeOpacity={0.9}
                    >
                        <Text style={[styles.primaryButtonText, { color: colors.primaryBtnText }]}>
                            Log your first trade
                        </Text>
                        <MaterialIcons name="arrow-forward" size={20} color={colors.primaryBtnText} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.replace('/(tabs)')}
                    >
                        <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                            Go to dashboard
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Encryption Badge */}
                <View style={styles.badgeWrapper}>
                    <View style={[styles.badge, { backgroundColor: 'rgba(22, 162, 78, 0.05)', borderColor: 'rgba(22, 162, 78, 0.2)' }]}>
                        <MaterialIcons name="security" size={14} color={theme.primary} />
                        <Text style={[styles.badgeText, { color: theme.primary }]}>
                            Data synced and encrypted
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        gap: 48,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    progressDotSmall: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    progressDotLarge: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    iconWrapper: {
        alignItems: 'center',
    },
    checkCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleSection: {
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        lineHeight: 28,
        textAlign: 'center',
    },
    summaryCard: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 24,
        gap: 16,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    summaryRows: {
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 8,
    },
    summaryKey: {
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    buttonGroup: {
        gap: 16,
    },
    primaryButton: {
        height: 56,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        height: 56,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    badgeWrapper: {
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 9999,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
})
