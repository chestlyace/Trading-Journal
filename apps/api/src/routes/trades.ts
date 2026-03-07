import { Router } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { TradeService } from '../services/trade.service'

const router = Router()

router.use(authenticate)

const createTradeSchema = z.object({
  accountId: z.string().uuid(),
  instrument: z.string().min(1).max(20),
  assetClass: z.enum([
    'FOREX',
    'STOCKS',
    'CRYPTO',
    'FUTURES',
    'INDICES',
    'COMMODITIES',
  ]),
  direction: z.enum(['LONG', 'SHORT']),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive().optional(),
  entryTime: z.string().datetime(),
  exitTime: z.string().datetime().optional(),
  positionSize: z.number().positive(),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
  fees: z.number().min(0).default(0),
  riskAmount: z.number().positive().optional(),
  session: z
    .enum(['LONDON', 'NEW_YORK', 'ASIAN', 'LONDON_NY_OVERLAP', 'OTHER'])
    .optional(),
  emotionalState: z
    .enum(['CALM', 'ANXIOUS', 'GREEDY', 'FEARFUL', 'CONFIDENT', 'FOMO', 'NEUTRAL'])
    .optional(),
  tradeRating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(5000).optional(),
  isDraft: z.boolean().default(false),
  strategyTags: z.array(z.string().max(50)).max(10).default([]),
  mistakeTags: z.array(z.string().max(50)).max(10).default([]),
})

const tradeFiltersSchema = z.object({
  accountId: z.string().uuid().optional(),
  assetClass: z
    .enum(['FOREX', 'STOCKS', 'CRYPTO', 'FUTURES', 'INDICES', 'COMMODITIES'])
    .optional(),
  outcome: z.enum(['WIN', 'LOSS', 'BREAK_EVEN', 'PARTIAL']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
  isOpen: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z
    .enum(['entryTime', 'netPnl', 'rrRatio', 'tradeRating'])
    .default('entryTime'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

router.get('/', validate({ query: tradeFiltersSchema }), async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    const filters = req.query as any
    const result = await TradeService.list(userId, filters)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/', validate({ body: createTradeSchema }), async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    const trade = await TradeService.create(userId, req.body)
    res.status(201).json(trade)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    const trade = await TradeService.getById(userId, req.params.id)
    if (!trade) {
      return res
        .status(404)
        .json({ error: 'NOT_FOUND', message: 'Trade not found' })
    }
    res.json(trade)
  } catch (err) {
    next(err)
  }
})

router.put(
  '/:id',
  validate({ body: createTradeSchema.partial() }),
  async (req, res, next) => {
    try {
      const userId = (req as AuthenticatedRequest).userId
      const trade = await TradeService.update(userId, req.params.id, req.body)
      res.json(trade)
    } catch (err) {
      next(err)
    }
  }
)

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).userId
    await TradeService.delete(userId, req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export { router as tradesRouter }

