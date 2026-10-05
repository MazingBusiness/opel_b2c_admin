import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, toAdminUser } from '../store/useAuthStore'
import { loginRequest } from '../api/api'
import { getErrorMessage } from '../../../shared/api/client'
import { Button } from '../../../shared/components/Button'
import opelLogo from '../../../assets/images/opelLogo.jpg'

export function LoginPage() {
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const data = await loginRequest({ email: email.trim(), password })
      setSession({
        token: data.token,
        user: toAdminUser(data.user),
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid credentials.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <img
            src={opelLogo}
            alt="OPEL Tools"
            className="h-10 w-auto object-contain sm:h-11"
          />
          <h1 className="mt-4 text-xl font-semibold text-ink">B2C Admin</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Sign in with your staff email and password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
