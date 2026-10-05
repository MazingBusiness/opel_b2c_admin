export function Button({ children, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center rounded-md bg-cta px-4 py-2.5 text-sm font-semibold text-cta-foreground transition-colors hover:bg-highlight-dark disabled:cursor-not-allowed disabled:opacity-50',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
