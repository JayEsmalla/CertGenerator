import { describe, expect, it } from 'vitest'
import { fromEditorMergeText, getMergeFieldLabel, getTemplateMergeValues, resolveMergeFields, splitMergeText, toEditorMergeText } from './mergeFields'
import type { CertificateTemplate } from '../types/certificate'

describe('merge field helpers', () => {
  it('round-trips friendly editor tokens without exposing template syntax', () => {
    const stored = 'Presented to {{name}} by {{organization}}'
    const editor = toEditorMergeText(stored)
    expect(editor).toBe('Presented to @Name by @Organization')
    expect(fromEditorMergeText(editor)).toBe(stored)
  })

  it('preserves unresolved fields and resolves known values', () => {
    expect(resolveMergeFields('{{name}} — {{award}}', { name: 'Alex' })).toBe('Alex — {{award}}')
    expect(resolveMergeFields('{{name}} — {{award}}', { name: 'Alex' }, false)).toBe('Alex — ')
  })

  it('returns presentation labels for unresolved parts', () => {
    const parts = splitMergeText('For {{name}}', undefined)
    expect(parts.at(-1)).toMatchObject({ type: 'field', value: 'Recipient name', resolved: false })
    expect(getMergeFieldLabel('custom_field')).toBe('Custom Field')
  })

  it('uses finished sample data in gallery previews and placeholders in editable previews', () => {
    const template: CertificateTemplate = {
      id: 'sample-preview',
      name: 'Sample Preview',
      category: 'Academic',
      description: '',
      width: 1123,
      height: 794,
      orientation: 'landscape',
      background: '#ffffff',
      accent: '#7c6cff',
      elements: [],
      defaults: {},
      sampleData: { name: 'Alexandra Santos', organization: 'Riverdale Academy' },
      placeholderData: { name: 'RECIPIENT NAME', organization: 'YOUR ORGANIZATION NAME' },
    }

    expect(getTemplateMergeValues(template, undefined, true)).toMatchObject({ name: 'Alexandra Santos', organization: 'Riverdale Academy' })
    expect(getTemplateMergeValues(template, undefined, false)).toMatchObject({ name: 'RECIPIENT NAME', organization: 'YOUR ORGANIZATION NAME' })
  })
})
