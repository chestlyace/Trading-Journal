import { Router } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { DashboardService } from '../services/dashboard.service'

const router = Router()

router.use(authenticate)

const statsQuerySchema = z.object({
  accountId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

router.get(
  '/stats',
  validate({ query: statsQuerySchema }),
  async (req, res, next) => {
    try {
      const userId = (req as AuthenticatedRequest).userId
      const stats = await DashboardService.getStats(userId, req.query as any)
      res.json(stats)
    } catch (err) {
      next(err)
    }
  }
)

router.get(
  '/equity-curve',
  validate({ query: statsQuerySchema }),
  async (req, res, next) => {
    try {
      const userId = (req as AuthenticatedRequest).userId
      const points = await DashboardService.getEquityCurve(
        userId,
        req.query as any
      )
      res.json(points)
    } catch (err) {
      next(err)
    }
  }
)

export { router as dashboardRouter }

