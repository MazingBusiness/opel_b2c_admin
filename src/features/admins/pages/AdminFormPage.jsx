import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAdmin, fetchAdmin, fetchAdmins, resetAdminPassword, setAdminDisabled, updateAdmin } from '../api/api'
import { AUDIT_LABELS, MODULE_LABELS, formatDateTime } from '../components/labels'
import { TemporaryPasswordDialog } from '../components/TemporaryPasswordDialog'
import { StatusBadge } from '../../users/components/StatusBadge'
import { getErrorMessage, getFieldErrors } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'
import { Button } from '../../../shared/components/Button'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { TextField } from '../../../shared/components/TextField'

const EMPTY = { name: '', email: '', phone: '', modules: [], branches: [] }

function Section({ title, children, actions }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function CheckboxGroup({ legend, items, value, onChange, error }) {
  const toggle = (key) => onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key])
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <label key={item.key} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-ink hover:border-brand">
            <input type="checkbox" checked={value.includes(item.key)} onChange={() => toggle(item.key)} className="h-4 w-4 accent-brand" />
            {item.label}
          </label>
        ))}
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </fieldset>
  )
}

function describeChanges(changes) {
  if (!changes?.before || !changes?.after) return null
  return Object.keys(changes.after)
    .map((key) => {
      const show = (v) => (Array.isArray(v) ? v.join(', ') || 'none' : v ?? '—')
      return `${key}: ${show(changes.before[key])} → ${show(changes.after[key])}`
    })
    .join('; ')
}

