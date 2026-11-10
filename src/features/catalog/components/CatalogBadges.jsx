const tones = {
  success: 'border-success/30 bg-success/10 text-success',
  muted: 'border-border bg-surface-muted text-ink-muted',
  warn: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-brand/30 bg-brand/5 text-brand-dark',
}

/** @param {{ tone?: keyof typeof tones, children: import('react').ReactNode, title?: string }} props */
export function Pill({ tone = 'muted', children, title }) {
  return (
    <span
      title={title}
      className={['inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', tones[tone]].join(' ')}
    >
      {children}
    </span>
  )
}

/** @param {{ row: Record<string, any> }} props */
export function VisibilityPill({ row }) {
  if (row.hidden) return <Pill tone="danger">Hidden (admin)</Pill>
  if (row.hidden_by_parent || row.hidden_by_category) {
    return <Pill tone="warn" title="Hidden because a parent category or group is hidden">Hidden via parent</Pill>
  }
  if (!row.public) return <Pill tone="muted" title="Inactive / unpublished in B2B">Off in B2B</Pill>
  return <Pill tone="success">Visible</Pill>
}
