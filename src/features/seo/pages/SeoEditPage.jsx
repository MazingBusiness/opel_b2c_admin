import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineArrowLeft, HiOutlineExternalLink } from 'react-icons/hi'
import { fetchSeoTarget, saveSeoTarget } from '../api/api'
import { Field, SnippetPreview } from '../components/SeoFields'
import { FaqEditor } from '../components/FaqEditor'
import { RelatedProductsPicker } from '../components/RelatedProductsPicker'
import { ImageAltsEditor } from '../components/ImageAltsEditor'
import { formatDateTime } from '../../users/utils'
import { getErrorMessage, getFieldErrors } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'

const TYPE_LABEL = {
  page: 'Page',
  product: 'Product',
  category_group: 'Category group',
  category: 'Category',
}

const LIST_TAB = { page: 'pages', product: 'products', category_group: 'categories', category: 'categories' }

function Section({ title, description, children }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  )
}

/** @param {import('../api/api').SeoTargetDetail} data */
function toForm(data) {
  const m = data.meta
  return {
    seo_title: m.seo_title ?? '',
    meta_description: m.meta_description ?? '',
    h1: m.h1 ?? '',
    content: m.content ?? '',
    primary_keyword: m.primary_keyword ?? '',
    secondary_keywords: (m.secondary_keywords ?? []).join(', '),
    canonical_url: m.canonical_url ?? '',
    robots: m.robots === 'noindex' ? 'noindex' : 'index',
    og_title: m.og_title ?? '',
    og_description: m.og_description ?? '',
    og_image: m.og_image ?? '',
    schema_jsonld: m.schema_jsonld ?? '',
    faq: (m.faq ?? []).map((f) => ({ q: f.q ?? '', a: f.a ?? '' })),
    related: m.related_products ?? [],
    image_alts: { ...(m.image_alts ?? {}) },
  }
}

/** @param {string} raw */
function jsonLdError(raw) {
  if (!raw.trim()) return ''
  try {
    const parsed = JSON.parse(raw)
    const blocks = Array.isArray(parsed) ? parsed : [parsed]
    if (!blocks.length || blocks.some((b) => !b || typeof b !== 'object' || Array.isArray(b) || !b['@type'])) {
      return 'Must be an object (or array of objects) each with "@type".'
    }
    return ''
  } catch (e) {
    return `Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`
  }
}

/** @param {string} v */
const nul = (v) => (v.trim() === '' ? null : v.trim())

/**
 * @param {{ data: import('../api/api').SeoTargetDetail, type: string, targetKey: string }} props
 */
