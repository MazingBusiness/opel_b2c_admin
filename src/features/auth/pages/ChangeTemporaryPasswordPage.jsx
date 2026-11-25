import { useState } from 'react'
import { useAuthStore, toAdminUser } from '../store/useAuthStore'
import { logoutRequest, updatePasswordRequest } from '../api/api'
import { PASSWORD_HINT } from '../constants'
import { getErrorMessage, getFieldErrors } from '../../../shared/api/client'
import { Button } from '../../../shared/components/Button'
import { TextField } from '../../../shared/components/TextField'
import { Alert } from '../../../shared/components/Alert'
import { AuthCard } from '../components/AuthCard'

const EMPTY = { current_password: '', password: '', password_confirmation: '' }

/** Shown instead of the app until a temporary password is replaced. */
export function ChangeTemporaryPasswordPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const clearSession = useAuthStore((s) => s.clearSession)
  const [form, setForm] = useState(EMPTY)
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string>} */ ({}))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    if (form.password !== form.password_confirmation) {
      setFieldErrors({ password_confirmation: 'Passwords do not match.' })
      return
    }
    setSubmitting(true)
    try {
      const data = await updatePasswordRequest(form)
      setUser(toAdminUser(data.user))
    } catch (err) {
      const fields = getFieldErrors(err)
      if (Object.keys(fields).length > 0) setFieldErrors(fields)
      else setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    await logoutRequest()
    clearSession()
  }

  return (
    <AuthCard title="Set your password" subtitle={`Signed in as ${user?.email ?? ''}. Replace the temporary password before you continue.`}>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <TextField
          id="current_password"
          label="Temporary password"
          type="password"
          autoComplete="current-password"
          required
          value={form.current_password}
          onChange={update('current_password')}
          error={fieldErrors.current_password}
        />
        <TextField
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={update('password')}
          error={fieldErrors.password}
          hint={PASSWORD_HINT}
        />
        <TextField
          id="password_confirmation"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password_confirmation}
          onChange={update('password_confirmation')}
          error={fieldErrors.password_confirmation}
        />
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save password'}
        </Button>
        <button type="button" onClick={handleLogout} className="block w-full text-center text-xs font-medium text-ink-muted hover:text-brand">
          Log out
        </button>
      </form>
    </AuthCard>
  )
}
