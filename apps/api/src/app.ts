import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { json, urlencoded } from 'express'
import { requestLogger } from './middleware/requestLogger'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import { routes } from './routes'
import { env } from './config/env'

export function createApp() {
  const app = express()

  app.use(helmet())

  app.use(
    cors({
      origin: [
        env.WEB_URL,
        'http://localhost:5173',
        'exp://localhost:8081',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )

  app.use(json({ limit: '10mb' }))
  app.use(urlencoded({ extended: true }))

  app.use(requestLogger)

  app.use(rateLimiter.general)

  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  )

  app.use('/api/v1', routes)

  app.use(errorHandler)

  return app
}

