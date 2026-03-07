import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().startsWith('sk-').optional(),

  // Resend (email)
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().default('no-reply@tradge.app'),

  // App
  WEB_URL: z.string().url().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(32),

  // Expo Push
  EXPO_ACCESS_TOKEN: z.string().optional(),

  // Observability
  SENTRY_DSN: z.string().url().optional(),
})

function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment variables:')
    // eslint-disable-next-line no-console
    console.error(result.error.flatten().fieldErrors)
    process.exit(1)
  }
  return result.data
}

export const env = validateEnv()

