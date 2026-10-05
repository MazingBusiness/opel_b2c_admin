import opelLogo from '../../../assets/images/opelLogo.jpg'

/**
 * Centered card shell shared by public auth pages (login, forgot, reset).
 * @param {{ title?: string, subtitle?: string, children: import('react').ReactNode }} props
 */
export function AuthCard({ title = 'B2C Admin', subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <img src={opelLogo} alt="OPEL Tools" className="h-10 w-auto object-contain sm:h-11" />
          <h1 className="mt-4 text-xl font-semibold text-ink">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-ink-muted">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </div>
  )
}
