import type { Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { ExportService } from '../services/export.service'

const router = Router()

router.use(authenticate)

const exportQuerySchema = z.object({
  accountId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sheets: z
    .string()
    .transform((value) =>
      value.split(',').filter((v) => v.length > 0)
    )
    .default('trades,performance'),
})

router.get(
  '/excel',
  validate({ query: exportQuerySchema }),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { accountId, from, to, sheets } = req.query as any
      const buffer = await ExportService.generateExcel({
        userId: req.userId,
        accountId,
        from,
        to,
        sheets,
      })

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="tradge-export.xlsx"'
      )
      res.send(buffer)
    } catch (err) {
      next(err)
    }
  }
)

export { router as exportRouter }

