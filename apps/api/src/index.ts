import { createApp } from './app'
import { env } from './config/env'
import { logger } from './lib/logger'

const PORT = env.PORT || 3001

async function main() {
  const app = createApp()

  app.listen(PORT, () => {
    logger.info(`API running on port ${PORT}`)
    logger.info(`Environment: ${env.NODE_ENV}`)
  })
}

main().catch((err) => {
  logger.error(err, 'Fatal startup error')
  process.exit(1)
})

