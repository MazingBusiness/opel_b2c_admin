export const inputClass =
  'mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand'

/**
 * Character counter: neutral under target, amber over target, red over max.
 * @param {{ value: string, target: number, max: number }} props
 */
export function CharCounter({ value, target, max }) {
  const n = value.length
  const tone = n > max ? 'text-red-600' : n > target ? 'text-amber-700' : 'text-ink-muted'
  return (
    <span className={['text-xs tabular-nums', tone].join(' ')}>
      {n}/{target}
      {n > target && n <= max ? ' · may be truncated' : ''}
      {n > max ? ` · max ${max}` : ''}
    </span>
  )
}

/**
 * Labeled text input or textarea with optional counter, placeholder default and error.
 * @param {{
 *   id: string, label: string, value: string, onChange: (v: string) => void,
 *   placeholder?: string | null, hint?: string, error?: string, multiline?: boolean, rows?: number,
 *   counter?: { target: number, max: number }, maxLength?: number, mono?: boolean, type?: string,
 * }} props
 */
export function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  multiline = false,
  rows = 3,
  counter,
  maxLength,
  mono = false,
  type = 'text',
}) {
  const className = [inputClass, error ? 'border-red-500' : 'border-border', mono ? 'font-mono text-xs' : ''].join(' ')
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
        </label>
        {counter ? <CharCounter value={value} target={counter.target} max={counter.max} /> : null}
      </div>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder ?? undefined}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          className={className}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder ?? undefined}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          className={className}
        />
      )}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
}

/**
 * Google-style search result preview.
 * @param {{ title: string, description: string, url: string, noindex: boolean }} props
 */
export function SnippetPreview({ title, description, url, noindex }) {
  let display = url
  try {
    const u = new URL(url)
    const crumbs = u.pathname.split('/').filter(Boolean)
    display = [u.host, ...crumbs].join(' › ')
  } catch {
    // keep raw
  }

  return (
    <div className="rounded-md border border-border bg-white p-4">
      {noindex ? (
        <p className="mb-2 text-xs font-medium text-amber-700">noindex — this page won’t appear in search results.</p>
      ) : null}
      <p className="truncate text-xs text-[#202124]">{display}</p>
      <p
        className="mt-1 truncate text-lg leading-snug text-[#1a0dab]"
        style={{ maxWidth: '600px' }}
        title={title}
      >
        {title || '—'}
      </p>
      <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#4d5156]" style={{ maxWidth: '600px' }}>
        {description || '—'}
      </p>
    </div>
  )
}
