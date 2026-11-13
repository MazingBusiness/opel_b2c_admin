import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'

const inputClass =
  'mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand'
const smallButton =
  'inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40'

export const EMPTY_SLIDE = { image_url: '', link_url: '' }
export const EMPTY_BANNER = {
  eyebrow: '', title: '', subtitle: '', badge: '', cta_label: '', href: '', image_url: '', tone: '',
}

/**
 * @param {{ id: string, label: string, value: string | number, onChange: (v: string) => void, error?: string, hint?: string, type?: string, placeholder?: string, className?: string, min?: number, max?: number }} props
 */
function Field({ id, label, value, onChange, error, hint, type = 'text', placeholder, className = '', min, max }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-medium text-ink">{label}</label>
      <input
        id={id}
        type={type}
        min={min}
        max={max}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={[inputClass, error ? 'border-red-500' : 'border-border'].join(' ')}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  )
}

/** @param {{ src: string }} props */
function Thumb({ src }) {
  if (!/^https:\/\//.test(src || '')) return null
  return <img src={src} alt="" className="h-14 w-24 shrink-0 rounded border border-border object-cover" loading="lazy" />
}

/**
 * @param {{
 *   section: Record<string, any>, index: number, errors: Record<string, string>,
 *   groups: import('../api/api').HomeGroup[], tones: string[],
 *   onChange: (next: Record<string, any>) => void,
 * }} props
 */
export function SectionEditor({ section, index, errors, groups, tones, onChange }) {
  const err = (/** @type {string} */ path) => errors[`sections.${index}.${path}`]
  const set = (/** @type {Record<string, any>} */ patch) => onChange({ ...section, ...patch })
  const base = `s${index}`

  if (section.type === 'hero') {
    const slides = section.slides
    const setSlide = (i, patch) => set({ slides: slides.map((s, j) => (j === i ? { ...s, ...patch } : s)) })
    return (
      <div className="space-y-3">
        {err('slides') ? <p className="text-xs text-red-600">{err('slides')}</p> : null}
        {slides.map((slide, i) => (
          <div key={i} className="flex items-start gap-3 rounded-md border border-border p-3">
            <Thumb src={slide.image_url} />
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <Field id={`${base}-slide${i}-img`} label={`Slide ${i + 1} image URL`} placeholder="https://…" value={slide.image_url} onChange={(v) => setSlide(i, { image_url: v })} error={err(`slides.${i}.image_url`)} />
              <Field id={`${base}-slide${i}-link`} label="Link (optional)" placeholder="/products?group=… or https://…" value={slide.link_url} onChange={(v) => setSlide(i, { link_url: v })} error={err(`slides.${i}.link_url`)} />
            </div>
            <button type="button" className={smallButton} disabled={slides.length <= 1} onClick={() => set({ slides: slides.filter((_, j) => j !== i) })} aria-label={`Remove slide ${i + 1}`}>
              <HiOutlineTrash className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
        <button type="button" className={smallButton} disabled={slides.length >= 10} onClick={() => set({ slides: [...slides, { ...EMPTY_SLIDE }] })}>
          <HiOutlinePlus className="h-4 w-4" aria-hidden /> Add slide
        </button>
      </div>
    )
  }

  if (section.type === 'category_band') {
    const group = groups.find((g) => g.id === Number(section.group_id))
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${base}-group`} className="block text-xs font-medium text-ink">Category group</label>
          <select
            id={`${base}-group`}
            value={section.group_id ?? ''}
            onChange={(e) => set({ group_id: e.target.value ? Number(e.target.value) : '' })}
            className={[inputClass, err('group_id') ? 'border-red-500' : 'border-border'].join(' ')}
          >
            <option value="">Choose a group…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}{g.visible ? '' : ' (hidden in catalog)'}</option>
            ))}
          </select>
          {err('group_id') ? <p className="mt-1 text-xs text-red-600">{err('group_id')}</p>
            : group && !group.visible ? <p className="mt-1 text-xs text-amber-700">This group is hidden in the catalog, so the band will not show.</p> : null}
        </div>
        <Field id={`${base}-title`} label="Title (optional)" placeholder={group?.name ?? 'Defaults to the group name'} value={section.title} onChange={(v) => set({ title: v })} error={err('title')} />
        <Field id={`${base}-limit`} label="Products shown" type="number" min={4} max={24} value={section.product_limit} onChange={(v) => set({ product_limit: v })} error={err('product_limit')} hint="4 to 24. In-stock products from this group fill the rest after pins." />
        <div>
          <label htmlFor={`${base}-pins`} className="block text-xs font-medium text-ink">Pinned part numbers (optional)</label>
          <textarea
            id={`${base}-pins`}
            rows={2}
            value={section.pinned_text}
            placeholder="One per line or comma separated, shown first in this order"
            onChange={(e) => set({ pinned_text: e.target.value })}
            className={[inputClass, err('pinned_part_nos') ? 'border-red-500' : 'border-border'].join(' ')}
          />
          {err('pinned_part_nos') ? <p className="mt-1 text-xs text-red-600">{err('pinned_part_nos')}</p>
            : <p className="mt-1 text-xs text-ink-muted">Unknown or out-of-stock part numbers are skipped.</p>}
        </div>
      </div>
    )
  }

  const banners = section.banners
  const setBanner = (i, patch) => set({ banners: banners.map((b, j) => (j === i ? { ...b, ...patch } : b)) })
  return (
    <div className="space-y-3">
      {err('banners') ? <p className="text-xs text-red-600">{err('banners')}</p> : null}
      {banners.map((b, i) => {
        const id = `${base}-b${i}`
        const e = (/** @type {string} */ f) => err(`banners.${i}.${f}`)
        return (
          <div key={i} className="rounded-md border border-border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Thumb src={b.image_url} />
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Banner {i + 1}</span>
              </div>
              <button type="button" className={smallButton} disabled={banners.length <= 1} onClick={() => set({ banners: banners.filter((_, j) => j !== i) })} aria-label={`Remove banner ${i + 1}`}>
                <HiOutlineTrash className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field id={`${id}-title`} label="Title" value={b.title} onChange={(v) => setBanner(i, { title: v })} error={e('title')} className="lg:col-span-2" />
              <Field id={`${id}-eyebrow`} label="Eyebrow (optional)" value={b.eyebrow} onChange={(v) => setBanner(i, { eyebrow: v })} error={e('eyebrow')} />
              <Field id={`${id}-badge`} label="Badge (optional)" value={b.badge} onChange={(v) => setBanner(i, { badge: v })} error={e('badge')} />
              <Field id={`${id}-subtitle`} label="Subtitle (optional)" value={b.subtitle} onChange={(v) => setBanner(i, { subtitle: v })} error={e('subtitle')} className="sm:col-span-2" />
              <Field id={`${id}-cta`} label="Button text (optional)" value={b.cta_label} onChange={(v) => setBanner(i, { cta_label: v })} error={e('cta_label')} />
              <div>
                <label htmlFor={`${id}-tone`} className="block text-xs font-medium text-ink">Colour</label>
                <select id={`${id}-tone`} value={b.tone ?? ''} onChange={(ev) => setBanner(i, { tone: ev.target.value })} className={[inputClass, e('tone') ? 'border-red-500' : 'border-border'].join(' ')}>
                  <option value="">Default</option>
                  {tones.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <Field id={`${id}-href`} label="Link" placeholder="/products?group=… or https://…" value={b.href} onChange={(v) => setBanner(i, { href: v })} error={e('href')} className="sm:col-span-2" />
              <Field id={`${id}-img`} label="Image URL" placeholder="https://…" value={b.image_url} onChange={(v) => setBanner(i, { image_url: v })} error={e('image_url')} className="sm:col-span-2" />
            </div>
          </div>
        )
      })}
      <button type="button" className={smallButton} disabled={banners.length >= 4} onClick={() => set({ banners: [...banners, { ...EMPTY_BANNER }] })}>
        <HiOutlinePlus className="h-4 w-4" aria-hidden /> Add banner
      </button>
    </div>
  )
}