function SeoEditForm({ data, type, targetKey }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(() => toForm(data))
  const [flash, setFlash] = useState('')
  const { target } = data
  const d = target.defaults

  /** @template {keyof ReturnType<typeof toForm>} K @param {K} key @param {ReturnType<typeof toForm>[K]} value */
  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFlash('')
  }

  const mutation = useMutation({
    mutationFn: () =>
      saveSeoTarget(/** @type {any} */ (type), targetKey, {
        // Optimistic concurrency: BE returns 409 if the row's version changed (or a row
        // was created) after this form loaded. 0 = no row existed.
        // Every field below is ALWAYS sent: cleared inputs go as null / [] (= clear on BE).
        expected_version: data.meta.version ?? 0,
        seo_title: nul(form.seo_title),
        meta_description: nul(form.meta_description),
        h1: nul(form.h1),
        content: nul(form.content),
        primary_keyword: nul(form.primary_keyword),
        secondary_keywords: form.secondary_keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        canonical_url: nul(form.canonical_url),
        robots: form.robots,
        og_title: nul(form.og_title),
        og_description: nul(form.og_description),
        og_image: nul(form.og_image),
        schema_jsonld: nul(form.schema_jsonld),
        faq: form.faq.filter((f) => f.q.trim() || f.a.trim()),
        related_product_ids: form.related.map((p) => p.id),
        image_alts: Object.entries(form.image_alts)
          .filter(([, alt]) => alt.trim())
          .map(([url, alt]) => ({ url, alt: alt.trim() })),
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(['admin-seo-target', type, targetKey], saved)
      queryClient.invalidateQueries({ queryKey: ['admin-seo-targets'] })
      setFlash('SEO saved. Storefront picks it up within a few minutes (edge cache).')
    },
  })

  const errors = mutation.isError ? getFieldErrors(mutation.error) : {}
  const isConflict = mutation.isError && mutation.error?.response?.status === 409
  const schemaError = jsonLdError(form.schema_jsonld)

  const previewTitle = form.seo_title.trim() || d.title || ''
  const previewDesc = form.meta_description.trim() || d.description || ''
  const previewUrl = form.canonical_url.trim() || target.url

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (schemaError) return
        mutation.mutate()
      }}
    >
      {!target.public ? (
        <Alert tone="info">
          This {TYPE_LABEL[target.type]?.toLowerCase()} is not public on the storefront (unpublished / inactive), so it
          is served as noindex and left out of the sitemap regardless of these settings.
        </Alert>
      ) : null}
      {flash ? <Alert tone="success">{flash}</Alert> : null}
      {isConflict ? (
        <Alert tone="error">
          <span>{getErrorMessage(mutation.error)}</span>{' '}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-seo-target', type, targetKey] })}
          >
            Load latest (discards edits on this screen)
          </button>
        </Alert>
      ) : mutation.isError ? (
        <Alert tone="error">{getErrorMessage(mutation.error)}</Alert>
      ) : null}

      <Section title="Search preview" description="How this page may look on Google. Empty fields use the default shown as placeholder.">
        <SnippetPreview
          title={previewTitle}
          description={previewDesc}
          url={previewUrl}
          noindex={form.robots === 'noindex' || !target.public}
        />
      </Section>

      <Section title="Search meta">
        <Field
          id="seo_title"
          label="SEO title"
          value={form.seo_title}
          onChange={(v) => set('seo_title', v)}
          placeholder={d.title}
          counter={{ target: 60, max: 90 }}
          maxLength={90}
          error={errors.seo_title}
          hint="Used as-is (no suffix is added when you set it)."
        />
        <Field
          id="meta_description"
          label="Meta description"
          value={form.meta_description}
          onChange={(v) => set('meta_description', v)}
          placeholder={d.description}
          counter={{ target: 160, max: 320 }}
          maxLength={320}
          multiline
          error={errors.meta_description}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="primary_keyword"
            label="Primary keyword"
            value={form.primary_keyword}
            onChange={(v) => set('primary_keyword', v)}
            maxLength={100}
            hint="Internal only — not published."
            error={errors.primary_keyword}
          />
          <Field
            id="secondary_keywords"
            label="Secondary keywords"
            value={form.secondary_keywords}
            onChange={(v) => set('secondary_keywords', v)}
            hint="Comma-separated. Internal only."
            error={errors.secondary_keywords || errors['secondary_keywords.0']}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
          <Field
            id="canonical_url"
            label="Canonical URL"
            type="url"
            value={form.canonical_url}
            onChange={(v) => set('canonical_url', v)}
            placeholder={target.url}
            maxLength={2048}
            error={errors.canonical_url}
            hint="Absolute http(s). Leave empty to use this page’s own URL."
          />
          <div>
            <label htmlFor="robots" className="block text-sm font-medium text-ink">
              Robots
            </label>
            <select
              id="robots"
              value={form.robots}
              onChange={(e) => set('robots', e.target.value)}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            >
              <option value="index">index</option>
              <option value="noindex">noindex</option>
            </select>
          </div>
        </div>
      </Section>

      <Section title="On-page content" description="Shown on the storefront page.">
        <Field
          id="h1"
          label="H1"
          value={form.h1}
          onChange={(v) => set('h1', v)}
          placeholder={d.h1}
          maxLength={150}
          error={errors.h1}
          hint="Leave empty to keep the page’s normal heading."
        />
        <Field
          id="content"
          label="Content (HTML)"
          value={form.content}
          onChange={(v) => set('content', v)}
          multiline
          rows={8}
          mono
          maxLength={50000}
          error={errors.content}
          hint="Allowed: h2, h3, h4, p, br, hr, ul, ol, li, strong, b, em, i, u, blockquote, a[href], table. Everything else is stripped on save (h1 becomes h2)."
        />
      </Section>

      <Section title="FAQ" description="Rendered on the page and emitted as FAQPage schema.">
        <FaqEditor items={form.faq} onChange={(v) => set('faq', v)} errors={errors} />
        {errors.faq ? <p className="text-xs text-red-600">{errors.faq}</p> : null}
      </Section>

      <Section title="Related products" description="Hand-picked products shown on this page. Hidden products are skipped publicly.">
        <RelatedProductsPicker
          value={form.related}
          onChange={(v) => set('related', v)}
          excludeId={type === 'product' ? Number(targetKey) : null}
          error={errors.related_product_ids || errors['related_product_ids.0']}
        />
      </Section>

      {type === 'product' ? (
        <Section title="Image alt text" description="Per-image alt text for the product gallery. Empty uses the product name.">
          <ImageAltsEditor
            images={target.images}
            value={form.image_alts}
            onChange={(v) => set('image_alts', v)}
            fallback={target.name}
            error={errors.image_alts}
          />
        </Section>
      ) : null}

      <Section title="Social sharing (Open Graph)">
        <Field
          id="og_title"
          label="OG title"
          value={form.og_title}
          onChange={(v) => set('og_title', v)}
          placeholder={previewTitle}
          counter={{ target: 60, max: 90 }}
          maxLength={90}
          error={errors.og_title}
        />
        <Field
          id="og_description"
          label="OG description"
          value={form.og_description}
          onChange={(v) => set('og_description', v)}
          placeholder={previewDesc}
          counter={{ target: 160, max: 320 }}
          maxLength={320}
          multiline
          error={errors.og_description}
        />
        <Field
          id="og_image"
          label="OG image URL"
          type="url"
          value={form.og_image}
          onChange={(v) => set('og_image', v)}
          placeholder={d.og_image ?? 'https://…'}
          maxLength={2048}
          error={errors.og_image}
          hint="Absolute http(s). Defaults to the product thumbnail / category banner."
        />
      </Section>

      <Section
        title="Schema (JSON-LD override)"
        description="Optional. Auto schema is generated (Product/Offer, BreadcrumbList, FAQPage). An override object replaces the auto block with the same @type; other types are added."
      >
        <Field
          id="schema_jsonld"
          label="JSON-LD"
          value={form.schema_jsonld}
          onChange={(v) => set('schema_jsonld', v)}
          multiline
          rows={8}
          mono
          maxLength={20000}
          placeholder={'{\n  "@type": "Product",\n  "name": "…"\n}'}
          error={schemaError || errors.schema_jsonld}
        />
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <p className="text-xs text-ink-muted">
          {data.meta.updated_at ? `Last saved ${formatDateTime(data.meta.updated_at)}` : 'Using defaults — not customised yet.'}
        </p>
        <button
          type="submit"
          disabled={mutation.isPending || Boolean(schemaError)}
          className="inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-ink-inverse transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : 'Save SEO'}
        </button>
      </div>
    </form>
  )
}

