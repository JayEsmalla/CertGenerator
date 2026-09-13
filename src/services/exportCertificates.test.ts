import { describe, expect, it } from 'vitest'
import { __exportTestUtils } from './exportCertificates'
import type { RecipientRow } from '../types/recipients'

function row(name: string): RecipientRow {
  return { id: name, enabled: true, values: { name } }
}

describe('export planning helpers', () => {
  it('sanitizes filenames for cross-platform downloads', () => {
    expect(__exportTestUtils.sanitizeFilename('  A/B:C*?  ')).toBe('A-B-C-')
  })

  it('chunks large recipient batches deterministically', () => {
    const rows = Array.from({ length: 251 }, (_, index) => row(`Recipient ${index + 1}`))
    const chunks = __exportTestUtils.chunk(rows, 250)
    expect(chunks.map((part) => part.length)).toEqual([250, 1])
  })

  it('plans the 5,000-recipient ceiling into bounded export parts', () => {
    const rows = Array.from({ length: 5_000 }, (_, index) => row(`Recipient ${index + 1}`))
    const chunks = __exportTestUtils.chunk(rows, 250)
    expect(chunks).toHaveLength(20)
    expect(chunks.every((part) => part.length === 250)).toBe(true)
    expect(__exportTestUtils.partSuffix(19, chunks.length)).toBe('-part-20-of-20')
  })

  it('adds stable multi-part suffixes only when needed', () => {
    expect(__exportTestUtils.partSuffix(0, 1)).toBe('')
    expect(__exportTestUtils.partSuffix(0, 3)).toBe('-part-01-of-03')
    expect(__exportTestUtils.partSuffix(2, 3)).toBe('-part-03-of-03')
  })
})
