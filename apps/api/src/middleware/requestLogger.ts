import type { Request, Response, NextFunction } from 'express'
import morgan from 'morgan'

// Simple morgan logger; can be wired into Pino later if desired.
export const requestLogger = morgan('tiny')

