import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'

const app = createApp()

describe('Trades routes', () => {
  it('rejects unauthenticated create trade', async () => {
    const res = await request(app).post('/api/v1/trades').send({})
    expect(res.status).toBe(401)
  })
})

