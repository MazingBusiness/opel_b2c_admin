import { useEffect, useState } from 'react'
import { useAuthStore, toAdminUser } from '../../auth/store/useAuthStore'
import { updatePasswordRequest, updateProfileRequest } from '../../auth/api/api'
import { PASSWORD_HINT } from '../../auth/constants'
import { getErrorMessage, getFieldErrors } from '../../../shared/api/client'
import { Button } from '../../../shared/components/Button'
import { TextField } from '../../../shared/components/TextField'
import { Alert } from '../../../shared/components/Alert'

/** Auto-hide a success message after a few seconds. */
function useFlash(timeoutMs = 4000) {
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!message) return undefined
    const id = setTimeout(() => setMessage(''), timeoutMs)
    return () => clearTimeout(id)
  }, [message, timeoutMs])
  return [message, setMessage]
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function ProfileDetailsForm() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [name, setName] = useState(user?.name ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useFlash()
  const [submitting, setSubmitting] = useState(false)

  const trimmed = name.trim()
  const unchanged = trimmed === (user?.name ?? '')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const data = await updateProfileRequest({ name: trimmed })
      const updated = toAdminUser(data.user)
      setUser(updated)
      setName(updated?.name ?? trimmed)
      setSuccess('Profile updated.')
    } catch (err) {
      setError(getFieldErrors(err).name ?? getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section title="Profile details" description="Your name is shown to other staff.">
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <TextField
          id="profile-email"
          label="Email"
          type="email"
          value={user?.email ?? ''}
          readOnly
          hint="Email can’t be changed here."
        />
        <TextField
          id="profile-name"
          name="name"
          label="Name"
          type="text"
          autoComplete="name"
          required
          maxLength={255}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
        />

        {success ? <Alert tone="success">{success}</Alert> : null}

        <Button type="submit" disabled={submitting || !trimmed || unchanged}>
          {submitting ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </Section>
  )
}

const EMPTY_PASSWORD_FORM = { current_password: '', password: '', password_confirmation: '' }

function ChangePasswordForm() {
  const [form, setForm] = useState(EMPTY_PASSWORD_FORM)
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string>} */ ({}))
  const [error, setError] = useState('')
  const [success, setSuccess] = useFlash()
  const [submitting, setSubmitting] = useState(false)

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setFieldErrors({})

    if (form.password !== form.password_confirmation) {
      setFieldErrors({ password_confirmation: 'Passwords do not match.' })
      return
    }

    setSubmitting(true)
    try {
      await updatePasswordRequest(form)
      // Current token stays valid; other admin sessions are revoked server-side.
      setForm(EMPTY_PASSWORD_FORM)
      setSuccess('Password changed. Other signed-in sessions have been signed out.')
    } catch (err) {
      const fields = getFieldErrors(err)
      if (Object.keys(fields).length > 0) setFieldErrors(fields)
      else setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section
      title="Change password"
      description="You’ll stay signed in here; other sessions will be signed out."
    >
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <TextField
          id="current_password"
          label="Current password"
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
        {success ? <Alert tone="success">{success}</Alert> : null}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </Section>
  )
}

export function ProfilePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Profile</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your staff account details and password.</p>
      </div>

      <ProfileDetailsForm />
      <ChangePasswordForm />
    </div>
  )
}
