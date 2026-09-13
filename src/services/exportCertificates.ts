import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'
import { EXPORT_LIMITS } from '../config/limits'
import type { CertificateTemplate } from '../types/certificate'
import type { RecipientRow } from '../types/recipients'

type ProgressCallback = (completed: number, total: number, label: string) => void
type RenderRecipient = (row: RecipientRow, index: number) => Promise<HTMLElement>

function abortError() {
  return new DOMException('Export cancelled.', 'AbortError')
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError()
}

function sanitizeFilename(value: string) {
  const cleaned = value
    .normalize('NFKD')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')
  return cleaned || 'certificate'
}

function recipientLabel(row: RecipientRow, index: number) {
  const preferred = row.values.name || row.values.full_name || row.values.recipient || row.values.participant
  return sanitizeFilename(preferred || `recipient-${index + 1}`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000)
}

function nextTask() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 0))
}

async function waitForAssets(element: HTMLElement, signal?: AbortSignal) {
  throwIfAborted(signal)
  if (document.fonts?.ready) await document.fonts.ready
  throwIfAborted(signal)

  const images = [...element.querySelectorAll('img')]
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve()
    return new Promise<void>((resolve) => {
      const done = () => resolve()
      image.addEventListener('load', done, { once: true })
      image.addEventListener('error', done, { once: true })
      signal?.addEventListener('abort', done, { once: true })
    })
  }))
  throwIfAborted(signal)
}

async function captureCertificate(element: HTMLElement, signal?: AbortSignal) {
  await waitForAssets(element, signal)
  throwIfAborted(signal)
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: null,
    useCORS: true,
    logging: false,
    imageTimeout: 15_000,
  })
  throwIfAborted(signal)
  return canvas
}

function pdfOrientation(template: CertificateTemplate) {
  return template.width >= template.height ? 'landscape' as const : 'portrait' as const
}

function createPdf(template: CertificateTemplate) {
  return new jsPDF({
    orientation: pdfOrientation(template),
    unit: 'px',
    format: [template.width, template.height],
    hotfixes: ['px_scaling'],
    compress: true,
  })
}

function addCanvasToCurrentPage(pdf: jsPDF, canvas: HTMLCanvasElement, template: CertificateTemplate) {
  const imageData = canvas.toDataURL('image/jpeg', 0.94)
  pdf.addImage(imageData, 'JPEG', 0, 0, template.width, template.height, undefined, 'FAST')
  canvas.width = 1
  canvas.height = 1
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size))
  return chunks
}

function partSuffix(partIndex: number, partCount: number) {
  return partCount > 1 ? `-part-${String(partIndex + 1).padStart(2, '0')}-of-${String(partCount).padStart(2, '0')}` : ''
}

export async function exportSinglePdf(
  template: CertificateTemplate,
  row: RecipientRow,
  index: number,
  renderRecipient: RenderRecipient,
  onProgress?: ProgressCallback,
  signal?: AbortSignal,
) {
  throwIfAborted(signal)
  const label = recipientLabel(row, index)
  onProgress?.(0, 1, `Rendering ${label}`)
  const element = await renderRecipient(row, index)
  const canvas = await captureCertificate(element, signal)
  const pdf = createPdf(template)
  addCanvasToCurrentPage(pdf, canvas, template)
  throwIfAborted(signal)
  downloadBlob(pdf.output('blob'), `${label}.pdf`)
  onProgress?.(1, 1, 'PDF ready')
}

export async function exportCombinedPdf(
  template: CertificateTemplate,
  rows: RecipientRow[],
  renderRecipient: RenderRecipient,
  onProgress?: ProgressCallback,
  signal?: AbortSignal,
) {
  if (!rows.length) throw new Error('There are no enabled recipients to export.')
  const parts = chunk(rows, EXPORT_LIMITS.combinedPdfPartSize)
  let completed = 0

  for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
    throwIfAborted(signal)
    const pdf = createPdf(template)
    const part = parts[partIndex]
    const globalOffset = partIndex * EXPORT_LIMITS.combinedPdfPartSize

    for (let localIndex = 0; localIndex < part.length; localIndex += 1) {
      const row = part[localIndex]
      const globalIndex = globalOffset + localIndex
      const label = recipientLabel(row, globalIndex)
      onProgress?.(completed, rows.length, `Rendering ${label}`)
      const element = await renderRecipient(row, globalIndex)
      const canvas = await captureCertificate(element, signal)
      if (localIndex > 0) pdf.addPage([template.width, template.height], pdfOrientation(template))
      addCanvasToCurrentPage(pdf, canvas, template)
      completed += 1
      await nextTask()
    }

    throwIfAborted(signal)
    const suffix = partSuffix(partIndex, parts.length)
    downloadBlob(pdf.output('blob'), `${sanitizeFilename(template.name)}-certificates${suffix}.pdf`)
    await nextTask()
  }

  onProgress?.(rows.length, rows.length, parts.length > 1 ? `${parts.length} PDF parts ready` : 'Combined PDF ready')
}

export async function exportIndividualZip(
  template: CertificateTemplate,
  rows: RecipientRow[],
  renderRecipient: RenderRecipient,
  onProgress?: ProgressCallback,
  signal?: AbortSignal,
) {
  if (!rows.length) throw new Error('There are no enabled recipients to export.')
  const parts = chunk(rows, EXPORT_LIMITS.zipPartSize)
  let completed = 0

  for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
    throwIfAborted(signal)
    const zip = new JSZip()
    const folder = zip.folder('certificates') ?? zip
    const part = parts[partIndex]
    const globalOffset = partIndex * EXPORT_LIMITS.zipPartSize

    for (let localIndex = 0; localIndex < part.length; localIndex += 1) {
      const row = part[localIndex]
      const globalIndex = globalOffset + localIndex
      const label = recipientLabel(row, globalIndex)
      onProgress?.(completed, rows.length, `Creating PDF for ${label}`)
      const element = await renderRecipient(row, globalIndex)
      const canvas = await captureCertificate(element, signal)
      const pdf = createPdf(template)
      addCanvasToCurrentPage(pdf, canvas, template)
      const sequence = String(globalIndex + 1).padStart(Math.max(3, String(rows.length).length), '0')
      folder.file(`${sequence}-${label}.pdf`, pdf.output('arraybuffer'))
      completed += 1
      await nextTask()
    }

    throwIfAborted(signal)
    onProgress?.(completed, rows.length, `Packaging archive ${partIndex + 1} of ${parts.length}`)
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
    throwIfAborted(signal)
    const suffix = partSuffix(partIndex, parts.length)
    downloadBlob(blob, `${sanitizeFilename(template.name)}-individual-certificates${suffix}.zip`)
    await nextTask()
  }

  onProgress?.(rows.length, rows.length, parts.length > 1 ? `${parts.length} ZIP parts ready` : 'ZIP ready')
}

export const __exportTestUtils = { sanitizeFilename, recipientLabel, chunk, partSuffix }
export type { ProgressCallback, RenderRecipient }
