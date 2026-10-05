const tones = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-success/30 bg-success/10 text-success',
  info: 'border-brand/30 bg-brand/5 text-brand-dark',
}

/**
 * Inline status message (errors use role="alert", others role="status").
 * @param {{ tone?: 'error' | 'success' | 'info', children: import('react').ReactNode, className?: string }} props
 */
export function Alert({ tone = 'info', children, className = '' }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={['rounded-md border px-3 py-2 text-sm', tones[tone], className].join(' ')}
    >
      {children}
    </div>
  )
}
