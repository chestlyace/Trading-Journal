import cron from 'node-cron'
import { supabaseAdmin } from '../lib/supabase'
import { AIService } from './ai.service'
import { logger } from '../lib/logger'

export class CronService {
  static init() {
    // Weekly summary every Sunday at 00:00
    cron.schedule('0 0 * * 0', async () => {
      logger.info('Running weekly AI summary task')
      try {
        const { data: profiles } = await supabaseAdmin
          .from('user_profiles')
          .select('user_id')
          .eq('ai_analysis_enabled', true)

        if (!profiles) return

        for (const profile of profiles) {
          await AIService.generateWeeklySummary(profile.user_id).catch((err) =>
            logger.error(`Failed weekly summary for ${profile.user_id}: ${err.message}`)
          )
        }
      } catch (error) {
        logger.error({ error }, 'Cron Weekly Summary Error:')
      }
    })

    logger.info('Cron Service initialized')
  }
}
