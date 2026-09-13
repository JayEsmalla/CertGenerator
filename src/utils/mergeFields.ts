import type { CertificateTemplate } from '../types/certificate'
import type { RecipientValues } from '../types/recipients'

const mergePattern = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g

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
    for (const match of element.text.matchAll(mergePattern)) {
      fields.add(match[1])
    }
  })
  return [...fields]
}
