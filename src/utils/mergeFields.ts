import type { CertificateTemplate } from '../types/certificate'
import type { RecipientValues } from '../types/recipients'

const mergePattern = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g

const fieldLabels: Record<string, string> = {
  name: 'Recipient name',
  organization: 'Organization',
  event: 'Event',
  award: 'Award',
  role: 'Role',
  date: 'Date',
  signatory: 'Signatory',
}

const fieldEditorTokens: Record<string, string> = {
  name: 'Name',
  organization: 'Organization',
  event: 'Event',
  award: 'Award',
  role: 'Role',
  date: 'Date',
  signatory: 'Signatory',
}

const tokenToField = Object.fromEntries(
  Object.entries(fieldEditorTokens).map(([field, token]) => [token.toLowerCase(), field]),
)

function humanizeField(field: string) {
  return field
    .replace(/[_.-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function getMergeFieldLabel(field: string) {
  return fieldLabels[field] ?? humanizeField(field)
}

export function getMergeFieldEditorToken(field: string) {
  return fieldEditorTokens[field] ?? field
}

export function toEditorMergeText(text: string) {
  return text.replace(mergePattern, (_match, field: string) => `@${getMergeFieldEditorToken(field)}`)
}

export function fromEditorMergeText(text: string) {
  return text.replace(/@([a-zA-Z][a-zA-Z0-9_.-]*)/g, (_match, token: string) => {
    const field = tokenToField[token.toLowerCase()] ?? token
    return `{{${field}}}`
  })
}

export type MergeTextPart = {
  type: 'text' | 'field'
  value: string
  field?: string
  resolved?: boolean
}

export function splitMergeText(text: string, values?: RecipientValues): MergeTextPart[] {
  const parts: MergeTextPart[] = []
  let lastIndex = 0

  for (const match of text.matchAll(mergePattern)) {
    const index = match.index ?? 0
    if (index > lastIndex) parts.push({ type: 'text', value: text.slice(lastIndex, index) })

    const field = match[1]
    const resolvedValue = values?.[field]
    parts.push({
      type: 'field',
      field,
      value: resolvedValue || getMergeFieldLabel(field),
      resolved: Boolean(resolvedValue),
    })
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) parts.push({ type: 'text', value: text.slice(lastIndex) })
  return parts.length ? parts : [{ type: 'text', value: text }]
}

export function resolveMergeFields(text: string, values?: RecipientValues, keepUnknown = true) {
  if (!values) return text
  return text.replace(mergePattern, (match, field: string) => {
    const value = values[field]
    return value === undefined || value === '' ? (keepUnknown ? match : '') : value
  })
}

export function getTemplateMergeFields(template: CertificateTemplate) {
  const fields = new Set<string>()
  template.elements.forEach((element) => {
    if (element.type !== 'text') return
    for (const match of element.text.matchAll(mergePattern)) fields.add(match[1])
  })
  return [...fields]
}
