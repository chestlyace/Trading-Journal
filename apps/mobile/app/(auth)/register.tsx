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
import { supabase } from '../../src/lib/supabase'
import { router } from 'expo-router'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'

const theme = {
    primary: '#16a24e',
    light: {
        bg: '#f6f8f7',
        bgInset: '#ffffff',
        text: '#0f172a', // slate-900
        textSecondary: '#64748b', // slate-500
        border: '#e2e8f0', // slate-200
        inputPlaceholder: '#94a3b8', // slate-400
        divider: '#e2e8f0',
    },
    dark: {
        bg: '#09090b',
        bgInset: '#18181b',
        text: '#f8fafc', // slate-100
        textSecondary: '#94a3b8', // slate-400
        border: '#27272a', // border-default
        inputPlaceholder: '#52525b', // zinc-600
        divider: '#27272a',
    },
}

// Force component re-evaluation
export default function RegisterScreen() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [tosAccepted, setTosAccepted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const colorScheme = useColorScheme()
    const isDark = colorScheme === 'dark'
    const colors = isDark ? theme.dark : theme.light

    // Basic password strength: 1 bar per 2 chars, max 4
    const passwordStrength = Math.min(Math.max(Math.floor(password.length / 2), 0), 4)

    const onSubmit = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            setError('Please fill in all fields.')
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }
        if (!tosAccepted) {
            setError('You must agree to the Terms of Service.')
            return
        }

        setIsLoading(true)
        setError(null)

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        })

        setIsLoading(false)

        if (signUpError) {
            setError(signUpError.message)
        } else {
            // Typically direct to tabs or a verification screen
            router.replace('/(tabs)')
        }
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.nav, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.navTitle, { color: colors.text }]}>TRADGE</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Create your account
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Start journaling in 2 minutes
                    </Text>
                </View>

                <View style={styles.form}>
                    {/* Full Name Field */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>FULL NAME</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.bgInset,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="John Doe"
                            placeholderTextColor={colors.inputPlaceholder}
                            autoCapitalize="words"
                            value={fullName}
                            onChangeText={setFullName}
                            editable={!isLoading}
                        />
                    </View>

                    {/* Email Field */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>EMAIL</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.bgInset,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="name@example.com"
                            placeholderTextColor={colors.inputPlaceholder}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            editable={!isLoading}
                        />
                    </View>

                    {/* Password Field */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>PASSWORD</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.passwordInput,
                                    {
                                        backgroundColor: colors.bgInset,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    },
                                ]}
                                placeholder="••••••••"
                                placeholderTextColor={colors.inputPlaceholder}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                            >
                                <MaterialIcons
                                    name={showPassword ? 'visibility-off' : 'visibility'}
                                    size={20}
                                    color={colors.inputPlaceholder}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Password Strength Indicator */}
                        <View style={styles.strengthContainer}>
                            <View style={styles.strengthBarsRow}>
                                {[1, 2, 3, 4].map((bar) => (
                                    <View
                                        key={bar}
                                        style={[
                                            styles.strengthBar,
                                            {
                                                backgroundColor: passwordStrength >= bar ? theme.primary : colors.border,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                            <View style={styles.strengthTextRow}>
                                <Text style={[styles.strengthTextLeft, { color: passwordStrength >= 3 ? theme.primary : colors.textSecondary }]}>
                                    {passwordStrength < 2 ? 'WEAK' : passwordStrength < 4 ? 'GOOD' : 'STRONG'}
                                </Text>
                                <Text style={[styles.strengthTextRight, { color: colors.textSecondary }]}>
                                    8+ CHARACTERS
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Confirm Password Field */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>CONFIRM PASSWORD</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.bgInset,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="••••••••"
                            placeholderTextColor={colors.inputPlaceholder}
                            secureTextEntry={!showPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            editable={!isLoading}
                        />
                    </View>

                    {/* TOS Checkbox */}
                    <TouchableOpacity
                        style={styles.tosContainer}
                        onPress={() => setTosAccepted(!tosAccepted)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, { borderColor: colors.border, backgroundColor: tosAccepted ? theme.primary : colors.bgInset }]}>
                            {tosAccepted && <MaterialIcons name="check" size={14} color="#fff" />}
                        </View>
                        <Text style={[styles.tosText, { color: colors.textSecondary }]}>
                            I agree to the <Text style={[styles.tosLink, { color: colors.text }]}>Terms of Service</Text> and <Text style={[styles.tosLink, { color: colors.text }]}>Privacy Policy</Text>
                        </Text>
                    </TouchableOpacity>


                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {/* Primary Action */}
                    <TouchableOpacity
                        style={[
                            styles.signInButton,
                            { backgroundColor: isDark ? '#f8fafc' : '#0f172a' },
                            isLoading && styles.signInButtonDisabled,
                        ]}
                        onPress={onSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={isDark ? '#0f172a' : '#ffffff'} />
                        ) : (
                            <Text
                                style={[
                                    styles.signInButtonText,
                                    { color: isDark ? '#0f172a' : '#ffffff' },
                                ]}
                            >
                                Create account
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                        <Text style={[styles.dividerText, { color: colors.textSecondary, backgroundColor: colors.bg }]}>
                            OR
                        </Text>
                        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                    </View>

                    {/* Social Login */}
                    <TouchableOpacity
                        style={[
                            styles.googleButton,
                            {
                                backgroundColor: colors.bgInset,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <Ionicons name="logo-google" size={18} color={isDark ? '#f8fafc' : '#0f172a'} />
                        <Text style={[styles.googleButtonText, { color: colors.text }]}>
                            Continue with Google
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Already have an account?{' '}
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                        <Text style={[styles.footerLink, { color: colors.text }]}>
                            Sign in
                        </Text>
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
        padding: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
    },
    navTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        width: '100%',
        maxWidth: 440,
        alignSelf: 'center',
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 14,
    },
    passwordContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    passwordInput: {
        paddingRight: 40,
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        height: '100%',
        justifyContent: 'center',
    },
    strengthContainer: {
        marginTop: 8,
    },
    strengthBarsRow: {
        flexDirection: 'row',
        gap: 6,
        height: 4,
        width: '100%',
    },
    strengthBar: {
        flex: 1,
        borderRadius: 4,
    },
    strengthTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    strengthTextLeft: {
        fontSize: 10,
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    strengthTextRight: {
        fontSize: 10,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    tosContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 8,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 1,
        borderRadius: 4,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tosText: {
        fontSize: 13,
        lineHeight: 18,
        flex: 1,
    },
    tosLink: {
        textDecorationLine: 'underline',
    },
    errorText: {
        color: '#ef4444', // red-500
        fontSize: 14,
    },
    signInButton: {
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    signInButtonDisabled: {
        opacity: 0.7,
    },
    signInButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 16,
        position: 'relative',
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 12,
        letterSpacing: 1,
        paddingHorizontal: 12,
        position: 'absolute',
    },
    googleButton: {
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    googleButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 48,
        paddingBottom: 24,
    },
    footerText: {
        fontSize: 14,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: 'bold',
    },
})
