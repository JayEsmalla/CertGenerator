export type CertificateOrientation = 'landscape' | 'portrait'
export type CertificateCategory = 'Academic' | 'Corporate' | 'Modern' | 'Community' | 'Elegant' | 'Event' | 'Institutional' | 'Healthcare' | 'Training' | 'Award'
export type TextAlign = 'left' | 'center' | 'right'
export type CertificateQuickFieldGroup = 'organization' | 'certificate' | 'signatories'
export type CertificateQuickFieldKind = 'text' | 'textarea' | 'date'
export type CertificateQuickFieldSource = 'merge' | 'element'

export type CertificateQuickField = {
  key: string
  label: string
  group: CertificateQuickFieldGroup
  kind?: CertificateQuickFieldKind
  source?: CertificateQuickFieldSource
  elementId?: string
  placeholder?: string
  helper?: string
  required?: boolean
}

export type CertificateImageSlot = {
  key: string
  label: string
  group: CertificateQuickFieldGroup
  elementId: string
  helper?: string
  required?: boolean
}

export type CertificatePalette = {
  primary: string
  secondary: string
  accent: string
  background: string
}

export type CertificateElementBase = {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  opacity?: number
  locked?: boolean
}

export type CertificateTextElement = CertificateElementBase & {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fontWeight?: number
  fontStyle?: 'normal' | 'italic'
  color: string
  textAlign: TextAlign
  letterSpacing?: number
  lineHeight?: number
  uppercase?: boolean
  autoFit?: boolean
  minFontSize?: number
}

export type CertificateShapeElement = CertificateElementBase & {
  type: 'shape'
  fill: string
  stroke?: string
  strokeWidth?: number
  borderRadius?: number
}

export type CertificateLineElement = CertificateElementBase & {
  type: 'line'
  color: string
  thickness: number
}

export type CertificateImageElement = CertificateElementBase & {
  type: 'image'
  src?: string
  objectFit: 'contain' | 'cover' | 'fill'
  borderRadius?: number
  slotKey?: string
  placeholderLabel?: string
}

export type CertificateElement = CertificateTextElement | CertificateShapeElement | CertificateLineElement | CertificateImageElement

export type CertificateTemplate = {
  id: string
  name: string
  category: CertificateCategory
  description: string
  width: number
  height: number
  orientation: CertificateOrientation
  background: string
  accent: string
  elements: CertificateElement[]
  purpose?: string
  style?: string
  tags?: string[]
  palette?: CertificatePalette
  defaults?: Record<string, string>
  sampleData?: Record<string, string>
  placeholderData?: Record<string, string>
  quickFields?: CertificateQuickField[]
  imageSlots?: CertificateImageSlot[]
}
