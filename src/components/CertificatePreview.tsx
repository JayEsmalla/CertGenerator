import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { CertificateElement, CertificateTemplate, CertificateTextElement } from '../types/certificate'
import type { RecipientValues } from '../types/recipients'
import { getTemplateMergeValues, splitMergeText } from '../utils/mergeFields'

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

function estimatedTextUnits(value: string) {
  return [...value].reduce((total, character) => {
    if (/\s/.test(character)) return total + 0.28
    if (/[MW@#%&]/.test(character)) return total + 0.82
    if (/[A-Z0-9]/.test(character)) return total + 0.62
    if (/[ilI1|.,'`]/.test(character)) return total + 0.28
    return total + 0.52
  }, 0)
}

function fittedFontSize(element: CertificateTextElement, mergeValues?: RecipientValues) {
  if (!element.autoFit) return element.fontSize

  const renderedText = splitMergeText(element.text, mergeValues).map((part) => part.value).join('')
  const longestLine = renderedText.split('\n').reduce((longest, line) => line.length > longest.length ? line : longest, '')
  const estimatedWidth = estimatedTextUnits(longestLine) * element.fontSize
  const availableWidth = element.width * 0.94
  if (!estimatedWidth || estimatedWidth <= availableWidth) return element.fontSize

  const minimum = element.minFontSize ?? Math.min(element.fontSize, Math.max(8, Math.round(element.fontSize * 0.42)))
  return Math.max(minimum, Math.floor(element.fontSize * (availableWidth / estimatedWidth)))
}

type CertificateTextRenderProps = {
  element: CertificateTextElement
  template: CertificateTemplate
  mergeValues?: RecipientValues
}

function CertificateTextRender({ element, template, mergeValues }: CertificateTextRenderProps) {
  const parts = useMemo(() => splitMergeText(element.text, mergeValues), [element.text, mergeValues])
  const renderedText = useMemo(() => parts.map((part) => part.value).join(''), [parts])
  const initialFontSize = fittedFontSize(element, mergeValues)
  const [fitScale, setFitScale] = useState(() => initialFontSize / element.fontSize)
  const contentRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    if (!element.autoFit) {
      setFitScale(1)
      return
    }

    const content = contentRef.current
    const container = content?.parentElement
    if (!content || !container) return

    const minimumFontSize = element.minFontSize ?? Math.min(element.fontSize, Math.max(8, Math.round(element.fontSize * 0.42)))
    const minimumScale = minimumFontSize / element.fontSize

    const fit = () => {
      const availableWidth = container.clientWidth * 0.94
      if (!availableWidth) return
      const currentScale = Math.max(fitScale, 0.01)
      const range = document.createRange()
      range.selectNodeContents(content)
      const renderedWidth = range.getBoundingClientRect().width
      range.detach()
      const intrinsicWidth = renderedWidth / currentScale
      if (!intrinsicWidth) return
      const nextScale = clamp(availableWidth / intrinsicWidth, minimumScale, 1)
      setFitScale((current) => Math.abs(current - nextScale) < 0.005 ? current : nextScale)
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(container)
    return () => observer.disconnect()
  }, [element.autoFit, element.fontSize, element.minFontSize, element.width, fitScale, renderedText])

  const fontSize = `${((element.fontSize * fitScale) / template.width) * 100}cqw`

  return (
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
      <span ref={contentRef} className="text-content" style={{ whiteSpace: element.autoFit ? 'nowrap' : undefined }}>
        {parts.map((part, index) => (
          part.type === 'field' && !part.resolved
            ? <span className="merge-placeholder" key={`${part.field}-${index}`}>{part.value}</span>
            : <span key={`${part.type}-${index}`}>{part.value}</span>
        ))}
      </span>
    </div>
  )
}

type CertificatePreviewProps = {
  template: CertificateTemplate
  compact?: boolean
  className?: string
  interactive?: boolean
  selectedElementId?: string | null
  onSelectElement?: (id: string | null) => void
  onTransformElement?: (id: string, patch: ElementPatch) => void
  data?: RecipientValues
}

export default function CertificatePreview({
  template,
  compact = false,
  className = '',
  interactive = false,
  selectedElementId,
  onSelectElement,
  onTransformElement,
  data,
}: CertificatePreviewProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const mergeValues = getTemplateMergeValues(template, data, compact)

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

            {element.type === 'image' && (
              element.src ? (
                <img
                  className="image-render"
                  src={element.src}
                  alt={element.name}
                  draggable={false}
                  style={{ objectFit: element.objectFit, borderRadius: element.borderRadius }}
                />
              ) : (interactive || compact) ? (
                <div className="image-slot-placeholder" style={{ borderRadius: element.borderRadius }}>
                  <span>{element.placeholderLabel ?? element.name}</span>
                </div>
              ) : null
            )}

            {element.type === 'text' && <CertificateTextRender element={element} template={template} mergeValues={mergeValues} />}

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
