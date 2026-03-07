import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { insightsApi } from '@tradge/api-client'

export const insightKeys = {
  list: (page: number, pageSize: number) => ['insights', page, pageSize] as const,
}

export function useInsights(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: insightKeys.list(page, pageSize),
    queryFn: () => insightsApi.list({ page, pageSize }),
  })
}

export function useUpdateInsight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; isRead?: boolean; isDismissed?: boolean }) =>
      insightsApi.update(vars.id, {
        isRead: vars.isRead,
        isDismissed: vars.isDismissed,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] })
    },
  })
}

