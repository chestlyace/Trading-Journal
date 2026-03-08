import React, { useEffect } from 'react'
import { Tabs, Redirect, router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { View, TouchableOpacity, useColorScheme, StyleSheet, Platform } from 'react-native'
import { useAuthStore } from '../../src/stores/auth.store'

export default function TabsLayout() {
  const { session, profile, isLoading, initialize } = useAuthStore()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

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
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a24e',
        tabBarInactiveTintColor: isDark ? '#475569' : '#94a3b8',
        tabBarStyle: {
          borderTopColor: isDark ? 'rgba(22, 162, 78, 0.2)' : '#e2e8f0',
          backgroundColor: isDark ? 'rgba(17, 33, 23, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          elevation: 0,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          marginTop: -4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trades"
        options={{
          title: 'Trades',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bar-chart" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarButton: () => (
            <View style={styles.floatingButtonContainer}>
              <TouchableOpacity
                onPress={() => router.push('/trade/new')}
                style={[
                  styles.floatingButton,
                  { borderColor: isDark ? '#112117' : '#f6f8f7' }
                ]}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault()
            router.push('/trade/new')
          },
        })}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="lightbulb" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  floatingButtonContainer: {
    top: -24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#16a24e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowColor: '#16a24e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
})