export function AdminFormPage() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(EMPTY)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [reveal, setReveal] = useState(/** @type {{ email: string, password: string, goTo?: string } | null} */ (null))
  const [confirm, setConfirm] = useState(/** @type {'reset' | 'deactivate' | null} */ (null))

  const detail = useQuery({ queryKey: ['admin-admin', id], queryFn: () => fetchAdmin(id), enabled: !isNew })
  const optionsQuery = useQuery({ queryKey: ['admin-admins', 'options'], queryFn: () => fetchAdmins({ page: 1 }), enabled: isNew })
  const options = (isNew ? optionsQuery.data : detail.data)?.options
  const admin = detail.data?.admin

  useEffect(() => {
    if (admin) {
      setForm({ name: admin.name, email: admin.email, phone: admin.phone ?? '', modules: admin.modules, branches: admin.branches })
    }
  }, [admin])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-admins'] })
    if (id) queryClient.invalidateQueries({ queryKey: ['admin-admin', id] })
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...form, phone: form.phone.trim() || null }
      return isNew ? createAdmin(payload) : updateAdmin(id, payload)
    },
    onMutate: () => { setError(''); setFieldErrors({}); setSaved('') },
    onSuccess: (data) => {
      refresh()
      if (isNew) {
        // Open their page only after the dialog closes; navigating remounts this page.
        setReveal({ email: data.admin.email, password: data.temporary_password, goTo: `/admins/${data.admin.id}` })
      } else {
        setSaved('Saved. If anything changed, they were logged out and must sign in again.')
      }
    },
    onError: (err) => {
      const fields = getFieldErrors(err)
      if (Object.keys(fields).length) setFieldErrors(fields)
      else setError(getErrorMessage(err))
    },
  })

  const reset = useMutation({
    mutationFn: () => resetAdminPassword(id),
    onSuccess: (data) => { setConfirm(null); refresh(); setReveal({ email: data.admin.email, password: data.temporary_password }) },
    onError: (err) => { setConfirm(null); setError(getErrorMessage(err)) },
  })

  const toggle = useMutation({
    mutationFn: (disabled) => setAdminDisabled(id, disabled),
    onSuccess: () => { setConfirm(null); refresh() },
    onError: (err) => { setConfirm(null); setError(getErrorMessage(err)) },
  })

  if (!isNew && detail.isPending) return <p className="text-sm text-ink-muted">Loading…</p>
  if (!isNew && detail.isError) return <Alert tone="error">{getErrorMessage(detail.error)}</Alert>

  const moduleItems = (options?.modules ?? []).map((m) => ({ key: m, label: MODULE_LABELS[m] ?? m }))
  const branchItems = (options?.branches ?? []).map((b) => ({ key: b.code, label: b.name }))

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link to="/admins" className="text-sm text-ink-muted hover:text-brand">← Admins</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-ink">{isNew ? 'New admin' : admin.name}</h1>
          {admin ? <StatusBadge status={admin.disabled ? 'disabled' : 'active'} /> : null}
        </div>
        {admin ? (
          <p className="mt-1 text-sm text-ink-muted">
            Last login {formatDateTime(admin.last_login_at)}{admin.must_change_password ? ' · has not set their own password yet' : ''}
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink-muted">A temporary password is created for them. You’ll see it once, after saving.</p>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Section title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="admin-name" label="Name" required maxLength={255} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={fieldErrors.name} />
            <TextField id="admin-email" label="Email (used to sign in)" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={fieldErrors.email} />
            <TextField id="admin-phone" label="Phone (contact only)" type="tel" placeholder="+919876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={fieldErrors.phone} />
          </div>
        </Section>

        <Section title="Access">
          <div className="space-y-5">
            <CheckboxGroup legend="Sections" items={moduleItems} value={form.modules} onChange={(modules) => setForm({ ...form, modules })} error={fieldErrors.modules ?? Object.entries(fieldErrors).find(([k]) => k.startsWith('modules.'))?.[1]} />
            <CheckboxGroup legend="Branches (fulfilment records they can see)" items={branchItems} value={form.branches} onChange={(branches) => setForm({ ...form, branches })} error={fieldErrors.branches ?? Object.entries(fieldErrors).find(([k]) => k.startsWith('branches.'))?.[1]} />
          </div>
        </Section>

        {error ? <Alert tone="error">{error}</Alert> : null}
        {saved ? <Alert tone="success">{saved}</Alert> : null}

        <Button type="submit" disabled={save.isPending || !options}>
          {save.isPending ? 'Saving…' : isNew ? 'Create admin' : 'Save changes'}
        </Button>
      </form>

      {admin ? (
        <>
          <Section title="Account">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setConfirm('reset')} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand">
                Reset password
              </button>
              {admin.disabled ? (
                <button type="button" disabled={toggle.isPending} onClick={() => toggle.mutate(false)} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand disabled:opacity-50">
                  Activate
                </button>
              ) : (
                <button type="button" onClick={() => setConfirm('deactivate')} className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                  Deactivate
                </button>
              )}
            </div>
          </Section>

          <Section title="History">
            {detail.data.audit.length === 0 ? (
              <p className="text-sm text-ink-muted">No changes recorded yet.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {detail.data.audit.map((entry, i) => (
                  <li key={i} className="py-2">
                    <p className="text-ink">
                      <span className="font-medium">{AUDIT_LABELS[entry.action] ?? entry.action}</span>
                      <span className="text-ink-muted"> by {entry.actor} · {formatDateTime(entry.at)}</span>
                    </p>
                    {describeChanges(entry.changes) ? <p className="mt-0.5 text-xs text-ink-muted">{describeChanges(entry.changes)}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      ) : null}

      <ConfirmDialog
        open={confirm === 'reset'}
        title="Reset password?"
        confirmLabel="Reset password"
        busy={reset.isPending}
        onConfirm={() => reset.mutate()}
        onCancel={() => setConfirm(null)}
      >
        A new temporary password is created and they are logged out everywhere.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === 'deactivate'}
        title="Deactivate this admin?"
        confirmLabel="Deactivate"
        tone="danger"
        busy={toggle.isPending}
        onConfirm={() => toggle.mutate(true)}
        onCancel={() => setConfirm(null)}
      >
        They are logged out and can’t sign in until you activate them again.
      </ConfirmDialog>

      {reveal ? <TemporaryPasswordDialog email={reveal.email} password={reveal.password} onClose={() => { const goTo = reveal.goTo; setReveal(null); if (goTo) navigate(goTo, { replace: true }) }} /> : null}
    </div>
  )
}
