import type { RequestHandler } from 'express'
import type { ZodSchema } from 'zod'

interface Schemas {
  body?: ZodSchema<any>
  query?: ZodSchema<any>
  params?: ZodSchema<any>
}

export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body)
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query)
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params)
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}

