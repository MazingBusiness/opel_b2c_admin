export function DashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Overview for staff — widgets and data land here next.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <p className="text-sm font-medium text-ink">Getting started</p>
        <p className="mt-1 text-sm text-ink-muted">
          You’re signed in to B2C Admin. Catalog, orders, and users will appear in
          this shell as we wire them.
        </p>
      </div>
    </div>
  )
}
