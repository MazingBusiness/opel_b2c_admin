import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveCatalogItem } from '../api/api'
import { Pill } from './CatalogBadges'
import { getErrorMessage, getFieldErrors } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'
import { Button } from '../../../shared/components/Button'

const LABELS = {
  name: 'Name',
  description: 'Description (HTML)',
  thumbnail_img: 'Thumbnail',
  photos: 'Photos',
  tags: 'Tags',
  hsncode: 'HSN code',
  unit: 'Unit',
  min_qty: 'Min order qty',
  piece_per_carton: 'Pieces per carton',
  hidden: 'Storefront visibility',
  sort_order: 'Sort order',
  banner: 'Banner',
  label: 'Variant label',
  unit_price: 'Selling price',
  list_price: 'List price',
  mrp: 'MRP',
  carton_price: 'Carton price',
  current_stock: 'Stock cap',
}

const HINTS = {
  hidden: 'Admin can hide; B2B inactive items stay off regardless.',
  sort_order: 'Lower shows first on the storefront.',
  current_stock: 'Storefront stock = min(B2B stock, this). Can only lower stock; 0 forces out of stock.',
  photos: 'One URL per line.',
  tags: 'Comma separated.',
  unit_price: 'Used by listing, cart and checkout. Must be above 0 and not above MRP or list price.',
  mrp: 'Must be above 0.',
  list_price: 'Must be above 0.',
}

const SECTIONS = [
  { title: 'Basics', fields: ['name', 'label', 'description', 'tags'] },
  { title: 'Media', fields: ['thumbnail_img', 'banner', 'photos'] },
  { title: 'Selling', fields: ['unit', 'min_qty', 'piece_per_carton', 'hsncode'] },
  { title: 'Price & stock', fields: ['unit_price', 'mrp', 'list_price', 'carton_price', 'current_stock'] },
  { title: 'Visibility', fields: ['hidden', 'sort_order'] },
]
const SECTIONED = new Set(SECTIONS.flatMap((s) => s.fields))
const IMAGE_FIELDS = new Set(['thumbnail_img', 'banner'])
const NUMERIC = ['int', 'qty', 'sort', 'stock', 'money']

const inputClass =
  'w-full rounded-md border bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand'

/** @param {unknown} v @param {string} kind @param {string} field */
function display(v, kind, field) {
  if (field === 'hidden') return v ? 'Hidden' : 'Visible'
  if (field === 'sort_order' && (v === null || v === undefined)) return 'Default'
  if (v === null || v === undefined) return '—'
  if (Array.isArray(v)) return v.length ? v.join('\n') : '(none)'
  if (v === '') return '(empty)'
  if (kind === 'money') return `₹${v}`
  return String(v)
}

/** Value → input state. */
function toInput(v, kind) {
  if (kind === 'bool') return Boolean(v)
  if (kind === 'urls') return Array.isArray(v) ? v.join('\n') : ''
  return v === null || v === undefined ? '' : String(v)
}

/** Comparable form of a stored value, so "12" and 12.00 match. */
function norm(v, kind) {
  if (v === null || v === undefined) return null
  if (kind === 'bool') return Boolean(v)
  if (NUMERIC.includes(kind)) return Number(v)
  if (Array.isArray(v)) return v.map(String)
  return String(v)
}

/** @param {unknown} a @param {unknown} b */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/** @param {import('../api/api').CatalogFieldRow} row */
function initialState(row) {
  const overridden = row.override !== null && row.override !== undefined
  return {
    on: overridden,
    value: overridden ? toInput(row.override, row.kind) : toInput(row.kind === 'bool' ? true : row.b2b, row.kind),
  }
}

/**
 * What this row would send: `{ value }` (null = back to B2B) or `{ error }`.
 * An override equal to the B2B value is treated as "use B2B" so it never freezes the field.
 */
function desired(state, row) {
  if (!state.on) return { value: null }
  const kind = row.kind
  let value
  if (kind === 'bool') value = Boolean(state.value)
  else if (kind === 'urls') value = String(state.value).split('\n').map((s) => s.trim()).filter(Boolean)
  else if (NUMERIC.includes(kind)) {
    const raw = String(state.value).trim()
    const n = Number(raw)
    if (raw === '' || !Number.isFinite(n)) return { error: 'Enter a number, or turn Override off.' }
    value = n
  } else {
    value = String(state.value)
    // Laravel turns '' into null, so a blank text override can't be stored: treat blank as "use B2B".
    if (value.trim() === '') return { value: null }
  }
  // Untouched existing override: keep it as is (don't flag it as a change on load).
  if (row.overridden && same(norm(value, kind), norm(row.override, kind))) return { value }
  const b2b = kind === 'bool' ? Boolean(row.b2b) : norm(row.b2b, kind)
  if (same(norm(value, kind), b2b)) return { value: null }
  return { value }
}

