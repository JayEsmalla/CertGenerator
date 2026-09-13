import { useMemo, useRef, useState } from 'react'
import CertificatePreview from './CertificatePreview'
import { fromEditorMergeText, getMergeFieldEditorToken, getMergeFieldLabel, toEditorMergeText } from '../utils/mergeFields'
import type {
  CertificateElement,
  CertificateImageElement,
  CertificateLineElement,
  CertificateShapeElement,
  CertificateTemplate,
  CertificateTextElement,
  TextAlign,
} from '../types/certificate'

type CertificateEditorProps = {
  template: CertificateTemplate
  onChange: (template: CertificateTemplate) => void
  onQuickCustomize?: () => void
}

const fonts = [
  'Inter, sans-serif',
  'DM Serif Display, serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Arial, sans-serif',
  'Trebuchet MS, sans-serif',
]

const mergeFields = ['name', 'organization', 'event', 'award', 'role', 'date', 'signatory']

const numericValue = (value: string, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default function CertificateEditor({ template, onChange, onQuickCustomize }: CertificateEditorProps) {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const replaceImageInputRef = useRef<HTMLInputElement>(null)

  const selectedElement = useMemo(
    () => template.elements.find((element) => element.id === selectedElementId) ?? null,
    [selectedElementId, template.elements],
  )

  const patchTemplate = (patch: Partial<CertificateTemplate>) => onChange({ ...template, ...patch })

  const patchElement = (id: string, patch: Partial<CertificateElement>) => {
    onChange({
      ...template,
      elements: template.elements.map((element) => (
        element.id === id ? ({ ...element, ...patch } as CertificateElement) : element
      )),
    })
  }

  const addText = () => {
    const id = `text-${Date.now()}`
    const element: CertificateTextElement = {
      id,
      name: 'New text',
      type: 'text',
      text: 'New text',
      x: Math.round(template.width * 0.3),
      y: Math.round(template.height * 0.42),
      width: Math.round(template.width * 0.4),
      height: 58,
      fontFamily: 'Inter, sans-serif',
      fontSize: 28,
      fontWeight: 600,
      color: '#111827',
      textAlign: 'center',
      lineHeight: 1.2,
    }
    onChange({ ...template, elements: [...template.elements, element] })
    setSelectedElementId(id)
  }

  const addShape = () => {
    const id = `shape-${Date.now()}`
    const element: CertificateShapeElement = {
      id,
      name: 'New shape',
      type: 'shape',
      x: Math.round(template.width * 0.38),
      y: Math.round(template.height * 0.38),
      width: Math.round(template.width * 0.24),
      height: 90,
      fill: template.accent,
      borderRadius: 8,
      opacity: 0.18,
    }
    onChange({ ...template, elements: [...template.elements, element] })
    setSelectedElementId(id)
  }

  const addImageFromFile = (file: File, replaceId?: string) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : ''
      if (!src) return

      if (replaceId) {
        patchElement(replaceId, { src } as Partial<CertificateImageElement>)
        return
      }

      const id = `image-${Date.now()}`
      const element: CertificateImageElement = {
        id,
        name: file.name.replace(/\.[^.]+$/, '') || 'Uploaded image',
        type: 'image',
        src,
        x: Math.round(template.width * 0.4),
        y: Math.round(template.height * 0.34),
        width: Math.round(template.width * 0.2),
        height: Math.round(template.height * 0.2),
        objectFit: 'contain',
        opacity: 1,
      }
      onChange({ ...template, elements: [...template.elements, element] })
      setSelectedElementId(id)
    }
    reader.readAsDataURL(file)
  }

  const addLine = () => {
    const id = `line-${Date.now()}`
    const element: CertificateLineElement = {
      id,
      name: 'New line',
      type: 'line',
      x: Math.round(template.width * 0.32),
      y: Math.round(template.height * 0.5),
      width: Math.round(template.width * 0.36),
      height: 8,
      color: template.accent,
      thickness: 2,
    }
    onChange({ ...template, elements: [...template.elements, element] })
    setSelectedElementId(id)
  }

  const duplicateSelected = () => {
    if (!selectedElement) return
    const id = `${selectedElement.type}-${Date.now()}`
    const duplicate = {
      ...selectedElement,
      id,
      name: `${selectedElement.name} copy`,
      x: Math.min(selectedElement.x + 18, template.width - selectedElement.width),
      y: Math.min(selectedElement.y + 18, template.height - selectedElement.height),
      locked: false,
    } as CertificateElement
    onChange({ ...template, elements: [...template.elements, duplicate] })
    setSelectedElementId(id)
  }

  const deleteSelected = () => {
    if (!selectedElement) return
    onChange({ ...template, elements: template.elements.filter((element) => element.id !== selectedElement.id) })
    setSelectedElementId(null)
  }

  const moveLayer = (direction: 'up' | 'down') => {
    if (!selectedElement) return
    const currentIndex = template.elements.findIndex((element) => element.id === selectedElement.id)
    const nextIndex = direction === 'up'
      ? Math.min(template.elements.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1)
    if (currentIndex === nextIndex) return

    const elements = [...template.elements]
    const [moved] = elements.splice(currentIndex, 1)
    elements.splice(nextIndex, 0, moved)
    onChange({ ...template, elements })
  }

  const insertMergeField = (field: string) => {
    if (!selectedElement || selectedElement.type !== 'text') return
    const separator = selectedElement.text && !selectedElement.text.endsWith(' ') ? ' ' : ''
    patchElement(selectedElement.id, { text: `${selectedElement.text}${separator}{{${field}}}` } as Partial<CertificateTextElement>)
  }

  return (
    <section className="editor-shell" aria-label="Certificate editor workspace">
      <aside className="tool-rail">
        <div className="tool-rail-heading">Add</div>
        <button className="tool-button" type="button" onClick={addText}><span className="tool-icon">T</span><strong>Text</strong></button>
        <button className="tool-button" type="button" onClick={addShape}><span className="tool-icon">□</span><strong>Shape</strong></button>
        <button className="tool-button" type="button" onClick={addLine}><span className="tool-icon">—</span><strong>Line</strong></button>
        <button className="tool-button" type="button" onClick={() => imageInputRef.current?.click()}><span className="tool-icon">▧</span><strong>Image</strong></button>
        <input ref={imageInputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => { const file = event.target.files?.[0]; if (file) addImageFromFile(file); event.currentTarget.value = '' }} />
      </aside>

      <div className="canvas-workspace">
        <div className="canvas-toolbar">
          <div className="canvas-title-block">
            <span className="workspace-kicker">Certificate editor</span>
            <strong>{template.name}</strong>
            {selectedElement && <span className="selection-summary">Editing · {selectedElement.name}</span>}
          </div>
          <div className="toolbar-actions editor-toolbar-actions">
            {onQuickCustomize && <button className="toolbar-text-action" type="button" onClick={onQuickCustomize}>Quick setup</button>}
            <div className="toolbar-group" aria-label="Layer controls">
              <button type="button" onClick={() => moveLayer('down')} disabled={!selectedElement} title="Send backward" aria-label="Send backward">↓</button>
              <button type="button" onClick={() => moveLayer('up')} disabled={!selectedElement} title="Bring forward" aria-label="Bring forward">↑</button>
            </div>
            <div className="toolbar-group" aria-label="Element controls">
              <button type="button" onClick={duplicateSelected} disabled={!selectedElement} title="Duplicate" aria-label="Duplicate selected element">⧉</button>
              <button className="danger-tool" type="button" onClick={deleteSelected} disabled={!selectedElement || selectedElement.locked} title="Delete" aria-label="Delete selected element">×</button>
            </div>
          </div>
        </div>

        <div className="canvas-stage">
          <div className="canvas-hint"><span>✦</span>{selectedElement ? 'Drag to reposition · use the corner handle to resize' : 'Select any text, shape, line, or image to customize it'}</div>
          <CertificatePreview
            template={template}
            className="editor-certificate"
            interactive
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onTransformElement={patchElement}
          />
        </div>
      </div>

      <aside className="properties-panel editor-properties-panel">
        <div className="panel-heading">
          <div className="panel-heading-icon">{selectedElement?.type === 'text' ? 'T' : selectedElement?.type === 'image' ? '▧' : selectedElement?.type === 'shape' ? '□' : selectedElement?.type === 'line' ? '—' : '✦'}</div>
          <div><span>{selectedElement ? selectedElement.name : 'Design settings'}</span><small>{selectedElement ? `${selectedElement.type} element` : `${template.category} certificate`}</small></div>
        </div>

        {!selectedElement ? (
          <div className="property-form">
            <label>
              Template name
              <input value={template.name} onChange={(event) => patchTemplate({ name: event.target.value })} />
            </label>
            <label>
              Background
              <div className="color-control"><input type="color" value={template.background} onChange={(event) => patchTemplate({ background: event.target.value })} /><input value={template.background} onChange={(event) => patchTemplate({ background: event.target.value })} /></div>
            </label>
            <label>
              Accent
              <div className="color-control"><input type="color" value={template.accent} onChange={(event) => patchTemplate({ accent: event.target.value })} /><input value={template.accent} onChange={(event) => patchTemplate({ accent: event.target.value })} /></div>
            </label>
            <div className="empty-properties compact-empty">
              <div>◇</div>
              <strong>Select any certificate element</strong>
              <p>Text, shapes, lines, locked frames, and their layout can now be customized.</p>
            </div>
          </div>
        ) : (
          <div className="property-form">
            <div className="property-section-heading"><span>Layer</span><small>Organize this element</small></div>
            <label>
              Layer name
              <input value={selectedElement.name} onChange={(event) => patchElement(selectedElement.id, { name: event.target.value })} />
            </label>

            {selectedElement.type === 'text' && (
              <>
                <div className="property-section-heading"><span>Content</span><small>Use @ fields for personalized data</small></div>
                <label>
                  Text content
                  <textarea rows={5} value={toEditorMergeText(selectedElement.text)} onChange={(event) => patchElement(selectedElement.id, { text: fromEditorMergeText(event.target.value) } as Partial<CertificateTextElement>)} />
                </label>
                <div className="merge-field-helper"><strong>Insert personalized data</strong><span>These values are replaced for each recipient.</span></div>
                <div className="merge-field-row" aria-label="Insert personalized data">
                  {mergeFields.map((field) => <button key={field} type="button" onClick={() => insertMergeField(field)}><span>+</span>{getMergeFieldLabel(field)}<small>@{getMergeFieldEditorToken(field)}</small></button>)}
                </div>
                <div className="property-section-heading"><span>Typography</span><small>Style the selected text</small></div>
                <label>
                  Font
                  <select value={selectedElement.fontFamily} onChange={(event) => patchElement(selectedElement.id, { fontFamily: event.target.value } as Partial<CertificateTextElement>)}>
                    {fonts.map((font) => <option key={font} value={font}>{font.split(',')[0]}</option>)}
                  </select>
                </label>
                <div className="property-grid two">
                  <label>Size<input type="number" min="6" max="180" value={selectedElement.fontSize} onChange={(event) => patchElement(selectedElement.id, { fontSize: numericValue(event.target.value, 12) } as Partial<CertificateTextElement>)} /></label>
                  <label>Weight<select value={selectedElement.fontWeight ?? 400} onChange={(event) => patchElement(selectedElement.id, { fontWeight: numericValue(event.target.value, 400) } as Partial<CertificateTextElement>)}><option value="300">Light</option><option value="400">Regular</option><option value="600">Semibold</option><option value="700">Bold</option><option value="800">Heavy</option></select></label>
                </div>
                <label>
                  Text color
                  <div className="color-control"><input type="color" value={selectedElement.color} onChange={(event) => patchElement(selectedElement.id, { color: event.target.value } as Partial<CertificateTextElement>)} /><input value={selectedElement.color} onChange={(event) => patchElement(selectedElement.id, { color: event.target.value } as Partial<CertificateTextElement>)} /></div>
                </label>
                <div className="property-grid two">
                  <label>Alignment<select value={selectedElement.textAlign} onChange={(event) => patchElement(selectedElement.id, { textAlign: event.target.value as TextAlign } as Partial<CertificateTextElement>)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
                  <label>Style<select value={selectedElement.fontStyle ?? 'normal'} onChange={(event) => patchElement(selectedElement.id, { fontStyle: event.target.value as 'normal' | 'italic' } as Partial<CertificateTextElement>)}><option value="normal">Normal</option><option value="italic">Italic</option></select></label>
                </div>
                <div className="property-grid two">
                  <label>Letter spacing<input type="number" step="0.5" value={selectedElement.letterSpacing ?? 0} onChange={(event) => patchElement(selectedElement.id, { letterSpacing: numericValue(event.target.value) } as Partial<CertificateTextElement>)} /></label>
                  <label>Line height<input type="number" min="0.8" max="3" step="0.05" value={selectedElement.lineHeight ?? 1.2} onChange={(event) => patchElement(selectedElement.id, { lineHeight: numericValue(event.target.value, 1.2) } as Partial<CertificateTextElement>)} /></label>
                </div>
                <label className="toggle-row"><input type="checkbox" checked={selectedElement.autoFit ?? false} onChange={(event) => patchElement(selectedElement.id, { autoFit: event.target.checked } as Partial<CertificateTextElement>)} /> Fit long text automatically</label>
                {selectedElement.autoFit && <label>Minimum font size<input type="number" min="8" max={selectedElement.fontSize} value={selectedElement.minFontSize ?? Math.min(selectedElement.fontSize, Math.max(8, Math.round(selectedElement.fontSize * 0.42)))} onChange={(event) => patchElement(selectedElement.id, { minFontSize: numericValue(event.target.value, 8) } as Partial<CertificateTextElement>)} /></label>}
              </>
            )}

            {selectedElement.type === 'shape' && (
              <>
                <label>Fill<div className="color-control"><input type="color" value={selectedElement.fill === 'transparent' ? '#ffffff' : selectedElement.fill} onChange={(event) => patchElement(selectedElement.id, { fill: event.target.value } as Partial<CertificateShapeElement>)} /><input value={selectedElement.fill} onChange={(event) => patchElement(selectedElement.id, { fill: event.target.value } as Partial<CertificateShapeElement>)} /></div></label>
                <label>Stroke<div className="color-control"><input type="color" value={selectedElement.stroke ?? '#000000'} onChange={(event) => patchElement(selectedElement.id, { stroke: event.target.value } as Partial<CertificateShapeElement>)} /><input value={selectedElement.stroke ?? ''} placeholder="none" onChange={(event) => patchElement(selectedElement.id, { stroke: event.target.value || undefined } as Partial<CertificateShapeElement>)} /></div></label>
                <div className="property-grid two"><label>Stroke width<input type="number" min="0" value={selectedElement.strokeWidth ?? 0} onChange={(event) => patchElement(selectedElement.id, { strokeWidth: numericValue(event.target.value) } as Partial<CertificateShapeElement>)} /></label><label>Corner radius<input type="number" min="0" value={selectedElement.borderRadius ?? 0} onChange={(event) => patchElement(selectedElement.id, { borderRadius: numericValue(event.target.value) } as Partial<CertificateShapeElement>)} /></label></div>
              </>
            )}

            {selectedElement.type === 'line' && (
              <div className="property-grid two">
                <label>Color<input type="color" value={selectedElement.color} onChange={(event) => patchElement(selectedElement.id, { color: event.target.value } as Partial<CertificateLineElement>)} /></label>
                <label>Thickness<input type="number" min="1" max="40" value={selectedElement.thickness} onChange={(event) => patchElement(selectedElement.id, { thickness: numericValue(event.target.value, 1) } as Partial<CertificateLineElement>)} /></label>
              </div>
            )}

            {selectedElement.type === 'image' && (
              <>
                <div className="image-property-preview"><img src={selectedElement.src} alt={selectedElement.name} /></div>
                <button className="replace-image-button" type="button" onClick={() => replaceImageInputRef.current?.click()}>Replace image</button>
                <input ref={replaceImageInputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => { const file = event.target.files?.[0]; if (file) addImageFromFile(file, selectedElement.id); event.currentTarget.value = '' }} />
                <div className="property-grid two">
                  <label>Fit<select value={selectedElement.objectFit} onChange={(event) => patchElement(selectedElement.id, { objectFit: event.target.value as CertificateImageElement['objectFit'] } as Partial<CertificateImageElement>)}><option value="contain">Contain</option><option value="cover">Cover</option><option value="fill">Stretch</option></select></label>
                  <label>Corner radius<input type="number" min="0" value={selectedElement.borderRadius ?? 0} onChange={(event) => patchElement(selectedElement.id, { borderRadius: numericValue(event.target.value) } as Partial<CertificateImageElement>)} /></label>
                </div>
              </>
            )}

            <div className="property-section-heading layout-heading"><span>Position & size</span><small>Fine-tune placement on the certificate</small></div>
            <div className="property-grid two">
              <label>X<input type="number" value={selectedElement.x} onChange={(event) => patchElement(selectedElement.id, { x: numericValue(event.target.value) })} /></label>
              <label>Y<input type="number" value={selectedElement.y} onChange={(event) => patchElement(selectedElement.id, { y: numericValue(event.target.value) })} /></label>
              <label>Width<input type="number" min="20" value={selectedElement.width} onChange={(event) => patchElement(selectedElement.id, { width: numericValue(event.target.value, 20) })} /></label>
              <label>Height<input type="number" min="12" value={selectedElement.height} onChange={(event) => patchElement(selectedElement.id, { height: numericValue(event.target.value, 12) })} /></label>
              <label>Rotation<input type="number" min="-180" max="180" value={selectedElement.rotation ?? 0} onChange={(event) => patchElement(selectedElement.id, { rotation: numericValue(event.target.value) })} /></label>
              <label>Opacity<input type="number" min="0" max="1" step="0.05" value={selectedElement.opacity ?? 1} onChange={(event) => patchElement(selectedElement.id, { opacity: numericValue(event.target.value, 1) })} /></label>
            </div>
            <label className="toggle-row"><input type="checkbox" checked={selectedElement.locked ?? false} onChange={(event) => patchElement(selectedElement.id, { locked: event.target.checked })} /> Lock element</label>
            <div className="element-actions"><button type="button" onClick={duplicateSelected}>Duplicate</button><button type="button" onClick={deleteSelected} disabled={selectedElement.locked}>Delete</button></div>
          </div>
        )}
      </aside>
    </section>
  )
}
