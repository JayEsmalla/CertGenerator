import CertificatePreview from './CertificatePreview'
import type { CertificateTemplate } from '../types/certificate'

type TemplateGalleryProps = {
  templates: CertificateTemplate[]
  selectedId: string
  customTemplateIds?: string[]
  onSelect: (template: CertificateTemplate) => void
  onUseTemplate: (template: CertificateTemplate) => void
  onDeleteTemplate?: (template: CertificateTemplate) => void
}

export default function TemplateGallery({
  templates,
  selectedId,
  customTemplateIds = [],
  onSelect,
  onUseTemplate,
  onDeleteTemplate,
}: TemplateGalleryProps) {
  return (
    <div className="template-gallery">
      {templates.map((template) => {
        const selected = template.id === selectedId
        const custom = customTemplateIds.includes(template.id)
        return (
          <article
            key={template.id}
            className={`template-card ${selected ? 'selected' : ''}`}
          >
            <button
              type="button"
              className="template-card-preview template-preview-select"
              onClick={() => onSelect(template)}
              aria-pressed={selected}
              aria-label={`Preview ${template.name}`}
            >
              <CertificatePreview template={template} compact />
              {selected && <span className="selected-pill">Selected</span>}
              {custom && <span className="custom-template-pill">Custom</span>}
            </button>
            <div className="template-card-body">
              <div>
                <span className="template-category">{template.category}</span>
                <h3>{template.name}</h3>
              </div>
              <p>{template.description}</p>
              <div className="template-meta-row">
                <span>{template.style ?? 'Custom design'}</span>
                <span>{template.orientation}</span>
              </div>
              <div className="template-card-actions">
                <button
                  type="button"
                  className="template-use-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onUseTemplate(template)
                  }}
                >
                  Use template <span aria-hidden="true">→</span>
                </button>
                {custom && onDeleteTemplate && (
                  <button
                    type="button"
                    className="template-delete-button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onDeleteTemplate(template)
                    }}
                    aria-label={`Delete ${template.name}`}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
