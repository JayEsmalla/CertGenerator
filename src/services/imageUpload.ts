import { IMAGE_LIMITS, SUPPORTED_IMAGE_MIME_TYPES } from '../config/limits'

export type PreparedImage = {
  blob: Blob
  width: number
  height: number
  mimeType: typeof SUPPORTED_IMAGE_MIME_TYPES[number]
}

function formatMegabytes(bytes: number) {
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`
}

export function detectImageMime(bytes: Uint8Array) {
  if (bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png' as const
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg' as const
  if (bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp' as const
  return null
}

async function readHeader(file: Blob) {
  return new Uint8Array(await file.slice(0, 16).arrayBuffer())
}

async function dimensionsFor(blob: Blob) {
  if (typeof createImageBitmap !== 'function') {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const image = new Image()
      image.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: image.naturalWidth, height: image.naturalHeight })
      }
      image.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('The selected image could not be decoded.'))
      }
      image.src = url
    })
  }

  const bitmap = await createImageBitmap(blob)
  const dimensions = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return dimensions
}

function targetDimensions(width: number, height: number) {
  const dimensionScale = Math.min(1, IMAGE_LIMITS.targetDimension / Math.max(width, height))
  const pixelScale = Math.min(1, Math.sqrt(IMAGE_LIMITS.targetPixels / (width * height)))
  const scale = Math.min(dimensionScale, pixelScale)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    changed: scale < 0.999,
  }
}

async function resizeImage(blob: Blob, width: number, height: number, mimeType: PreparedImage['mimeType']) {
  const bitmap = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { alpha: mimeType === 'image/png' })
    if (!context) throw new Error('This browser cannot prepare the selected image.')
    context.drawImage(bitmap, 0, 0, width, height)
    const outputType = mimeType === 'image/png' ? 'image/png' : 'image/webp'
    const resized = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('The selected image could not be resized.')), outputType, 0.92)
    })
    canvas.width = 1
    canvas.height = 1
    return resized
  } finally {
    bitmap.close()
  }
}

export async function prepareImageUpload(file: File): Promise<PreparedImage> {
  if (!file.size) throw new Error('The selected image is empty.')
  if (file.size > IMAGE_LIMITS.maxFileBytes) {
    throw new Error(`Images must be ${formatMegabytes(IMAGE_LIMITS.maxFileBytes)} or smaller.`)
  }

  const detected = detectImageMime(await readHeader(file))
  if (!detected || !SUPPORTED_IMAGE_MIME_TYPES.includes(detected)) {
    throw new Error('Use a PNG, JPEG, or WebP image. SVG and other formats are blocked for safer local rendering.')
  }
  if (file.type && file.type !== detected && !(file.type === 'image/jpg' && detected === 'image/jpeg')) {
    throw new Error('The image contents do not match its declared file type.')
  }

  let dimensions: { width: number; height: number }
  try {
    dimensions = await dimensionsFor(file)
  } catch {
    throw new Error('The selected image is damaged or cannot be decoded.')
  }

  const pixels = dimensions.width * dimensions.height
  if (!dimensions.width || !dimensions.height
    || dimensions.width > IMAGE_LIMITS.maxDimension
    || dimensions.height > IMAGE_LIMITS.maxDimension
    || pixels > IMAGE_LIMITS.maxPixels) {
    throw new Error(`Image dimensions are too large. Maximum: ${IMAGE_LIMITS.maxDimension}px per side and ${Math.round(IMAGE_LIMITS.maxPixels / 1_000_000)} megapixels.`)
  }

  const target = targetDimensions(dimensions.width, dimensions.height)
  const blob = target.changed ? await resizeImage(file, target.width, target.height, detected) : file
  return { blob, width: target.width, height: target.height, mimeType: detected }
}

export const __imageUploadTestUtils = { detectImageMime, targetDimensions }
