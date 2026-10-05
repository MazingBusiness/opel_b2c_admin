import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPasswordRequest } from '../api/api'
import { useAuthStore } from '../store/useAuthStore'
import { getErrorMessage, getFieldErrors } from '../../../shared/api/client'
import { Button } from '../../../shared/components/Button'
import { TextField } from '../../../shared/components/TextField'
import { Alert } from '../../../shared/components/Alert'
import { AuthCard } from '../components/AuthCard'
import { PASSWORD_HINT } from '../constants'

/**
 * Tolerate links pasted from the raw HTML mail body (e.g. MAIL_MAILER=log), where
 * the href's "&" separators appear entity-encoded as "&amp;". Parsed naively, that
 * yields a param named "amp;email" and no "email".
 * @param {URLSearchParams} params
 * @param {string} rawSearch
 */
function readResetParams(params, rawSearch) {
  let token = params.get('token') ?? ''
  let email = params.get('email') ?? ''
  if ((!token || !email) && rawSearch.includes('&amp;')) {
    const fixed = new URLSearchParams(rawSearch.replace(/&amp;/g, '&'))
    token = token || (fixed.get('token') ?? '')
    email = email || (fixed.get('email') ?? '')
  }
  return { token, email }
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { token, email } = readResetParams(searchParams, location.search)
  const clearSession = useAuthStore((s) => s.clearSession)
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string>} */ ({}))
  const [submitting, setSubmitting] = useState(false)

  const linkIsValid = Boolean(token && email)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    if (password !== passwordConfirmation) {
      setFieldErrors({ password_confirmation: 'Passwords do not match.' })
      return
    }

    setSubmitting(true)
    try {
      await resetPasswordRequest({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      })
      // Backend revokes every token for this user — drop any local session too.
      clearSession()
      navigate('/login', {
        replace: true,
        state: {
          message: 'Your password has been reset. Sign in with your new password.',
          email,
        },
      })
    } catch (err) {
      const fields = getFieldErrors(err)
      const { password: pw, password_confirmation: pwc, ...rest } = fields
      setFieldErrors({ password: pw, password_confirmation: pwc })
      // Token / email problems (or a generic 422 "Unable to reset password.") show above the form.
      const other = Object.values(rest)[0]
      if (other) setError(other)
      else if (!pw && !pwc) setError(getErrorMessage(err, 'Unable to reset password.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!linkIsValid) {
    return (
      <AuthCard title="Reset password">
        <div className="mt-6 space-y-4">
          <Alert tone="error">
            This reset link is invalid or incomplete. Please request a new one.
          </Alert>
          <Link
            to="/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-md bg-cta px-4 py-2.5 text-sm font-semibold text-cta-foreground transition-colors hover:bg-highlight-dark"
          >
            Request a new link
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link to="/login" className="font-medium text-brand hover:text-brand-dark hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Reset password" subtitle="Choose a new password for your staff account.">
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <TextField id="email" label="Email" type="email" value={email} readOnly autoComplete="username" />

        <TextField
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          hint={PASSWORD_HINT}
        />

        <TextField
          id="password_confirmation"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          error={fieldErrors.password_confirmation}
        />

        {error ? (
          <Alert tone="error">
            {error}{' '}
            <Link to="/forgot-password" className="font-medium underline">
              Request a new link
            </Link>
          </Alert>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link to="/login" className="font-medium text-brand hover:text-brand-dark hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  )
}
