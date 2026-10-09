import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import { activateUser, deactivateUser, fetchUser } from '../api/api'
import { fetchOrders } from '../../orders/api/api'
import { FulfilmentBadge, PaymentStatusBadge } from '../../orders/components/OrderBadges'
import { formatMoney } from '../../orders/utils'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate, formatDateTime, formatPhone } from '../utils'
import { getErrorMessage } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'

function Section({ title, description, action, children }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  )
}

function Verified({ at }) {
  return at ? (
    <span className="ml-2 text-xs text-success">Verified</span>
  ) : (
    <span className="ml-2 text-xs text-ink-muted">Unverified</span>
  )
}

/** @param {{ address: Record<string, any> }} props */
function AddressCard({ address }) {
  return (
    <div className="rounded-md border border-border p-4">
      <div className="flex items-center gap-2">
        <p className="font-medium text-ink">{address.name}</p>
        <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs capitalize text-ink-muted">
          {address.type}
        </span>
        {address.is_default ? (
          <span className="rounded bg-brand/10 px-1.5 py-0.5 text-xs font-medium text-brand">Default</span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ''}
        <br />
        {address.city}, {address.state} {address.pincode}
      </p>
      <p className="mt-1 text-sm text-ink-muted">{formatPhone(address.phone)}</p>
    </div>
  )
}

export function UserDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [flash, setFlash] = useState('')

  const query = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => fetchUser(id),
    retry: (count, error) => error?.response?.status !== 404 && count < 1,
  })

  const user = query.data?.user
  const disabled = user?.status === 'disabled'

  const ordersQuery = useQuery({
    queryKey: ['admin-orders', { userId: id, recent: true }],
    queryFn: () => fetchOrders({ user_id: id, per_page: 5, page: 1 }),
    enabled: Boolean(id) && Boolean(user),
  })

  const mutation = useMutation({
    mutationFn: () => (disabled ? activateUser(id) : deactivateUser(id)),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin-user', id], data)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setConfirmOpen(false)
      setFlash(data.user.status === 'disabled' ? 'User deactivated and signed out.' : 'User activated.')
    },
    onError: () => setConfirmOpen(false),
  })

  const notFound = query.isError && query.error?.response?.status === 404

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        to="/users"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand"
      >
        <HiOutlineArrowLeft className="h-4 w-4" aria-hidden />
        Back to users
      </Link>

      {query.isPending ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : notFound ? (
        <Alert tone="error">User not found.</Alert>
      ) : query.isError ? (
        <Alert tone="error">{getErrorMessage(query.error)}</Alert>
      ) : user ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-lg font-semibold text-brand">
                  {(user.name || user.email || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-ink">
                    {user.name || <span className="italic text-ink-muted">No name</span>}
                  </h1>
                  <StatusBadge status={user.status} />
                </div>
                <p className="mt-0.5 text-sm text-ink-muted">Shopper #{user.id}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFlash('')
                mutation.reset()
                setConfirmOpen(true)
              }}
              className={[
                'inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition-colors',
                disabled
                  ? 'bg-brand text-ink-inverse hover:bg-brand-dark'
                  : 'border border-red-300 bg-surface text-red-700 hover:bg-red-50',
              ].join(' ')}
            >
              {disabled ? 'Activate user' : 'Deactivate user'}
            </button>
          </div>

          {flash ? <Alert tone="success">{flash}</Alert> : null}
          {mutation.isError ? <Alert tone="error">{getErrorMessage(mutation.error)}</Alert> : null}
          {disabled ? (
            <Alert tone="error">
              Deactivated {formatDateTime(user.disabled_at)}. This shopper can’t sign in or use the store until
              re-activated.
            </Alert>
          ) : null}

          <Section title="Profile" description="Read-only. Shoppers manage their own profile.">
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Name">{user.name || '—'}</Field>
              <Field label="Email">
                {user.email || '—'}
                {user.email ? <Verified at={user.email_verified_at} /> : null}
              </Field>
              <Field label="Phone">
                {formatPhone(user.phone)}
                {user.phone ? <Verified at={user.phone_verified_at} /> : null}
              </Field>
              <Field label="Google sign-in">{user.google_linked ? 'Linked' : 'Not linked'}</Field>
              <Field label="Profile complete">{user.profile_complete ? 'Yes' : 'No'}</Field>
              <Field label="Orders">
                <span className="tabular-nums">{user.orders_count}</span>
              </Field>
              <Field label="Joined">{formatDate(user.created_at)}</Field>
              <Field label="Last updated">{formatDateTime(user.updated_at)}</Field>
            </dl>
          </Section>

          <Section
            title="Addresses"
            description={`${user.addresses.length} saved ${user.addresses.length === 1 ? 'address' : 'addresses'}`}
          >
            {user.addresses.length === 0 ? (
              <p className="text-sm text-ink-muted">No saved addresses.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {user.addresses.map((address) => (
                  <AddressCard key={address.id} address={address} />
                ))}
              </div>
            )}
          </Section>


          <Section
            title="Orders"
            description={`${user.orders_count} ${user.orders_count === 1 ? 'order' : 'orders'} total`}
            action={
              user.orders_count > 0 ? (
                <Link
                  to={`/orders?user_id=${user.id}`}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  View all
                </Link>
              ) : null
            }
          >
            {ordersQuery.isPending ? (
              <p className="text-sm text-ink-muted">Loading recent orders…</p>
            ) : ordersQuery.isError ? (
              <Alert tone="error">{getErrorMessage(ordersQuery.error)}</Alert>
            ) : (ordersQuery.data?.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink-muted">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <tr>
                      <th scope="col" className="py-2 pr-4">Order</th>
                      <th scope="col" className="py-2 pr-4">Status</th>
                      <th scope="col" className="py-2 pr-4">Payment</th>
                      <th scope="col" className="py-2 pr-4 text-right">Total</th>
                      <th scope="col" className="py-2">Placed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ordersQuery.data.data.map((order) => (
                      <tr key={order.number}>
                        <td className="py-3 pr-4">
                          <Link
                            to={`/orders/${order.number}`}
                            className="font-medium text-brand hover:underline"
                          >
                            {order.number}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <FulfilmentBadge status={order.status} />
                        </td>
                        <td className="py-3 pr-4">
                          <PaymentStatusBadge status={order.payment_status} />
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">{formatMoney(order.grand_total)}</td>
                        <td className="whitespace-nowrap py-3 text-ink-muted">{formatDateTime(order.placed_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <ConfirmDialog
            open={confirmOpen}
            title={disabled ? 'Activate this user?' : 'Deactivate this user?'}
            confirmLabel={disabled ? 'Activate' : 'Deactivate'}
            tone={disabled ? 'default' : 'danger'}
            busy={mutation.isPending}
            onConfirm={() => mutation.mutate()}
            onCancel={() => setConfirmOpen(false)}
          >
            {disabled
              ? 'They will be able to sign in to the store again.'
              : 'They will be signed out on all devices and blocked from signing in until re-activated.'}
          </ConfirmDialog>
        </>
      ) : null}
    </div>
  )
}
