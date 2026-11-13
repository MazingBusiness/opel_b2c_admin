import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineArrowDown, HiOutlineArrowUp, HiOutlineEye, HiOutlineEyeOff, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'
import { fetchHomeLayout, saveHomeLayout } from '../api/api'
import { EMPTY_BANNER, EMPTY_SLIDE, SectionEditor } from '../components/SectionEditor'
import { Alert } from '../../../shared/components/Alert'
import { Button } from '../../../shared/components/Button'
import { getErrorMessage, getFieldErrors } from '../../../shared/api/client'

const QUERY_KEY = ['admin-home-layout']
const TYPE_LABEL = { hero: 'Hero slider', category_band: 'Category band', banner_row: 'Banner row' }
const iconButton =
  'inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40'

/** Server section to editable form state: nulls become '' and pins become one text box. */
function toForm(/** @type {import('../api/api').HomeSection[]} */ sections) {
  const blank = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v ?? '']))
  return sections.map((s) => {
    if (s.type === 'hero') return { ...s, slides: s.slides.map(blank) }
    if (s.type === 'banner_row') return { ...s, banners: s.banners.map(blank) }
    return { ...s, title: s.title ?? '', pinned_text: (s.pinned_part_nos ?? []).join('\n') }
  })
}

/** Form state back to the PUT shape: '' becomes null, pins split on commas and newlines. */
function toPayload(/** @type {Array<Record<string, any>>} */ form) {
  const nul = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' && v.trim() === '' ? null : typeof v === 'string' ? v.trim() : v]))
  return form.map((s) => {
    const base = { id: s.id, type: s.type, hidden: Boolean(s.hidden) }
    if (s.type === 'hero') return { ...base, slides: s.slides.map(nul) }
    if (s.type === 'banner_row') return { ...base, banners: s.banners.map(nul) }
    return {
      ...base,
      group_id: s.group_id === '' ? null : Number(s.group_id),
      title: s.title.trim() || null,
      product_limit: s.product_limit === '' ? null : Number(s.product_limit),
      pinned_part_nos: s.pinned_text.split(/[\s,]+/).map((p) => p.trim()).filter(Boolean),
    }
  })
}

function newSection(/** @type {string} */ type, /** @type {import('../api/api').HomeGroup[]} */ groups) {
  const id = `${type.replace('_', '-')}-${Date.now().toString(36)}`
  if (type === 'hero') return { id, type, hidden: false, slides: [{ ...EMPTY_SLIDE }] }
  if (type === 'banner_row') return { id, type, hidden: false, banners: [{ ...EMPTY_BANNER }] }
  const first = groups.find((g) => g.visible) ?? groups[0]
  return { id, type, hidden: false, group_id: first?.id ?? '', title: '', product_limit: 12, pinned_text: '' }
}

function summary(/** @type {Record<string, any>} */ s, /** @type {import('../api/api').HomeGroup[]} */ groups) {
  if (s.type === 'hero') return `${s.slides.length} slide${s.slides.length === 1 ? '' : 's'}`
  if (s.type === 'banner_row') return `${s.banners.length} banner${s.banners.length === 1 ? '' : 's'}`
  const g = groups.find((x) => x.id === Number(s.group_id))
  return s.title || g?.name || 'No group chosen'
}

