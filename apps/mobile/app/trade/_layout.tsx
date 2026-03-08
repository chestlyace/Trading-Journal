import React from 'react'
import { Stack, router } from 'expo-router'

export default function TradeLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, presentation: 'modal' }}>
            <Stack.Screen name="new" />
            <Stack.Screen name="step-2" />
            <Stack.Screen name="step-3" />
            <Stack.Screen name="step-4" />
            <Stack.Screen name="step-5" />
            <Stack.Screen name="step-6" />
        </Stack>
    )
}
