import { describe, expect, it } from 'vitest'
import { analyzeRecipientIntegrity } from './recipientValidation'
import type { CertificateTemplate } from '../types/certificate'
import type { RecipientDataset } from '../types/recipients'

const template: CertificateTemplate = {
  id: 'integrity', name: 'Integrity', category: 'Academic', description: '',
  width: 1200, height: 850, orientation: 'landscape', background: '#fff', accent: '#000',
  elements: [
    { id: 'name', name: 'Name', type: 'text', text: '{{name}}', x: 0, y: 0, width: 100, height: 20, fontFamily: 'Arial', fontSize: 20, color: '#000', textAlign: 'left' },
    { id: 'award', name: 'Award', type: 'text', text: '{{award}}', x: 0, y: 30, width: 100, height: 20, fontFamily: 'Arial', fontSize: 20, color: '#000', textAlign: 'left' },
  ],
}

function dataset(rows: RecipientDataset['rows']): RecipientDataset {
  return { fields: ['name', 'award'], rows }
}

describe('recipient integrity', () => {
  it('blocks enabled rows with missing required merge values', () => {
    const report = analyzeRecipientIntegrity(template, dataset([
      { id: '1', enabled: true, values: { name: 'Ada', award: '' } },
      { id: '2', enabled: false, values: { name: '', award: '' } },
    ]))
    expect(report.canGenerate).toBe(false)
    expect(report.invalidCount).toBe(1)
    expect(report.invalidRowIds.has('1')).toBe(true)
    expect(report.invalidRowIds.has('2')).toBe(false)
  })

  it('uses template defaults to satisfy shared merge fields', () => {
    const report = analyzeRecipientIntegrity({ ...template, defaults: { award: 'Excellence' } }, dataset([
      { id: '1', enabled: true, values: { name: 'Ada', award: '' } },
    ]))
    expect(report.canGenerate).toBe(true)
    expect(report.requiredFields).toEqual(['name'])
  })

  it('warns about duplicate names without blocking a complete batch', () => {
    const report = analyzeRecipientIntegrity(template, dataset([
      { id: '1', enabled: true, values: { name: 'Ada Lovelace', award: 'A' } },
      { id: '2', enabled: true, values: { name: '  ADA   LOVELACE ', award: 'B' } },
    ]))
    expect(report.canGenerate).toBe(true)
    expect(report.duplicateGroupCount).toBe(1)
    expect(report.duplicateRowIds.size).toBe(2)
  })
})
