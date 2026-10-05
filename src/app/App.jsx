import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { AuthSessionBootstrap } from '../features/auth/components/AuthSessionBootstrap'
import { useAuthStore } from '../features/auth/store/useAuthStore'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { UsersListPage } from '../features/users/pages/UsersListPage'
import { UserDetailPage } from '../features/users/pages/UserDetailPage'

function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  const bootstrapped = useAuthStore((s) => s.bootstrapped)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)

  if (!hasHydrated || !bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted text-sm text-ink-muted">
        Loading…
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function PublicOnlyRoute() {
  const token = useAuthStore((s) => s.token)
  const bootstrapped = useAuthStore((s) => s.bootstrapped)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)

  if (!hasHydrated || !bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted text-sm text-ink-muted">
        Loading…
      </div>
    )
  }

  if (token) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export function App() {
  return (
    <BrowserRouter>
      <AuthSessionBootstrap />
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Reachable even with a session: emailed links may be opened in a signed-in browser. */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UsersListPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
