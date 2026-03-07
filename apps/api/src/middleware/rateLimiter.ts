import rateLimit from 'express-rate-limit'

export const rateLimiter = {
  general: rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: 'RATE_LIMITED', message: 'Too many requests, slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
  }),
  aiEndpoints: rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
      error: 'RATE_LIMITED',
      message: 'AI request limit reached. Try again shortly.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
      error: 'RATE_LIMITED',
      message: 'Too many authentication attempts.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
}

