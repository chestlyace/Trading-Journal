import React, { useEffect } from 'react'
import { Tabs, Redirect } from 'expo-router'
import { useAuthStore } from '../../src/stores/auth.store'

export default function TabsLayout() {
  const { session, profile, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    initialize().catch(() => { })
  }, [initialize])

  if (isLoading) {
    return null
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  if (!profile || !profile.onboardingDone) {
    return <Redirect href="/onboarding" />
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="trades" options={{ title: 'Trades' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
    </Tabs>
  )
}

