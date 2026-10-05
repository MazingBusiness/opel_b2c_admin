import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPasswordRequest } from '../api/api'
import { getErrorMessage, getFieldErrors } from '../../../shared/api/client'
import { Button } from '../../../shared/components/Button'
import { TextField } from '../../../shared/components/TextField'
import { Alert } from '../../../shared/components/Alert'
import { AuthCard } from '../components/AuthCard'
import { FORGOT_PASSWORD_GENERIC_MESSAGE } from '../constants'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const data = await forgotPasswordRequest({ email: email.trim() })
      setSuccessMessage(
        typeof data?.message === 'string' && data.message.trim()
          ? data.message
          : FORGOT_PASSWORD_GENERIC_MESSAGE,
      )
    } catch (err) {
      // Only malformed input (422), throttling (429) or network errors land here;
      // unknown / non-staff emails still get the generic 200 response.
      const fields = getFieldErrors(err)
      setError(fields.email ?? getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your staff email and we’ll send you a reset link."
    >
      {successMessage ? (
        <div className="mt-6 space-y-4">
          <Alert tone="success">{successMessage}</Alert>
          <p className="text-sm text-ink-muted">
            Check your inbox (and spam folder). The link expires after a short while.
          </p>
          <button
            type="button"
            onClick={() => {
              setSuccessMessage('')
              setEmail('')
            }}
            className="text-sm font-medium text-brand hover:text-brand-dark hover:underline"
          >
            Use a different email
          </button>
        </div>
      ) : (
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

          {error ? <Alert tone="error">{error}</Alert> : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link to="/login" className="font-medium text-brand hover:text-brand-dark hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  )
}
