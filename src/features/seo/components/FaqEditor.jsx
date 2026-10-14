import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'
import { inputClass } from './SeoFields'

const MAX_ITEMS = 20

/**
 * @param {{
 *   items: Array<{ q: string, a: string }>,
 *   onChange: (items: Array<{ q: string, a: string }>) => void,
 *   errors: Record<string, string>,
 * }} props
 */
export function FaqEditor({ items, onChange, errors }) {
  /** @param {number} index @param {'q' | 'a'} field @param {string} value */
  function update(index, field, value) {
    onChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? <p className="text-sm text-ink-muted">No FAQ yet. Adds FAQPage schema when present.</p> : null}
      {items.map((item, index) => (
        <div key={index} className="rounded-md border border-border p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Q{index + 1}</p>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline"
            >
              <HiOutlineTrash className="h-3.5 w-3.5" aria-hidden />
              Remove
            </button>
          </div>
          <input
            aria-label={`Question ${index + 1}`}
            value={item.q}
            maxLength={300}
            placeholder="Question"
            onChange={(e) => update(index, 'q', e.target.value)}
            className={[inputClass, errors[`faq.${index}.q`] ? 'border-red-500' : 'border-border'].join(' ')}
          />
          {errors[`faq.${index}.q`] ? <p className="mt-1 text-xs text-red-600">{errors[`faq.${index}.q`]}</p> : null}
          <textarea
            aria-label={`Answer ${index + 1}`}
            value={item.a}
            rows={2}
            maxLength={2000}
            placeholder="Answer (plain text)"
            onChange={(e) => update(index, 'a', e.target.value)}
            className={[inputClass, errors[`faq.${index}.a`] ? 'border-red-500' : 'border-border'].join(' ')}
          />
          {errors[`faq.${index}.a`] ? <p className="mt-1 text-xs text-red-600">{errors[`faq.${index}.a`]}</p> : null}
        </div>
      ))}
      <button
        type="button"
        disabled={items.length >= MAX_ITEMS}
        onClick={() => onChange([...items, { q: '', a: '' }])}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        <HiOutlinePlus className="h-4 w-4" aria-hidden />
        Add question
      </button>
    </div>
  )
}
