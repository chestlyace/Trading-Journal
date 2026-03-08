import { Router } from 'express'
import { z } from 'zod'
import { authenticate, type AuthenticatedRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { AccountService } from '../services/account.service'

const router: Router = Router()

router.use(authenticate)

const createAccountSchema = z.object({
    name: z.string().min(1).max(100),
    broker: z.string().max(100).nullable().optional(),
    currency: z.string().min(3).max(3),
    type: z.enum(['LIVE', 'DEMO', 'PROP']),
    initialBalance: z.number().nullable().optional(),
})

router.get('/', async (req, res, next) => {
    try {
        const userId = (req as unknown as AuthenticatedRequest).userId
        const accounts = await AccountService.list(userId)
        res.json(accounts)
    } catch (err) {
        next(err)
    }
})

router.post('/', validate({ body: createAccountSchema }), async (req, res, next) => {
    try {
        const userId = (req as unknown as AuthenticatedRequest).userId
        const account = await AccountService.create(userId, req.body)
        res.status(201).json(account)
    } catch (err) {
        next(err)
    }
})

router.put(
    '/:id',
    validate({ body: createAccountSchema.partial() }),
    async (req, res, next) => {
        try {
            const userId = (req as unknown as AuthenticatedRequest).userId
            const account = await AccountService.update(userId, req.params.id, req.body)
            res.json(account)
        } catch (err) {
            next(err)
        }
    }
)

router.delete('/:id', async (req, res, next) => {
    try {
        const userId = (req as unknown as AuthenticatedRequest).userId
        await AccountService.delete(userId, req.params.id)
        res.status(204).send()
    } catch (err) {
        next(err)
    }
})

export { router as accountsRouter }
