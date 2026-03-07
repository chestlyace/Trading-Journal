import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry(failureCount, error: any) {
        if (error?.status === 401 || error?.status === 404) return false
        return failureCount < 3
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      onError(error) {
        // eslint-disable-next-line no-console
        console.error('Mutation error:', error)
      },
    },
  },
})

