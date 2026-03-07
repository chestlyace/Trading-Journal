import type { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase'

export interface AuthenticatedRequest extends Request {
  userId: string
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' })
  }

  const token = header.split(' ')[1]

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return res
        .status(401)
        .json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' })
    }

    ;(req as AuthenticatedRequest).userId = user.id
    next()
  } catch {
    return res
      .status(401)
      .json({ error: 'UNAUTHORIZED', message: 'Token verification failed' })
  }
}

