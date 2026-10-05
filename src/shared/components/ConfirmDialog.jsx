import { useEffect, useRef } from 'react'

/**
 * Minimal accessible confirm modal.
 * @param {{
 *   open: boolean,
 *   title: string,
 *   children?: import('react').ReactNode,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   tone?: 'danger' | 'default',
 *   busy?: boolean,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  busy = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(/** @type {HTMLButtonElement | null} */ (null))

  useEffect(() => {
    if (!open) return undefined
    cancelRef.current?.focus()
    function onKey(event) {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden
        onClick={() => {
          if (!busy) onCancel()
        }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-lg sm:p-6"
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-ink">
          {title}
        </h2>
        {children ? <div className="mt-2 text-sm text-ink-muted">{children}</div> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={[
              'inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              tone === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-brand text-ink-inverse hover:bg-brand-dark',
            ].join(' ')}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