export function HomeLayoutPage() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: QUERY_KEY, queryFn: fetchHomeLayout })
  const [form, setForm] = useState(/** @type {Array<Record<string, any>> | null} */ (null))
  const [open, setOpen] = useState(/** @type {Record<string, boolean>} */ ({}))
  const [saved, setSaved] = useState(false)

  const layout = query.data
  useEffect(() => {
    if (layout && form === null) setForm(toForm(layout.sections))
  }, [layout, form])

  const save = useMutation({
    mutationFn: (/** @type {Array<Record<string, any>>} */ sections) =>
      saveHomeLayout({ expected_version: layout?.version ?? 0, sections: toPayload(sections) }),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data)
      setForm(toForm(data.sections))
      setSaved(true)
    },
  })

  const dirty = useMemo(
    () => Boolean(layout && form && JSON.stringify(toPayload(form)) !== JSON.stringify(toPayload(toForm(layout.sections)))),
    [layout, form],
  )

  useEffect(() => {
    if (dirty) setSaved(false)
  }, [dirty])

  if (query.isLoading || (layout && !form)) return <p className="text-sm text-ink-muted">Loading…</p>
  if (query.isError) return <Alert tone="error">{getErrorMessage(query.error)}</Alert>
  if (!layout || !form) return null

  const groups = layout.groups
  const errors = save.error ? getFieldErrors(save.error) : {}
  const isConflict = save.error?.response?.status === 409

  const update = (i, next) => setForm(form.map((s, j) => (j === i ? next : s)))
  const move = (i, d) => {
    const next = [...form]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    setForm(next)
  }
  const add = (type) => {
    const s = newSection(type, groups)
    setForm([...form, s])
    setOpen({ ...open, [s.id]: true })
  }
  const reload = async () => {
    save.reset()
    const fresh = await query.refetch()
    if (fresh.data) setForm(toForm(fresh.data.sections))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Homepage</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Sections show on the storefront homepage in this order. Category bands fill themselves from live products, brands and categories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty ? (
            <button type="button" className={iconButton} disabled={save.isPending} onClick={() => { save.reset(); setForm(toForm(layout.sections)) }}>
              Discard changes
            </button>
          ) : null}
          <Button disabled={!dirty || save.isPending} onClick={() => save.mutate(form)}>
            {save.isPending ? 'Saving…' : 'Save homepage'}
          </Button>
        </div>
      </div>

      {layout.is_default ? (
        <Alert tone="info">Nothing has been saved yet, so the storefront shows the default: one band per visible category group. Saving makes this layout the live one.</Alert>
      ) : null}
      {saved && !dirty ? <Alert tone="success">Saved. The storefront homepage now uses this layout.</Alert> : null}
      {isConflict ? (
        <Alert tone="error">
          {getErrorMessage(save.error)}{' '}
          <button type="button" className="font-semibold underline" onClick={reload}>Reload latest</button>
        </Alert>
      ) : save.error ? (
        <Alert tone="error">{Object.keys(errors).length ? 'Some fields need fixing. They are marked below.' : getErrorMessage(save.error)}</Alert>
      ) : null}
      {form.length === 0 ? <Alert tone="info">No sections. If you save this, the homepage will be empty.</Alert> : null}

      <ol className="space-y-3">
        {form.map((s, i) => {
          const hasError = Object.keys(errors).some((k) => k.startsWith(`sections.${i}.`))
          const expanded = open[s.id] || hasError
          return (
            <li key={s.id} className={['rounded-lg border bg-surface shadow-sm', hasError ? 'border-red-400' : 'border-border', s.hidden ? 'opacity-60' : ''].join(' ')}>
              <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setOpen({ ...open, [s.id]: !expanded })} aria-expanded={expanded}>
                  <span className="w-6 shrink-0 text-xs font-semibold text-ink-muted">{i + 1}</span>
                  <span className="shrink-0 rounded bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink">{TYPE_LABEL[s.type]}</span>
                  <span className="truncate text-sm text-ink">{summary(s, groups)}</span>
                  {s.hidden ? <span className="shrink-0 text-xs text-ink-muted">Hidden</span> : null}
                </button>
                <button type="button" className={iconButton} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><HiOutlineArrowUp className="h-4 w-4" aria-hidden /></button>
                <button type="button" className={iconButton} disabled={i === form.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><HiOutlineArrowDown className="h-4 w-4" aria-hidden /></button>
                <button type="button" className={iconButton} onClick={() => update(i, { ...s, hidden: !s.hidden })} aria-label={s.hidden ? 'Show section' : 'Hide section'}>
                  {s.hidden ? <HiOutlineEyeOff className="h-4 w-4" aria-hidden /> : <HiOutlineEye className="h-4 w-4" aria-hidden />}
                </button>
                <button type="button" className={iconButton} onClick={() => setForm(form.filter((_, j) => j !== i))} aria-label="Remove section"><HiOutlineTrash className="h-4 w-4" aria-hidden /></button>
              </div>
              {expanded ? (
                <div className="border-t border-border px-4 py-4">
                  <SectionEditor section={s} index={i} errors={errors} groups={groups} tones={layout.tones} onChange={(next) => update(i, next)} />
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap gap-2">
        {Object.entries(TYPE_LABEL).map(([type, label]) => (
          <button key={type} type="button" className={iconButton} disabled={form.length >= 30} onClick={() => add(type)}>
            <HiOutlinePlus className="h-4 w-4" aria-hidden /> Add {label.toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  )
}
