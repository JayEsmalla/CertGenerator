import { describe, expect, it } from 'vitest'
import { fromEditorMergeText, getMergeFieldLabel, resolveMergeFields, splitMergeText, toEditorMergeText } from './mergeFields'

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
})
