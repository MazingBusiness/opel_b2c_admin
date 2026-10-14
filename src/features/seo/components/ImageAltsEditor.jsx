import { inputClass } from './SeoFields'

/**
 * @param {{
 *   images: string[], value: Record<string, string>, onChange: (v: Record<string, string>) => void,
 *   fallback: string, error?: string,
 * }} props
 */
export function ImageAltsEditor({ images, value, onChange, fallback, error }) {
  if (images.length === 0) {
    return <p className="text-sm text-ink-muted">This product has no images.</p>
  }

  return (
    <div className="space-y-3">
      {images.map((url, index) => (
        <div key={url} className="flex items-start gap-3">
          <img src={url} alt="" className="h-14 w-14 shrink-0 rounded border border-border object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[11px] text-ink-muted" title={url}>
              {index === 0 ? 'Thumbnail · ' : ''}
              {url}
            </p>
            <input
              aria-label={`Alt text for image ${index + 1}`}
              value={value[url] ?? ''}
              maxLength={255}
              placeholder={index === 0 ? fallback : `${fallback} — image ${index + 1}`}
              onChange={(e) => onChange({ ...value, [url]: e.target.value })}
              className={[inputClass, 'border-border'].join(' ')}
            />
          </div>
        </div>
      ))}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
