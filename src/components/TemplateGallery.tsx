import CertificatePreview from './CertificatePreview'
import type { CertificateTemplate } from '../types/certificate'

type TemplateGalleryProps = {
  templates: CertificateTemplate[]
  selectedId: string
  onSelect: (template: CertificateTemplate) => void
  onUseTemplate: (template: CertificateTemplate) => void
}

export default function TemplateGallery({ templates, selectedId, onSelect, onUseTemplate }: TemplateGalleryProps) {
  return (
    <div className="template-gallery">
      {templates.map((template) => {
        const selected = template.id === selectedId
        return (
          <article
            key={template.id}
            className={`template-card ${selected ? 'selected' : ''}`}
            onClick={() => onSelect(template)}
          >
            <div className="template-card-preview">
              <CertificatePreview template={template} compact />
              {selected && <span className="selected-pill">Selected</span>}
            </div>
            <div className="template-card-body">
              <div>
                <span className="template-category">{template.category}</span>
                <h3>{template.name}</h3>
              </div>
              <p>{template.description}</p>
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
            </div>
          </article>
        )
      })}
    </div>
  )
}
