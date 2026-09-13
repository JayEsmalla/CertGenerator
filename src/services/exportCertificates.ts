import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'
import type { CertificateTemplate } from '../types/certificate'
import type { RecipientRow } from '../types/recipients'

type ExportTarget = {
  row: RecipientRow
  element: HTMLElement
  index: number
}

type ProgressCallback = (completed: number, total: number, label: string) => void

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
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

async function waitForAssets(element: HTMLElement) {
  if (document.fonts?.ready) await document.fonts.ready

  const images = [...element.querySelectorAll('img')]
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve()
    return new Promise<void>((resolve) => {
      image.addEventListener('load', () => resolve(), { once: true })
      image.addEventListener('error', () => resolve(), { once: true })
    })
  }))
}

async function captureCertificate(element: HTMLElement) {
  await waitForAssets(element)
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: null,
    useCORS: true,
    logging: false,
    imageTimeout: 15000,
  })
  return canvas.toDataURL('image/jpeg', 0.96)
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

function addImageToCurrentPage(pdf: jsPDF, imageData: string, template: CertificateTemplate) {
  pdf.addImage(imageData, 'JPEG', 0, 0, template.width, template.height, undefined, 'FAST')
}

export async function exportSinglePdf(
  template: CertificateTemplate,
  target: ExportTarget,
  onProgress?: ProgressCallback,
) {
  onProgress?.(0, 1, `Rendering ${recipientLabel(target.row, target.index)}`)
  const image = await captureCertificate(target.element)
  const pdf = createPdf(template)
  addImageToCurrentPage(pdf, image, template)
  downloadBlob(pdf.output('blob'), `${recipientLabel(target.row, target.index)}.pdf`)
  onProgress?.(1, 1, 'PDF ready')
}

export async function exportCombinedPdf(
  template: CertificateTemplate,
  targets: ExportTarget[],
  onProgress?: ProgressCallback,
) {
  if (!targets.length) throw new Error('There are no enabled recipients to export.')

  const pdf = createPdf(template)
  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index]
    onProgress?.(index, targets.length, `Rendering ${recipientLabel(target.row, target.index)}`)
    const image = await captureCertificate(target.element)
    if (index > 0) pdf.addPage([template.width, template.height], pdfOrientation(template))
    addImageToCurrentPage(pdf, image, template)
  }

  downloadBlob(pdf.output('blob'), `${sanitizeFilename(template.name)}-certificates.pdf`)
  onProgress?.(targets.length, targets.length, 'Combined PDF ready')
}

export async function exportIndividualZip(
  template: CertificateTemplate,
  targets: ExportTarget[],
  onProgress?: ProgressCallback,
) {
  if (!targets.length) throw new Error('There are no enabled recipients to export.')

  const zip = new JSZip()
  const folder = zip.folder('certificates') ?? zip

  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index]
    const label = recipientLabel(target.row, target.index)
    onProgress?.(index, targets.length, `Creating PDF for ${label}`)
    const image = await captureCertificate(target.element)
    const pdf = createPdf(template)
    addImageToCurrentPage(pdf, image, template)
    const sequence = String(index + 1).padStart(3, '0')
    folder.file(`${sequence}-${label}.pdf`, pdf.output('blob'))
  }

  onProgress?.(targets.length, targets.length, 'Packaging ZIP archive')
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  downloadBlob(blob, `${sanitizeFilename(template.name)}-individual-certificates.zip`)
  onProgress?.(targets.length, targets.length, 'ZIP ready')
}

export type { ExportTarget, ProgressCallback }
