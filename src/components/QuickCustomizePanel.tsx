import { useState } from 'react'
import CertificatePreview from './CertificatePreview'
import { IMAGE_ACCEPT } from '../config/limits'
import { prepareImageUpload } from '../services/imageUpload'
import { storeImageAsset } from '../services/projectStorage'
import type {
  CertificateImageElement,
  CertificateQuickField,
  CertificateQuickFieldGroup,
  CertificateTemplate,
  CertificateTextElement,
} from '../types/certificate'

type QuickCustomizePanelProps = {
  template: CertificateTemplate
  onChange: (template: CertificateTemplate) => void
  onAdvanced: () => void
  onContinue: () => void
}

const groupMeta: Record<CertificateQuickFieldGroup, { title: string; description: string; icon: string }> = {
  organization: { title: 'Organization', description: 'Your brand and issuing organization.', icon: 'O' },
  certificate: { title: 'Certificate details', description: 'The wording and details shared by every recipient.', icon: 'C' },
  signatories: { title: 'Signatories', description: 'Who signs or authorizes this certificate.', icon: 'S' },
}

function fieldValue(template: CertificateTemplate, field: CertificateQuickField) {
  if (field.source === 'element' && field.elementId) {
    const element = template.elements.find((item) => item.id === field.elementId)
    return element?.type === 'text' ? element.text : ''
  }
  return template.defaults?.[field.key] ?? ''
}

export default function QuickCustomizePanel({ template, onChange, onAdvanced, onContinue }: QuickCustomizePanelProps) {
  const [imageError, setImageError] = useState('')
  const quickFields = template.quickFields ?? []
  const imageSlots = template.imageSlots ?? []
  const requiredFields = quickFields.filter((field) => field.required)
  const completedRequired = requiredFields.filter((field) => fieldValue(template, field).trim()).length
  const completion = requiredFields.length ? Math.round((completedRequired / requiredFields.length) * 100) : 100

  const patchField = (field: CertificateQuickField, value: string) => {
    if (field.source === 'element' && field.elementId) {
      onChange({
        ...template,
        elements: template.elements.map((element) => (
          element.id === field.elementId && element.type === 'text'
            ? ({ ...element, text: value } as CertificateTextElement)
            : element
        )),
      })
      return
    }

    onChange({ ...template, defaults: { ...(template.defaults ?? {}), [field.key]: value } })
  }

  const patchImageSlot = (elementId: string, src?: string, assetId?: string) => {
    onChange({
      ...template,
      elements: template.elements.map((element) => (
        element.id === elementId && element.type === 'image'
          ? ({ ...element, src, assetId } as CertificateImageElement)
          : element
      )),
    })
  }

  const handleImage = async (elementId: string, file?: File) => {
    if (!file) return
    setImageError('')
    try {
      const prepared = await prepareImageUpload(file)
      const stored = await storeImageAsset(prepared.blob)
      patchImageSlot(elementId, stored.src, stored.assetId)
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Could not use this image.')
    }
  }

  return (
    <section className="quick-customize-stage">
      <div className="quick-customize-header">
        <div>
          <div className="eyebrow">Quick customize</div>
          <h2>Make {template.name} yours.</h2>
          <p>The design is already prepared. Replace the details your organization needs, then import recipient names.</p>
        </div>
        <div className="quick-header-actions">
          <button className="ghost-action" type="button" onClick={onAdvanced}>Advanced editor</button>
          <button className="primary-action" type="button" onClick={onContinue}>Continue to recipients <span>→</span></button>
        </div>
      </div>

      <div className="quick-customize-layout">
        <aside className="quick-form-card">
          {imageError && <div className="inline-upload-error" role="alert">{imageError}</div>}
          <div className="quick-progress-card">
            <div>
              <span>Template setup</span>
              <strong>{completedRequired} of {requiredFields.length || 0} essentials ready</strong>
            </div>
            <span className="quick-progress-value">{completion}%</span>
            <div className="quick-progress-track"><div style={{ width: `${completion}%` }} /></div>
          </div>

          {(Object.keys(groupMeta) as CertificateQuickFieldGroup[]).map((group) => {
            const fields = quickFields.filter((field) => field.group === group)
            const slots = imageSlots.filter((slot) => slot.group === group)
            if (!fields.length && !slots.length) return null
            const meta = groupMeta[group]

            return (
              <section className="quick-section" key={group}>
                <div className="quick-section-heading">
                  <span>{meta.icon}</span>
                  <div><strong>{meta.title}</strong><small>{meta.description}</small></div>
                </div>

                <div className="quick-field-grid">
                  {fields.map((field) => {
                    const value = fieldValue(template, field)
                    const incomplete = field.required && !value.trim()
                    return (
                      <label className={`quick-field ${field.kind === 'textarea' ? 'wide' : ''} ${incomplete ? 'incomplete' : ''}`} key={field.key}>
                        <span>{field.label}{field.required && <em>Required</em>}</span>
                        {field.kind === 'textarea' ? (
                          <textarea rows={3} value={value} placeholder={field.placeholder} onChange={(event) => patchField(field, event.target.value)} />
                        ) : (
                          <input type={field.kind === 'date' ? 'date' : 'text'} value={value} placeholder={field.placeholder} onChange={(event) => patchField(field, event.target.value)} />
                        )}
                        {field.helper && <small>{field.helper}</small>}
                      </label>
                    )
                  })}
                </div>

                {slots.length > 0 && (
                  <div className="quick-image-slots">
                    {slots.map((slot) => {
                      const element = template.elements.find((item) => item.id === slot.elementId)
                      const image = element?.type === 'image' ? element : null
                      return (
                        <div className="quick-image-slot" key={slot.key}>
                          <div className="quick-image-thumb">
                            {image?.src ? <img src={image.src} alt={slot.label} /> : <span>{slot.label.slice(0, 1)}</span>}
                          </div>
                          <div className="quick-image-info">
                            <strong>{slot.label}</strong>
                            <small>{slot.helper ?? 'PNG, JPEG, or WebP · up to 8 MB'}</small>
                          </div>
                          <label className="quick-upload-action">
                            {image?.src ? 'Replace' : 'Upload'}
                            <input hidden type="file" accept={IMAGE_ACCEPT} onChange={(event) => { void handleImage(slot.elementId, event.target.files?.[0]); event.currentTarget.value = '' }} />
                          </label>
                          {image?.src && <button className="quick-remove-image" type="button" onClick={() => patchImageSlot(slot.elementId)}>Remove</button>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </aside>

        <div className="quick-preview-column">
          <div className="quick-preview-heading">
            <div><span>Live preview</span><strong>{template.purpose ?? template.category}</strong></div>
            <div className="quick-template-tags">{template.tags?.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
          </div>
          <div className="quick-canvas-wrap">
            <CertificatePreview template={template} className="quick-certificate-preview" />
          </div>
          <div className="quick-preview-note">
            <span>✓</span>
            <div><strong>Your design stays intact.</strong><p>Use Advanced editor only when you want to move elements, change typography, or redesign the template.</p></div>
          </div>
        </div>
      </div>
    </section>
  )
}
