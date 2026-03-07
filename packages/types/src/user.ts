export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  timezone: string
  homeCurrency: string
  tradingStyle: string[]
  onboardingDone: boolean
  aiAnalysisEnabled: boolean
  createdAt: string
  updatedAt: string
}

