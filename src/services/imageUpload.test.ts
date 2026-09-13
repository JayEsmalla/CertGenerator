import { describe, expect, it } from 'vitest'
import { IMAGE_LIMITS } from '../config/limits'
import { __imageUploadTestUtils } from './imageUpload'

describe('image upload validation', () => {
  it('detects supported file signatures instead of trusting extensions', () => {
    expect(__imageUploadTestUtils.detectImageMime(new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))).toBe('image/png')
    expect(__imageUploadTestUtils.detectImageMime(new Uint8Array([0xff,0xd8,0xff,0xdb]))).toBe('image/jpeg')
    expect(__imageUploadTestUtils.detectImageMime(new Uint8Array([82,73,70,70,0,0,0,0,87,69,66,80]))).toBe('image/webp')
    expect(__imageUploadTestUtils.detectImageMime(new TextEncoder().encode('<svg></svg>'))).toBeNull()
  })

  it('keeps ordinary images unchanged and scales oversized working images', () => {
    expect(__imageUploadTestUtils.targetDimensions(1200, 800)).toEqual({ width: 1200, height: 800, changed: false })
    const large = __imageUploadTestUtils.targetDimensions(IMAGE_LIMITS.targetDimension * 2, IMAGE_LIMITS.targetDimension)
    expect(large.changed).toBe(true)
    expect(Math.max(large.width, large.height)).toBeLessThanOrEqual(IMAGE_LIMITS.targetDimension)
    expect(large.width * large.height).toBeLessThanOrEqual(IMAGE_LIMITS.targetPixels)
  })
})
