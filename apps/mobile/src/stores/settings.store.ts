import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

type ThemeSelection = 'light' | 'dark' | 'system'
type DisplayDensity = 'compact' | 'default' | 'comfortable'
type ThousandsSeparator = 'comma' | 'period'
type CurrencyPosition = 'prefix' | 'suffix'

interface SettingsState {
    theme: ThemeSelection
    density: DisplayDensity
    thousandsSeparator: ThousandsSeparator
    currencyPosition: CurrencyPosition

    setTheme: (t: ThemeSelection) => void
    setDensity: (d: DisplayDensity) => void
    setThousandsSeparator: (t: ThousandsSeparator) => void
    setCurrencyPosition: (c: CurrencyPosition) => void
    loadSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
    theme: 'system',
    density: 'default',
    thousandsSeparator: 'comma',
    currencyPosition: 'prefix',

    setTheme: (t) => {
        set({ theme: t })
        AsyncStorage.setItem('tradge_theme', t)
    },
    setDensity: (d) => {
        set({ density: d })
        AsyncStorage.setItem('tradge_density', d)
    },
    setThousandsSeparator: (t) => {
        set({ thousandsSeparator: t })
        AsyncStorage.setItem('tradge_thousands_separator', t)
    },
    setCurrencyPosition: (c) => {
        set({ currencyPosition: c })
        AsyncStorage.setItem('tradge_currency_pos', c)
    },
    loadSettings: async () => {
        try {
            const keys = await AsyncStorage.multiGet([
                'tradge_theme',
                'tradge_density',
                'tradge_thousands_separator',
                'tradge_currency_pos'
            ])
            const updates: Partial<SettingsState> = {}

            keys.forEach(([key, val]) => {
                if (!val) return
                if (key === 'tradge_theme') updates.theme = val as ThemeSelection
                if (key === 'tradge_density') updates.density = val as DisplayDensity
                if (key === 'tradge_thousands_separator') updates.thousandsSeparator = val as ThousandsSeparator
                if (key === 'tradge_currency_pos') updates.currencyPosition = val as CurrencyPosition
            })

            set(updates)
        } catch (err) {
            console.error('Failed to load settings', err)
        }
    }
}))
