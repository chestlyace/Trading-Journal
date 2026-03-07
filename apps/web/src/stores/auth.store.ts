import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { setAuthToken } from '@tradge/api-client'
import { queryClient } from '../lib/queryClient'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
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

    supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession?.access_token) {
        setAuthToken(newSession.access_token)
      } else {
        setAuthToken(null)
      }
      set({ session: newSession, user: newSession?.user ?? null })
    })
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (data.session?.access_token) {
      setAuthToken(data.session.access_token)
    }
    set({ session: data.session, user: data.user })
  },

  async signOut() {
    await supabase.auth.signOut()
    setAuthToken(null)
    set({ user: null, session: null })
    queryClient.clear()
  },
}))

