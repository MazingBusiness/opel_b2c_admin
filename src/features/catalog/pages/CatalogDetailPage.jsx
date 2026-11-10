import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { HiOutlineArrowLeft, HiOutlineGlobeAlt } from 'react-icons/hi'
import { fetchCatalogItem } from '../api/api'
import { OverrideForm } from '../components/OverrideForm'
import { Pill, VisibilityPill } from '../components/CatalogBadges'
import { formatDateTime } from '../../users/utils'
import { getErrorMessage } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'

const ENTITY_LABEL = { groups: 'Category group', categories: 'Category', products: 'Product', variants: 'Variant' }
const LIST_TAB = { groups: 'groups', categories: 'categories', products: 'products', variants: 'products' }

/** @param {string | undefined} value @returns {import('../api/api').CatalogEntity | null} */
function parseEntity(value) {
  return value === 'groups' || value === 'categories' || value === 'products' || value === 'variants' ? value : null
}

/** @param {{ locked: Array<{ field: string, value: unknown }> }} props */
function LockedFields({ locked }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
      {locked.map((l) => (
        <div key={l.field} className="min-w-0">
          <dt className="font-mono text-ink-muted">{l.field} 🔒</dt>
          <dd className="truncate text-ink" title={String(l.value ?? '')}>
            {l.value === null || l.value === undefined
              ? '—'
              : typeof l.value === 'object'
                ? JSON.stringify(l.value)
                : String(l.value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}


/**
 * Warn before leaving with unsaved edits: tab close/reload, and in-app link clicks
 * (BrowserRouter has no useBlocker, so intercept anchor clicks in the capture phase).
 * @param {boolean} active
 */
function useUnsavedGuard(active) {
  useEffect(() => {
    if (!active) return undefined
    const msg = 'You have unsaved changes. Leave without saving?'
    /** @param {BeforeUnloadEvent} e */
    const onUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    /** @param {MouseEvent} e */
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = /** @type {HTMLElement | null} */ (e.target)?.closest?.('a[href]')
      if (!a || a.getAttribute('target') === '_blank') return
      if (!window.confirm(msg)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('beforeunload', onUnload)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [active])
}

/** Tracks which forms on the page have unsaved edits. */
function useDirtyForms() {
  const [dirty, setDirty] = useState(/** @type {Set<string>} */ (new Set()))
  const cache = useRef(/** @type {Map<string, (d: boolean) => void>} */ (new Map()))
  const reporter = useCallback((/** @type {string} */ key) => {
    let fn = cache.current.get(key)
    if (!fn) {
      fn = (/** @type {boolean} */ d) =>
        setDirty((prev) => {
          if (prev.has(key) === d) return prev
          const next = new Set(prev)
          if (d) next.add(key)
          else next.delete(key)
          return next
        })
      cache.current.set(key, fn)
    }
    return fn
  }, [])
  return { anyDirty: dirty.size > 0, reporter }
}

export function CatalogDetailPage() {
  const params = useParams()
  const entity = parseEntity(params.entity)
  const id = Number.parseInt(params.id ?? '', 10)
  const valid = entity !== null && Number.isFinite(id) && id > 0

  const query = useQuery({
    queryKey: ['admin-catalog-item', entity, id],
    queryFn: () => fetchCatalogItem(/** @type {any} */ (entity), id),
    enabled: valid,
  })

  const data = query.data
  const { anyDirty, reporter } = useDirtyForms()
  useUnsavedGuard(anyDirty)
  const item = data?.item ?? {}

  return (
    <div className="space-y-5">
      <Link
        to={`/catalog${LIST_TAB[entity ?? 'products'] === 'products' ? '' : `?type=${LIST_TAB[entity ?? 'products']}`}`}
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-brand"
      >
        <HiOutlineArrowLeft className="h-4 w-4" aria-hidden />
        Back to catalog
      </Link>

      {!valid ? (
        <Alert tone="error">Unknown catalog item.</Alert>
      ) : query.isPending ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : query.isError ? (
        <Alert tone="error">{getErrorMessage(query.error)}</Alert>
      ) : data ? (
        <>
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  {ENTITY_LABEL[entity]}
                  {entity === 'categories' ? (item.level === 'sub' ? ' · subcategory' : ' · top-level') : ''} · #{data.id}
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-ink">{item.name ?? item.part_no}</h1>
                {item.b2b_name && item.b2b_name !== item.name ? (
                  <p className="text-sm text-ink-muted">B2B name: {item.b2b_name}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                  <VisibilityPill row={item} />
                  {data.overridden_fields.length ? (
                    <Pill tone="info">{data.overridden_fields.length} overridden</Pill>
                  ) : (
                    <Pill>All B2B</Pill>
                  )}
                  {item.group ? <span>Group: {item.group.name}</span> : null}
                  {item.parent ? <span>· Parent: {item.parent.name}</span> : null}
                  {item.category ? <span>· Category: {item.category.name}</span> : null}
                  {item.product ? (
                    <Link className="hover:text-brand hover:underline" to={`/catalog/products/${item.product.id}`}>
                      · Product: {item.product.name}
                    </Link>
                  ) : null}
                  {data.override_updated_at ? <span>· Last override {formatDateTime(data.override_updated_at)}</span> : null}
                </div>
              </div>
              {data.seo ? (
                <Link
                  to={data.seo.admin_path}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand"
                >
                  <HiOutlineGlobeAlt className="h-4 w-4" aria-hidden />
                  Edit SEO
                </Link>
              ) : null}
            </div>
            <details className="group mt-4 border-t border-border pt-3">
              <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-ink-muted hover:text-ink">
                B2B details (locked)
              </summary>
              <div className="mt-3">
                <LockedFields locked={data.locked} />
              </div>
            </details>
          </div>

          <OverrideForm
            key={`${entity}:${data.id}:${data.version}`}
            entity={/** @type {any} */ (entity)}
            id={data.id}
            version={data.version}
            fields={data.fields}
            title={entity === 'products' ? 'Product fields' : 'Fields'}
            onDirtyChange={reporter(`${entity}:${data.id}`)}
          />

          {entity === 'products' && data.variants?.length ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-ink">Variants — price &amp; stock</h2>
              {data.variants.map((v) => (
                <div key={v.id} className="space-y-2">
                  <details className="rounded-lg border border-border bg-surface px-5 py-3 shadow-sm">
                    <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-ink-muted hover:text-ink">
                      B2B details · {v.part_no} (locked)
                    </summary>
                    <div className="mt-3">
                      <LockedFields locked={v.locked} />
                    </div>
                  </details>
                  <OverrideForm
                    onDirtyChange={reporter(`variants:${v.id}`)}
                    key={`variants:${v.id}:${v.version}`}
                    entity="variants"
                    id={v.id}
                    version={v.version}
                    fields={v.fields}
                    title={`Variant ${v.part_no}${v.is_default ? ' (default)' : ''}`}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
