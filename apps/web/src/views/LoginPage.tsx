import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/auth.store'

export function LoginPage() {
  const { signIn, initialize, isLoading, user } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initialize().catch(() => {
      // ignore
    })
  }, [initialize])

  if (isLoading) return <div>Loading...</div>
  if (user) return <div>Already signed in.</div>

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await signIn(email, password)
    } catch (err: any) {
      setError(err.message ?? 'Login failed')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto' }}>
      <h1>Sign in</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Sign in</button>
      </form>
    </div>
  )
}

