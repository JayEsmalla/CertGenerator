import type { CertificateTemplate } from '../types/certificate'
import type { RecipientDataset, RecipientRow } from '../types/recipients'
import { getTemplateMergeFields } from '../utils/mergeFields'

export type RecipientRowIssue = {
  rowId: string
  missingFields: string[]
}

export type RecipientIntegrityReport = {
  enabledCount: number
  validCount: number
  invalidCount: number
  requiredFields: string[]
  missingDatasetFields: string[]
  rowIssues: RecipientRowIssue[]
  invalidRowIds: Set<string>
  duplicateRowIds: Set<string>
  duplicateGroupCount: number
  canGenerate: boolean
}

function normalizedValue(value?: string) {
  return (value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

function requiredFieldsForTemplate(template: CertificateTemplate) {
  return getTemplateMergeFields(template).filter((field) => !template.defaults?.[field]?.trim())
}

function duplicateRows(rows: RecipientRow[]) {
  const groups = new Map<string, string[]>()
  for (const row of rows) {
    const name = normalizedValue(row.values.name)
    if (!name) continue
    const current = groups.get(name) ?? []
    current.push(row.id)
    groups.set(name, current)
  }
  const duplicateGroups = [...groups.values()].filter((ids) => ids.length > 1)
  return {
    rowIds: new Set(duplicateGroups.flat()),
    groupCount: duplicateGroups.length,
  }
}

export function analyzeRecipientIntegrity(template: CertificateTemplate, dataset: RecipientDataset): RecipientIntegrityReport {
  const enabledRows = dataset.rows.filter((row) => row.enabled)
  const requiredFields = requiredFieldsForTemplate(template)
  const missingDatasetFields = requiredFields.filter((field) => !dataset.fields.includes(field))

  const rowIssues = enabledRows.map((row) => ({
    rowId: row.id,
    missingFields: requiredFields.filter((field) => !normalizedValue(row.values[field])),
  })).filter((issue) => issue.missingFields.length > 0)

  const invalidRowIds = new Set(rowIssues.map((issue) => issue.rowId))
  const duplicates = duplicateRows(enabledRows)
  const invalidCount = invalidRowIds.size

  return {
    enabledCount: enabledRows.length,
    validCount: enabledRows.length - invalidCount,
    invalidCount,
    requiredFields,
    missingDatasetFields,
    rowIssues,
    invalidRowIds,
    duplicateRowIds: duplicates.rowIds,
    duplicateGroupCount: duplicates.groupCount,
    canGenerate: enabledRows.length > 0 && missingDatasetFields.length === 0 && invalidCount === 0,
  }
}

export const __recipientValidationTestUtils = { normalizedValue, requiredFieldsForTemplate }
