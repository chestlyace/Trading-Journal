import { Router } from 'express'
import { tradesRouter } from './trades'
import { dashboardRouter } from './dashboard'
import { insightsRouter } from './insights'
import { exportRouter } from './export'

const router = Router()

router.use('/trades', tradesRouter)
router.use('/dashboard', dashboardRouter)
router.use('/insights', insightsRouter)
router.use('/export', exportRouter)

export { router as routes }

