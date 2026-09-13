export const IMPORT_LIMITS = {
  maxFileBytes: 10 * 1024 * 1024,
  maxRows: 5_000,
  maxColumns: 50,
  maxCellChars: 2_000,
  maxExtractedChars: 20_000_000,
} as const

export const IMAGE_LIMITS = {
  maxFileBytes: 8 * 1024 * 1024,
  maxPixels: 20_000_000,
  maxDimension: 8_192,
  targetPixels: 12_000_000,
  targetDimension: 4_096,
} as const

export const SUPPORTED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const IMAGE_ACCEPT = SUPPORTED_IMAGE_MIME_TYPES.join(',')
