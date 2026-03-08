import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import type { UserProfile } from '@tradge/types'
import { supabase } from '../lib/supabase'
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,

  async refreshProfile() {
    const user = get().user
    if (!user) return
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    set({ profile: mapProfile(data) })
  },

  async initialize() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

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