export function SeoEditPage() {
  const { type = '', key = '' } = useParams()

  const query = useQuery({
    queryKey: ['admin-seo-target', type, key],
    queryFn: () => fetchSeoTarget(/** @type {any} */ (type), key),
    retry: (count, error) => error?.response?.status !== 404 && count < 1,
  })

  const data = query.data
  const notFound = query.isError && query.error?.response?.status === 404

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        to={`/seo${LIST_TAB[type] && LIST_TAB[type] !== 'pages' ? `?type=${LIST_TAB[type]}` : ''}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand"
      >
        <HiOutlineArrowLeft className="h-4 w-4" aria-hidden />
        Back to SEO
      </Link>

      {query.isPending ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : notFound ? (
        <Alert tone="error">SEO target not found.</Alert>
      ) : query.isError ? (
        <Alert tone="error">{getErrorMessage(query.error)}</Alert>
      ) : data ? (
        <>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{TYPE_LABEL[data.target.type]}</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink">{data.target.name}</h1>
            <a
              href={data.target.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-brand hover:underline"
            >
              {data.target.path}
              <HiOutlineExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
          <SeoEditForm
            key={`${type}:${key}:v${data.meta.version ?? 0}`}
            data={data}
            type={type}
            targetKey={key}
          />
        </>
      ) : null}
    </div>
  )
}
