import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { clearProject, loadProject, saveProject, __storageTestUtils } from './projectStorage'
import type { CertificateTemplate } from '../types/certificate'
import type { RecipientDataset } from '../types/recipients'

const template: CertificateTemplate = {
  id: 'test-template',
  name: 'Test Template',
  category: 'Academic',
  description: 'Test',
  width: 1200,
  height: 850,
  orientation: 'landscape',
  background: '#ffffff',
  accent: '#000000',
  elements: [],
}

const recipients: RecipientDataset = {
  fields: ['name'],
  rows: [{ id: 'row-1', enabled: true, values: { name: 'Ada Lovelace' } }],
}

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('certstudio')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Database deletion was blocked.'))
  })
}

beforeEach(async () => {
  await clearProject().catch(() => undefined)
  await deleteDatabase()
})

describe('project storage', () => {
  it('persists and restores a versioned project', async () => {
    await saveProject({ activeStep: 'recipients', template, recipients })
    const restored = await loadProject()

    expect(restored).not.toBeNull()
    expect(restored?.version).toBe(2)
    expect(restored?.revision).toBe(1)
    expect(restored?.activeStep).toBe('recipients')
    expect(restored?.recipients.rows[0].values.name).toBe('Ada Lovelace')
  })

  it('increments revisions on subsequent durable saves', async () => {
    await saveProject({ activeStep: 'editor', template, recipients })
    await saveProject({ activeStep: 'generate', template, recipients })
    expect((await loadProject())?.revision).toBe(2)
  })

  it('rejects malformed persisted payloads during validation', () => {
    expect(__storageTestUtils.normalizeProject({ version: 2 })).toBeNull()
    expect(__storageTestUtils.isRecipientDataset({ fields: ['name'], rows: [{ id: 'bad' }] })).toBe(false)
  })
})
