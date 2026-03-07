import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { setAuthToken } from '@tradge/api-client'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  async initialize() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      setAuthToken(session.access_token)
    }
    set({ session, user: session?.user ?? null, isLoading: false })
  },
}))

