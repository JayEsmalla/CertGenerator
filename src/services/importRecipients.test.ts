import { describe, expect, it } from 'vitest'
import { IMPORT_LIMITS } from '../config/limits'
import { __importTestUtils } from './importRecipients'

describe('recipient import limits', () => {
  it('parses quoted CSV cells safely', () => {
    expect(__importTestUtils.parseDelimited('Name,Event\n"Doe, Jane","Workshop, Day 1"', ','))
      .toEqual([['Name', 'Event'], ['Doe, Jane', 'Workshop, Day 1']])
  })

  it('rejects unterminated quoted cells', () => {
    expect(() => __importTestUtils.parseDelimited('Name\n"Jane', ',')).toThrow(/unterminated/i)
  })

  it('rejects cells that exceed the configured text budget', () => {
    expect(() => __importTestUtils.parseDelimited('a'.repeat(IMPORT_LIMITS.maxCellChars + 1), ','))
      .toThrow(/cell exceeds/i)
  })

  it('rejects recipient tables beyond the supported row budget', () => {
    const rows = Array.from({ length: IMPORT_LIMITS.maxRows + 2 }, () => ['Jane Doe'])
    expect(() => __importTestUtils.assertTableLimits(rows)).toThrow(/recipient rows/i)
  })

  it('imports exactly the supported 5,000-row ceiling', () => {
    const csv = ['Name', ...Array.from({ length: IMPORT_LIMITS.maxRows }, (_, index) => `Recipient ${index + 1}`)].join('\n')
    const rows = __importTestUtils.parseDelimited(csv, ',')
    const dataset = __importTestUtils.datasetFromTable(rows, 'stress.csv')
    expect(dataset.rows).toHaveLength(IMPORT_LIMITS.maxRows)
    expect(dataset.rows[0]?.values.name).toBe('Recipient 1')
    expect(dataset.rows.at(-1)?.values.name).toBe(`Recipient ${IMPORT_LIMITS.maxRows}`)
  })
})
