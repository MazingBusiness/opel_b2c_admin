const inputBase =
  'mt-1 w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted read-only:bg-surface-muted read-only:text-ink-muted read-only:focus:border-border read-only:focus:ring-0'

/**
 * Labeled input matching the LoginPage field style.
 * @param {{ id: string, label: string, error?: string, hint?: string, className?: string } & import('react').InputHTMLAttributes<HTMLInputElement>} props
 */
export function TextField({ id, label, error, hint, className = '', ...props }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={props.name ?? id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[inputBase, error ? 'border-red-500' : 'border-border'].join(' ')}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
