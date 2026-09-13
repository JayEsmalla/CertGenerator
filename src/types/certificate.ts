export type CertificateOrientation = 'landscape' | 'portrait'
export type CertificateCategory = 'Academic' | 'Corporate' | 'Modern' | 'Community' | 'Elegant' | 'Event'
export type TextAlign = 'left' | 'center' | 'right'

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

export type CertificateElement = CertificateTextElement | CertificateShapeElement | CertificateLineElement

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
}
