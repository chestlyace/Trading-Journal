import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth.store'

export interface AIInsight {
  id: string
  user_id: string
  insight_type: string
  title: string
  body: string
  supporting_data: Record<string, unknown> | null
  is_read: boolean
  is_dismissed: boolean
  generated_at: string
  expires_at: string | null
  trade_id: string | null
}

export const insightKeys = {
  all: ['insights'] as const,
  lists: () => [...insightKeys.all, 'list'] as const,
  list: (page: number, pageSize: number) => [...insightKeys.lists(), page, pageSize] as const,
  latest: () => [...insightKeys.all, 'latest'] as const,
  unreadCount: () => [...insightKeys.all, 'unreadCount'] as const,
}

/**
 * Fetch paginated insights directly from Supabase (no backend server needed).
 */
export function useInsights(page = 1, pageSize = 20) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: insightKeys.list(page, pageSize),
    queryFn: async () => {
      if (!user) return { data: [], total: 0, hasMore: false }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await supabase
        .from('ai_insights')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('generated_at', { ascending: false })
        .range(from, to)

      if (error) throw new Error(error.message)

      return {
        data: (data ?? []) as AIInsight[],
        total: count ?? 0,
        hasMore: (count ?? 0) > page * pageSize,
      }
    },
    enabled: !!user,
  })
}

/**
 * Fetch the single latest unread insight (for the Home screen card).
 */
export function useLatestInsight() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: insightKeys.latest(),
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw new Error(error.message)
      return data as AIInsight | null
    },
    enabled: !!user,
  })
}

/**
 * Fetch unread insight count (for badge).
 */
export function useUnreadInsightCount() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: insightKeys.unreadCount(),
    queryFn: async () => {
      if (!user) return 0

      const { count, error } = await supabase
        .from('ai_insights')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .eq('is_dismissed', false)

      if (error) return 0
      return count ?? 0
    },
    enabled: !!user,
  })
}

/**
 * Mark an insight as read.
 */
export function useMarkInsightRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', insightId)

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightKeys.all })
    },
  })
}

/**
 * Dismiss an insight.
 */
export function useDismissInsight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_dismissed: true })
        .eq('id', insightId)

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightKeys.all })
    },
  })
}
