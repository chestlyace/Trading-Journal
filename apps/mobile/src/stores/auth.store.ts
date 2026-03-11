import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import type { UserProfile } from '@tradge/types'
import { supabase } from '../lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { setAuthToken } from '@tradge/api-client'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  initialize: () => Promise<void>
  refreshProfile: () => Promise<void>
}

function mapProfile(row: any): UserProfile | null {
  if (!row) return null
  return {
    id: row.user_id ?? row.id,
    email: row.email ?? '',
    displayName: row.display_name ?? row.displayName ?? null,
    timezone: row.timezone ?? 'UTC',
    homeCurrency: row.home_currency ?? row.homeCurrency ?? 'USD',
    tradingStyle: row.trading_style ?? row.tradingStyle ?? [],
    sessionFocus: row.session_focus ?? row.sessionFocus ?? [],
    onboardingDone: row.onboarding_done ?? row.onboardingDone ?? false,
    aiAnalysisEnabled: row.ai_analysis_enabled ?? row.aiAnalysisEnabled ?? false,
    createdAt: row.created_at ?? row.createdAt ?? '',
    updatedAt: row.updated_at ?? row.updatedAt ?? '',
  }
}

let isFirstInitialize = true

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,

  async refreshProfile() {
    const user = get().user
    if (!user) return
    set({ isLoading: true })
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    set({ profile: mapProfile(data), isLoading: false })
  },

  async initialize() {
    set({ isLoading: true })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If remember_me is false and a session exists, sign out (unless just logged in)
    if (isFirstInitialize) {
      isFirstInitialize = false
      const rememberMe = await AsyncStorage.getItem('remember_me')
      if (session && rememberMe === 'false') {
        await supabase.auth.signOut()
        set({ session: null, user: null, profile: null, isLoading: false })
        return
      }
    }

    let profile: UserProfile | null = null
    if (session?.access_token) {
      setAuthToken(session.access_token)
      if (session.user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
        profile = mapProfile(data)
      }
    }
    set({ session, user: session?.user ?? null, profile, isLoading: false })
  },
}))

