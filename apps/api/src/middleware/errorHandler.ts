import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../lib/logger'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.flatten().fieldErrors,
    })
  }

  logger.error(
    {
      err,
      method: req.method,
      url: req.url,
      userId: (req as any).userId,
    },
    'Unhandled error'
  )

  const status = err.statusCode ?? 500
  res.status(status).json({
    error: err.code ?? 'INTERNAL_ERROR',
    message: status === 500 ? 'An unexpected error occurred' : err.message,
  })
}

