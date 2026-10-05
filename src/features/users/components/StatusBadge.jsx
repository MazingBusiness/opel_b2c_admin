/**
 * @param {{ status: 'active' | 'disabled' }} props
 */
export function StatusBadge({ status }) {
  const disabled = status === 'disabled'
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        disabled
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-success/30 bg-success/10 text-success',
      ].join(' ')}
    >
      <span
        className={['h-1.5 w-1.5 rounded-full', disabled ? 'bg-red-600' : 'bg-success'].join(' ')}
        aria-hidden
      />
      {disabled ? 'Disabled' : 'Active'}
    </span>
  )
}