/** @param {{ checked: boolean, onChange: (v: boolean) => void, disabled?: boolean, label: string }} props */
function Switch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex shrink-0 items-center gap-2 text-xs font-medium text-ink-muted disabled:opacity-50"
    >
      <span>Override</span>
      <span
        className={[
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
          checked ? 'bg-brand' : 'bg-border',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          ].join(' ')}
        />
      </span>
    </button>
  )
}

/** @param {{ src: unknown }} props */
function Thumb({ src }) {
  const [broken, setBroken] = useState(false)
  if (typeof src !== 'string' || !src || broken) return null
  return (
    <img
      src={src}
      alt=""
      onError={() => setBroken(true)}
      className="h-16 w-16 shrink-0 rounded-md border border-border bg-surface-muted object-contain"
    />
  )
}

/**
 * B2B vs override editor: one block per field, grouped into sections, sticky save bar.
 * @param {{
 *   entity: import('../api/api').CatalogEntity, id: number, version: number,
 *   fields: import('../api/api').CatalogFieldRow[], title?: string,
 *   onDirtyChange?: (dirty: boolean) => void,
 * }} props
 */
export function OverrideForm({ entity, id, version, fields, title, onDirtyChange }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState(() => Object.fromEntries(fields.map((r) => [r.field, initialState(r)])))
  const [showErrors, setShowErrors] = useState(false)
  const [onlyOverridden, setOnlyOverridden] = useState(false)
  const [flash, setFlash] = useState('')

  const plans = Object.fromEntries(fields.map((r) => [r.field, desired(state[r.field], r)]))
  const dirty = fields.filter((r) => {
    const p = plans[r.field]
    return p.error || !same(norm(p.value, r.kind), norm(r.override, r.kind))
  })
  const isDirty = dirty.length > 0

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange])

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['admin-catalog-item'] })
    queryClient.invalidateQueries({ queryKey: ['admin-catalog-list'] })
  }

  const save = useMutation({
    mutationFn: (/** @type {Record<string, unknown>} */ body) =>
      saveCatalogItem(entity, id, { expected_version: version, fields: body }),
    onSuccess: () => {
      setFlash('Saved. Storefront uses the new values right away (listings may be cached up to a minute).')
      refresh()
    },
  })

  /** @param {string} field @param {Partial<{ on: boolean, value: unknown }>} patch */
  function set(field, patch) {
    setState((prev) => ({ ...prev, [field]: { ...prev[field], ...patch } }))
    setFlash('')
  }

  /** @param {import('../api/api').CatalogFieldRow} row @param {boolean} on */
  function toggle(row, on) {
    // Pre-fill with what the storefront shows now, so editing starts from the live value.
    set(row.field, on ? { on, value: toInput(row.kind === 'bool' ? !row.effective : row.effective ?? row.b2b, row.kind) } : { on })
  }

  function discard() {
    setState(Object.fromEntries(fields.map((r) => [r.field, initialState(r)])))
    setShowErrors(false)
    save.reset()
  }

  function submit() {
    setShowErrors(true)
    if (dirty.some((r) => plans[r.field].error)) return
    /** @type {Record<string, unknown>} */
    const body = {}
    for (const r of dirty) body[r.field] = plans[r.field].value
    if (Object.keys(body).length) save.mutate(body)
  }

  const error = save.error
  const serverErrors = error ? getFieldErrors(error) : {}
  const isConflict = error?.response?.status === 409
  const busy = save.isPending
  const overriddenCount = fields.filter((r) => r.overridden).length

  const byField = Object.fromEntries(fields.map((r) => [r.field, r]))
  const groups = [
    ...SECTIONS.map((s) => ({ title: s.title, rows: s.fields.map((f) => byField[f]).filter(Boolean) })),
    { title: 'Other', rows: fields.filter((r) => !SECTIONED.has(r.field)) },
  ]
    .map((g) => ({ ...g, rows: onlyOverridden ? g.rows.filter((r) => r.overridden || state[r.field].on) : g.rows }))
    .filter((g) => g.rows.length)

  /** @param {import('../api/api').CatalogFieldRow} row */
  function renderInput(row, inputId, err) {
    const s = state[row.field]
    const cls = [inputClass, err ? 'border-red-500' : 'border-border'].join(' ')
    if (row.kind === 'bool') {
      return (
        <select id={inputId} value={s.value ? 'hidden' : 'visible'} onChange={(e) => set(row.field, { value: e.target.value === 'hidden' })} className={cls}>
          <option value="hidden">Hidden on storefront</option>
          <option value="visible">Visible (if B2B is active)</option>
        </select>
      )
    }
    if (row.kind === 'text' || row.kind === 'urls') {
      return (
        <textarea id={inputId} rows={row.kind === 'text' ? 6 : 3} value={String(s.value)} onChange={(e) => set(row.field, { value: e.target.value })} className={cls} />
      )
    }
    return (
      <input
        id={inputId}
        type={NUMERIC.includes(row.kind) ? 'number' : 'text'}
        step={row.kind === 'money' ? '0.01' : '1'}
        min={row.kind === 'sort' ? undefined : row.kind === 'qty' ? 1 : 0}
        max={row.kind === 'stock' && typeof row.b2b === 'number' ? row.b2b : undefined}
        value={String(s.value)}
        onChange={(e) => set(row.field, { value: e.target.value })}
        className={[cls, NUMERIC.includes(row.kind) ? 'max-w-xs' : ''].join(' ')}
      />
    )
  }

  return (
    <section className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">{title ?? 'Fields'}</h2>
          <p className="text-xs text-ink-muted">
            {overriddenCount ? `${overriddenCount} overridden` : 'All from B2B'} · version {version}
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" checked={onlyOverridden} onChange={(e) => setOnlyOverridden(e.target.checked)} />
          Overridden only
        </label>
      </div>

      {flash || error ? (
        <div className="space-y-3 px-5 pt-4">
          {flash ? <Alert tone="success">{flash}</Alert> : null}
          {isConflict ? (
            <Alert tone="error">
              <span>{getErrorMessage(error)}</span>{' '}
              <button type="button" className="font-semibold underline" onClick={refresh}>
                Load latest (discards edits here)
              </button>
            </Alert>
          ) : error ? (
            <Alert tone="error">{getErrorMessage(error)}</Alert>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-6 px-5 py-5">
        {groups.length === 0 ? <p className="text-sm text-ink-muted">No overridden fields.</p> : null}
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{g.title}</h3>
            <div className="space-y-2">
              {g.rows.map((row) => {
                const s = state[row.field]
                const plan = plans[row.field]
                const err = (showErrors && plan.error) || serverErrors[`fields.${row.field}`]
                const inputId = `${entity}-${id}-${row.field}`
                const pending = dirty.includes(row)
                const sameAsB2b = s.on && !plan.error && plan.value === null
                return (
                  <div
                    key={row.field}
                    className={[
                      'rounded-md border border-l-4 px-4 py-3',
                      s.on ? 'border-border border-l-brand bg-brand/5' : 'border-border border-l-transparent',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <label htmlFor={inputId} title={row.field} className="font-medium text-ink">
                            {LABELS[row.field] ?? row.field}
                          </label>
                          {row.overridden ? <Pill tone="info">Overridden</Pill> : null}
                          {pending ? <Pill tone="warn">Unsaved</Pill> : null}
                        </div>
                        <div className="mt-1 flex items-start gap-3">
                          {IMAGE_FIELDS.has(row.field) ? <Thumb src={s.on ? row.effective : row.b2b} /> : null}
                          <p className="line-clamp-3 min-w-0 whitespace-pre-wrap break-words text-sm text-ink-muted">
                            <span className="text-xs font-semibold uppercase tracking-wide">B2B </span>
                            {display(row.field === 'hidden' ? false : row.b2b, row.kind, row.field)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Switch checked={s.on} disabled={busy} onChange={(on) => toggle(row, on)} label={`Override ${LABELS[row.field] ?? row.field}`} />
                        {row.overridden && s.on ? (
                          <button type="button" disabled={busy} onClick={() => toggle(row, false)} className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50">
                            Revert to B2B
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {s.on ? (
                      <div className="mt-3">
                        {renderInput(row, inputId, err)}
                        {err ? (
                          <p className="mt-1 text-xs text-red-600">{err}</p>
                        ) : sameAsB2b ? (
                          <p className="mt-1 text-xs text-amber-700">Same as B2B, so it won’t be saved as an override.</p>
                        ) : HINTS[row.field] ? (
                          <p className="mt-1 text-xs text-ink-muted">{HINTS[row.field]}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {isDirty ? (
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-b-lg border-t border-border bg-surface/95 px-5 py-3 backdrop-blur">
          <p className="text-sm font-medium text-ink">
            {dirty.length} unsaved change{dirty.length === 1 ? '' : 's'}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={busy} onClick={discard} className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-brand disabled:opacity-50">
              Discard
            </button>
            <Button disabled={busy} onClick={submit}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
