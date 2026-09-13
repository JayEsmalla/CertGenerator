import type { CSSProperties } from 'react'
import type { CertificateElement, CertificateTemplate } from '../types/certificate'

function baseStyle(element: CertificateElement, template: CertificateTemplate): CSSProperties {
  return {
    position: 'absolute',
    left: `${(element.x / template.width) * 100}%`,
    top: `${(element.y / template.height) * 100}%`,
    width: `${(element.width / template.width) * 100}%`,
    height: `${(element.height / template.height) * 100}%`,
    opacity: element.opacity ?? 1,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    transformOrigin: 'center',
  }
}

function ElementRenderer({ element, template }: { element: CertificateElement; template: CertificateTemplate }) {
  const shared = baseStyle(element, template)

  if (element.type === 'shape') {
    return (
      <div
        aria-hidden="true"
        style={{
          ...shared,
          background: element.fill,
          border: element.stroke ? `${element.strokeWidth ?? 1}px solid ${element.stroke}` : undefined,
          borderRadius: element.borderRadius,
        }}
      />
    )
  }

  if (element.type === 'line') {
    return (
      <div
        aria-hidden="true"
        style={{
          ...shared,
          height: element.thickness,
          background: element.color,
        }}
      />
    )
  }

  const justifyContent = element.textAlign === 'left' ? 'flex-start' : element.textAlign === 'right' ? 'flex-end' : 'center'

  return (
    <div
      data-element-id={element.id}
      style={{
        ...shared,
        display: 'flex',
        alignItems: 'center',
        justifyContent,
        color: element.color,
        fontFamily: element.fontFamily,
        fontSize: `clamp(5px, ${(element.fontSize / template.width) * 100}vw, ${element.fontSize}px)`,
        fontWeight: element.fontWeight,
        fontStyle: element.fontStyle,
        letterSpacing: element.letterSpacing,
        lineHeight: element.lineHeight,
        textAlign: element.textAlign,
        textTransform: element.uppercase ? 'uppercase' : undefined,
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
        padding: '0 0.25%',
      }}
    >
      {element.text}
    </div>
  )
}

type CertificatePreviewProps = {
  template: CertificateTemplate
  compact?: boolean
  className?: string
}

export default function CertificatePreview({ template, compact = false, className = '' }: CertificatePreviewProps) {
  return (
    <div
      className={`template-canvas ${compact ? 'compact' : ''} ${className}`.trim()}
      style={{ background: template.background, aspectRatio: `${template.width} / ${template.height}` }}
      aria-label={`${template.name} certificate preview`}
    >
      {template.elements.map((element) => (
        <ElementRenderer key={element.id} element={element} template={template} />
      ))}
    </div>
  )
}
