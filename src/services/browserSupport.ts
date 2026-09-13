export function getUnsupportedBrowserFeatures() {
  const missing: string[] = []
  if (typeof indexedDB === 'undefined') missing.push('IndexedDB local storage')
  if (typeof structuredClone !== 'function') missing.push('structuredClone')
  if (!globalThis.crypto?.subtle) missing.push('Web Crypto')
  if (typeof ResizeObserver === 'undefined') missing.push('ResizeObserver')
  if (typeof Blob === 'undefined' || typeof File === 'undefined') missing.push('Blob/File APIs')
  if (typeof URL?.createObjectURL !== 'function') missing.push('Object URL downloads')
  if (typeof CSS === 'undefined' || !CSS.supports?.('container-type', 'inline-size')) missing.push('CSS container queries')
  return missing
}
