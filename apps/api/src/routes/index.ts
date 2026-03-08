import { Router } from 'express'
import { tradesRouter } from './trades'
import { dashboardRouter } from './dashboard'
import { insightsRouter } from './insights'
import { exportRouter } from './export'
import { accountsRouter } from './accounts'

const router: Router = Router()

router.use('/trades', tradesRouter)
router.use('/dashboard', dashboardRouter)
router.use('/insights', insightsRouter)
router.use('/export', exportRouter)
router.use('/accounts', accountsRouter)

export { router as routes }

