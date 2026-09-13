import { useRef } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { CertificateElement, CertificateTemplate } from '../types/certificate'

type ElementPatch = Partial<Pick<CertificateElement, 'x' | 'y' | 'width' | 'height'>>

type DragState = {
  mode: 'move' | 'resize'
  element: CertificateElement
  startClientX: number
  startClientY: number
}

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

type CertificatePreviewProps = {
  template: CertificateTemplate
  compact?: boolean
  className?: string
  interactive?: boolean
  selectedElementId?: string | null
  onSelectElement?: (id: string | null) => void
  onTransformElement?: (id: string, patch: ElementPatch) => void
}

export default function CertificatePreview({
  template,
  compact = false,
  className = '',
  interactive = false,
  selectedElementId,
  onSelectElement,
  onTransformElement,
}: CertificatePreviewProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const startDrag = (
    mode: DragState['mode'],
    element: CertificateElement,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (!interactive) return
    event.stopPropagation()
    onSelectElement?.(element.id)
    if (element.locked || !onTransformElement) return

    dragRef.current = {
      mode,
      element: { ...element },
      startClientX: event.clientX,
      startClientY: event.clientY,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const continueDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const canvas = canvasRef.current
    if (!drag || !canvas || !onTransformElement) return

    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const dx = ((event.clientX - drag.startClientX) / rect.width) * template.width
    const dy = ((event.clientY - drag.startClientY) / rect.height) * template.height

    if (drag.mode === 'move') {
      onTransformElement(drag.element.id, {
        x: Math.round(clamp(drag.element.x + dx, 0, template.width - drag.element.width)),
        y: Math.round(clamp(drag.element.y + dy, 0, template.height - drag.element.height)),
      })
      return
    }

    onTransformElement(drag.element.id, {
      width: Math.round(clamp(drag.element.width + dx, 20, template.width - drag.element.x)),
      height: Math.round(clamp(drag.element.height + dy, 12, template.height - drag.element.y)),
    })
  }

  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // Pointer capture may already be released by the browser.
      }
    }
    dragRef.current = null
  }

  return (
    <div
      ref={canvasRef}
      className={`template-canvas ${compact ? 'compact' : ''} ${interactive ? 'interactive' : ''} ${className}`.trim()}
      style={{
        background: template.background,
        aspectRatio: `${template.width} / ${template.height}`,
        containerType: 'inline-size',
      }}
      aria-label={`${template.name} certificate preview`}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onSelectElement?.(null)
      }}
      onPointerMove={continueDrag}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
    >
      {template.elements.map((element) => {
        const selected = selectedElementId === element.id
        const elementStyle = baseStyle(element, template)
        const fontSize = element.type === 'text' ? `${(element.fontSize / template.width) * 100}cqw` : undefined

        return (
          <div
            key={element.id}
            className={`canvas-element ${selected ? 'selected' : ''} ${element.locked ? 'locked' : ''}`.trim()}
            style={elementStyle}
            data-element-id={element.id}
            onPointerDown={(event) => startDrag('move', element, event)}
          >
            {element.type === 'shape' && (
              <div
                className="shape-render"
                style={{
                  background: element.fill,
                  border: element.stroke ? `${element.strokeWidth ?? 1}px solid ${element.stroke}` : undefined,
                  borderRadius: element.borderRadius,
                }}
              />
            )}

            {element.type === 'line' && (
              <div
                className="line-render"
                style={{ background: element.color, height: element.thickness }}
              />
            )}

            {element.type === 'text' && (
              <div
                className="text-render"
                style={{
                  color: element.color,
                  fontFamily: element.fontFamily,
                  fontSize,
                  fontWeight: element.fontWeight,
                  fontStyle: element.fontStyle,
                  letterSpacing: element.letterSpacing,
                  lineHeight: element.lineHeight,
                  textAlign: element.textAlign,
                  textTransform: element.uppercase ? 'uppercase' : undefined,
                }}
              >
                {element.text}
              </div>
            )}

            {interactive && selected && !element.locked && (
              <div
                className="resize-handle"
                role="button"
                aria-label={`Resize ${element.name}`}
                tabIndex={0}
                onPointerDown={(event) => startDrag('resize', element, event)}
              />
            )}
            {interactive && selected && element.locked && <span className="locked-chip">Locked</span>}
          </div>
        )
      })}
    </div>
  )
}
