const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** @param {string | null | undefined} iso */
export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dateFormatter.format(d)
}

/** @param {string | null | undefined} iso */
export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFormatter.format(d)
}

/**
 * Stored phones are 91XXXXXXXXXX; show as +91 XXXXX XXXXX.
 * @param {string | null | undefined} phone
 */
export function formatPhone(phone) {
  if (!phone) return '—'
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }
  return String(phone)
}
