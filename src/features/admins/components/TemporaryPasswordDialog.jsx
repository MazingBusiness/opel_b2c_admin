import { useState } from 'react'

/**
 * Shows a temporary password once. It lives only in component state and is
 * gone when the dialog closes.
 * @param {{ email: string, password: string, onClose: () => void }} props
 */
export function TemporaryPasswordDialog({ email, password, onClose }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby="temp-pw-title" className="relative w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
        <h2 id="temp-pw-title" className="text-base font-semibold text-ink">Temporary password</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Share this with <span className="font-medium text-ink">{email}</span>. It is shown only now. They must set a new password when they first sign in.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <code className="flex-1 select-all rounded-md border border-border bg-surface-muted px-3 py-2 font-mono text-base tracking-wider text-ink">{password}</code>
          <button type="button" onClick={copy} className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand">
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-ink-inverse hover:bg-brand-dark">
            I’ve shared it
          </button>
        </div>
      </div>
    </div>
  )
}
