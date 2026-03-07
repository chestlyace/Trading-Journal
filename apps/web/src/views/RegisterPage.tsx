import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })
    if (signUpError) {
      setError(signUpError.message)
    } else {
      setSuccess('Check your email to confirm your account.')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto' }}>
      <h1>Create account</h1>
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
        {success && <p>{success}</p>}
        <button type="submit">Sign up</button>
      </form>
    </div>
  )
}

