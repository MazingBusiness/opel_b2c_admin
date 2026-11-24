import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export const BRANCHES = [
  { code: 'KOLKATA', label: 'Kolkata' },
  { code: 'DELHI', label: 'Delhi' },
  { code: 'MUMBAI', label: 'Mumbai' },
]
export const branchLabel = (code) => BRANCHES.find((b) => b.code === code)?.label ?? code

export const STATUS = {
  pending: { label: 'Pending', tone: 'warn' },
  partially_challaned: { label: 'Partly challaned', tone: 'brand' },
  challaned: { label: 'Challaned', tone: 'brand' },
  invoiced: { label: 'Invoiced', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
  // B2B push
  sending: { label: 'Sending', tone: 'brand' },
  sent: { label: 'Sent to B2B', tone: 'success' },
  failed: { label: 'Push failed', tone: 'danger' },
  needs_check: { label: 'Needs check', tone: 'danger' },
}

const TONES = {
  success: 'border-green-200 bg-green-50 text-green-800',
  brand: 'border-brand/30 bg-brand/10 text-brand',
  warn: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-700',
  muted: 'border-border bg-surface-muted text-ink-muted',
}

/** @param {{ tone?: keyof typeof TONES, children: any }} props */
export function Pill({ tone = 'muted', children }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  )
}

export function StatusPill({ status, pendingLabel }) {
  const s = STATUS[status] ?? { label: status, tone: 'muted' }
  return <Pill tone={s.tone}>{status === 'pending' && pendingLabel ? pendingLabel : s.label}</Pill>
}

export function PageHeader({ title, description, back, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {back ? (
          <Link to={back.to} className="text-sm text-ink-muted hover:text-brand">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-border bg-surface p-5 shadow-sm ${className}`}>
      {title || action ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="text-base font-semibold text-ink">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  )
}

export function Btn({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-brand text-ink-inverse hover:opacity-90',
    outline: 'border border-border bg-surface text-ink hover:border-brand hover:text-brand',
    ghost: 'text-brand hover:underline',
    danger: 'border border-red-200 bg-surface text-red-700 hover:bg-red-50',
  }
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted'
export const td = 'px-3 py-3 align-top text-sm text-ink'
const input = 'rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink'

/** Branch select + search box shared by the three lists. */
export function ListFilters({ branch, onBranch, q, onQ, children }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Branch" value={branch} onChange={(e) => onBranch(e.target.value)} className={input}>
        <option value="">All branches</option>
        {BRANCHES.map((b) => (
          <option key={b.code} value={b.code}>
            {b.label}
          </option>
        ))}
      </select>
      <input
        type="search"
        value={q}
        onChange={(e) => onQ(e.target.value)}
        placeholder="Search number or customer"
        className={`${input} w-64`}
      />
      {children}
    </div>
  )
}

export function Pager({ meta, page, onPage }) {
  if (!meta || meta.last_page <= 1) return null
  return (
    <div className="flex items-center justify-end gap-2 text-sm text-ink-muted">
      <Btn variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </Btn>
      <span>
        Page {meta.current_page} of {meta.last_page}
      </span>
      <Btn variant="outline" disabled={page >= meta.last_page} onClick={() => onPage(page + 1)}>
        Next
      </Btn>
    </div>
  )
}

export function TableShell({ head, children, empty, loading, error }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-surface-muted">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
      {loading ? <p className="p-4 text-sm text-ink-muted">Loading…</p> : null}
      {error ? <p className="p-4 text-sm text-red-700">{error}</p> : null}
      {!loading && !error && empty ? <p className="p-4 text-sm text-ink-muted">{empty}</p> : null}
    </div>
  )
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Branch, search (debounced) and page state for a list screen. */
export function useListParams() {
  const [branch, setBranch] = useState('')
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [q])
  return {
    branch,
    setBranch: (b) => {
      setBranch(b)
      setPage(1)
    },
    q,
    setQ,
    page,
    setPage,
    params: { branch, q: debounced, page },
  }
}
