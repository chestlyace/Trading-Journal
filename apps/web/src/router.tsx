import {
  Router,
  Route,
  RootRoute,
} from '@tanstack/react-router'
import React from 'react'
import { useAuthStore } from './stores/auth.store'
import { LoginPage } from './views/LoginPage'
import { RegisterPage } from './views/RegisterPage'
import { DashboardPage } from './views/DashboardPage'
import { TradesPage } from './views/TradesPage'
import { NewTradePage } from './views/NewTradePage'
import { TradeDetailPage } from './views/TradeDetailPage'
import { InsightsPage } from './views/InsightsPage'

function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) return <div>Loading...</div>
  if (!user) return <LoginPage />
  return <>{children}</>
}

const rootRoute = new RootRoute({
  component: () => <Outlet />,
})

const Outlet = rootRoute._ctx?.Outlet ?? (() => null)

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const registerRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
})

const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <Protected>
      <DashboardPage />
    </Protected>
  ),
})

const tradesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/trades',
  component: () => (
    <Protected>
      <TradesPage />
    </Protected>
  ),
})

const newTradeRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/trades/new',
  component: () => (
    <Protected>
      <NewTradePage />
    </Protected>
  ),
})

const tradeDetailRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/trades/$id',
  component: () => (
    <Protected>
      <TradeDetailPage />
    </Protected>
  ),
})

const insightsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/insights',
  component: () => (
    <Protected>
      <InsightsPage />
    </Protected>
  ),
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  dashboardRoute,
  tradesRoute,
  newTradeRoute,
  tradeDetailRoute,
  insightsRoute,
])

export const router = new Router({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

