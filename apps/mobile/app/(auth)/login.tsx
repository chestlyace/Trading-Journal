import React, { useState, useEffect } from 'react'
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
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/stores/auth.store'

WebBrowser.maybeCompleteAuthSession()

const theme = {
  primary: '#16a24e',
  light: {
    bg: '#f6f8f7',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    border: '#e2e8f0',
    inputPlaceholder: '#94a3b8',
    divider: '#e2e8f0',
  },
  dark: {
    bg: '#112117',
    surface: '#1b3224',
    text: '#f1f5f9',
    textSecondary: 'rgba(22, 162, 78, 0.7)',
    border: '#366348',
    inputPlaceholder: 'rgba(22, 162, 78, 0.4)',
    divider: '#366348',
  },
}
export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    // Cannot load storage in offline Expo Go without native MMKV bindings built.
    setRememberMe(false)
  }, [])

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? theme.dark : theme.light

  const initialize = useAuthStore((s) => s.initialize)

  const onSubmit = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    // In a real app we would persist to AsyncStorage or MMKV here.
    setIsLoading(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setIsLoading(false)
      setError(signInError.message)
    } else {
      await initialize()
      setIsLoading(false)
      router.replace('/(tabs)')
    }
  }

  const onGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const redirectUrl = Linking.createURL('/(tabs)')
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })
      if (signInError) throw signInError

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)
        if (res.type === 'success' && res.url) {
          const parsedUrl = res.url.replace('#', '?')
          const parsed = Linking.parse(parsedUrl)
          const access_token = parsed.queryParams?.access_token
          const refresh_token = parsed.queryParams?.refresh_token

          if (typeof access_token === 'string' && typeof refresh_token === 'string') {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            })
            if (sessionError) throw sessionError
            router.replace('/(tabs)')
          }
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to your journal
            </Text>
          </View>

          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Enter your email"
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
              <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                Password
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Enter your password"
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
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.inputPlaceholder}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={isLoading}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
              >
                {rememberMe && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={[styles.rememberMeText, { color: colors.text }]}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Primary Action */}
          <TouchableOpacity
            style={[
              styles.signInButton,
              { backgroundColor: isDark ? '#f1f5f9' : '#0f172a' },
              isLoading && styles.signInButtonDisabled,
            ]}
            onPress={onSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={isDark ? '#0f172a' : '#ffffff'} />
            ) : (
              <Text style={[styles.signInButtonText, { color: isDark ? '#0f172a' : '#ffffff' }]}>
                Sign in
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
            <Text style={[styles.dividerText, { color: colors.inputPlaceholder }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
          </View>

          {/* Social Login */}
          <TouchableOpacity
            onPress={onGoogleSignIn}
            disabled={isLoading}
            style={[
              styles.googleButton,
              {
                backgroundColor: isDark ? 'rgba(22, 162, 78, 0.1)' : '#f1f5f9',
                borderColor: colors.border,
              },
              isLoading && styles.signInButtonDisabled,
            ]}
          >
            <Ionicons name="logo-google" size={18} color={isDark ? '#f1f5f9' : '#0f172a'} />
            <Text style={[styles.googleButtonText, { color: colors.text }]}>
              Sign in with Google
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? 'rgba(22, 162, 78, 0.6)' : '#475569' }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.footerLink, { color: colors.text }]}>Sign up</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberMeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a24e',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 16,
  },
  signInButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  googleButton: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 32,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
})

