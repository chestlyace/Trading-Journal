import { Router } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { AIService } from '../services/ai.service'

const router = Router()

router.use(authenticate)

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

const updateBodySchema = z.object({
  isRead: z.boolean().optional(),
  isDismissed: z.boolean().optional(),
})

router.get('/', validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    const { page, pageSize } = req.query as any
    const result = await AIService.listInsights(userId, { page, pageSize })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/generate', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    await AIService.generateInsights(userId)
    res.status(202).json({ status: 'queued' })
  } catch (err) {
    next(err)
  }
})

router.patch(
  '/:id',
  validate({ body: updateBodySchema }),
  async (req, res, next) => {
    try {
      const userId = (req as AuthenticatedRequest).userId
      const id = req.params.id
      await AIService.updateInsight(userId, id, req.body)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
)

export { router as insightsRouter }

