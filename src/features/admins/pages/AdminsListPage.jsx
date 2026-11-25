import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchAdmins } from '../api/api'
import { MODULE_LABELS, formatDateTime } from '../components/labels'
import { StatusBadge } from '../../users/components/StatusBadge'
import { getErrorMessage } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
]

export function AdminsListPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['admin-admins', { q: q.trim(), status, page }],
    queryFn: () => fetchAdmins({ q: q.trim(), status, page }),
    placeholderData: keepPreviousData,
  })
  const rows = query.data?.data ?? []
  const meta = query.data?.meta
  const branchName = (code) => query.data?.options.branches.find((b) => b.code === code)?.name ?? code

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Admins</h1>
          <p className="mt-1 text-sm text-ink-muted">Sub-admins, the sections they can open and the branches they handle.</p>
        </div>
        <Link to="/admins/new" className="rounded-md bg-cta px-4 py-2.5 text-sm font-semibold text-cta-foreground hover:bg-highlight-dark">
          New admin
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          placeholder="Search name, email or phone"
          maxLength={100}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand sm:max-w-sm"
        />
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={status === s.value}
              onClick={() => { setStatus(s.value); setPage(1) }}
              className={['rounded-md border px-3 py-1.5 text-sm font-medium', status === s.value ? 'border-brand bg-brand text-ink-inverse' : 'border-border text-ink-muted hover:border-brand hover:text-brand'].join(' ')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {query.isError ? <Alert tone="error">{getErrorMessage(query.error)}</Alert> : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Sections</th>
              <th className="px-4 py-3">Branches</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {query.isPending ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-muted">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-muted">{q || status !== 'all' ? 'No admins match.' : 'No sub-admins yet.'}</td></tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id} onClick={() => navigate(`/admins/${a.id}`)} className="cursor-pointer hover:bg-brand/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{a.name}</p>
                    <p className="text-xs text-ink-muted">{a.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{a.modules.length ? a.modules.map((m) => MODULE_LABELS[m]?.split(' (')[0] ?? m).join(', ') : '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">{a.branches.length ? a.branches.map(branchName).join(', ') : '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.disabled ? 'disabled' : 'active'} />
                    {a.must_change_password && !a.disabled ? <p className="mt-1 text-xs text-ink-muted">Password not set yet</p> : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{formatDateTime(a.last_login_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {meta && meta.last_page > 1 ? (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-ink-muted">
            <span>{meta.total} admins</span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border border-border px-3 py-1 disabled:opacity-50">Previous</button>
              <button type="button" disabled={page >= meta.last_page} onClick={() => setPage(page + 1)} className="rounded-md border border-border px-3 py-1 disabled:opacity-50">Next</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
