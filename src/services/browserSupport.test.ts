import { describe, expect, it, vi } from 'vitest'

describe('browser support detection', () => {
  it('reports a missing IndexedDB capability', async () => {
    vi.resetModules()
    const original = globalThis.indexedDB
    Object.defineProperty(globalThis, 'indexedDB', { value: undefined, configurable: true })
    const { getUnsupportedBrowserFeatures } = await import('./browserSupport')
    expect(getUnsupportedBrowserFeatures()).toContain('IndexedDB local storage')
    Object.defineProperty(globalThis, 'indexedDB', { value: original, configurable: true })
  })
})
