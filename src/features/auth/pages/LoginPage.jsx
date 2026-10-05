import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, toAdminUser } from '../store/useAuthStore'
import { loginRequest } from '../api/api'
import { getErrorMessage } from '../../../shared/api/client'
import { Button } from '../../../shared/components/Button'
import { TextField } from '../../../shared/components/TextField'
import { Alert } from '../../../shared/components/Alert'
import { AuthCard } from '../components/AuthCard'

export function LoginPage() {
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  const location = useLocation()
  const flashMessage =
    typeof location.state?.message === 'string' ? location.state.message : ''
  const [email, setEmail] = useState(
    typeof location.state?.email === 'string' ? location.state.email : '',
  )
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
    <AuthCard subtitle="Sign in with your staff email and password.">
      {flashMessage ? (
        <Alert tone="success" className="mt-6">
          {flashMessage}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <TextField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="mt-1.5 text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-brand hover:text-brand-dark hover:underline"
            >
              Forgot password?
            </Link>
          </div>
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
    </AuthCard>
  )
}
