import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth.store'
import { tradeKeys } from './useTrades'
import { dashboardKeys } from './useDashboard'

export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`trades:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
            case 'UPDATE':
            case 'DELETE':
              queryClient.invalidateQueries({ queryKey: tradeKeys.all })
              queryClient.invalidateQueries({ queryKey: ['dashboard'] })
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])
}

