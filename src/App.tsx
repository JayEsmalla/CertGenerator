import { useState } from 'react'
import CertificateEditor from './components/CertificateEditor'
import TemplateGallery from './components/TemplateGallery'
import { defaultTemplate, starterTemplates } from './data/templates'
import type { CertificateTemplate } from './types/certificate'

type WorkflowStep = 'templates' | 'editor' | 'recipients' | 'generate'

type StepDefinition = {
  id: WorkflowStep
  label: string
  description: string
  icon: string
}

const steps: StepDefinition[] = [
  { id: 'templates', label: 'Templates', description: 'Choose a starting design', icon: '▦' },
  { id: 'editor', label: 'Editor', description: 'Customize every element', icon: '✦' },
  { id: 'recipients', label: 'Recipients', description: 'Import and review data', icon: '◎' },
  { id: 'generate', label: 'Generate', description: 'Export personalized files', icon: '↓' },
]

const cloneTemplate = (template: CertificateTemplate): CertificateTemplate => JSON.parse(JSON.stringify(template)) as CertificateTemplate

function TemplatesPanel({
  selectedTemplate,
  onSelect,
  onUseTemplate,
}: {
  selectedTemplate: CertificateTemplate
  onSelect: (template: CertificateTemplate) => void
  onUseTemplate: (template: CertificateTemplate) => void
}) {
  return (
    <section className="template-stage">
      <div className="template-stage-header">
        <div>
          <div className="eyebrow">Starter library</div>
          <h2>Choose a design to make your own.</h2>
          <p>
            Every design is a reusable certificate document. Content, colors, positions, and merge fields
            are stored as template data rather than fixed page markup.
          </p>
        </div>
        <div className="template-count">
          <strong>{starterTemplates.length}</strong>
          <span>starter templates</span>
        </div>
      </div>
      <TemplateGallery
        templates={starterTemplates}
        selectedId={selectedTemplate.id}
        onSelect={onSelect}
        onUseTemplate={onUseTemplate}
      />
    </section>
  )
}

function PlaceholderPanel({ step }: { step: StepDefinition }) {
  return (
    <section className="stage-card placeholder-stage">
      <div className="placeholder-icon">{step.icon}</div>
      <div className="eyebrow">Next workflow stage</div>
      <h2>{step.label}</h2>
      <p>{step.description}. This surface is ready for the next implementation stage.</p>
    </section>
  )
}

export default function App() {
  const [activeStep, setActiveStep] = useState<WorkflowStep>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate>(() => cloneTemplate(defaultTemplate))
  const selectedStep = steps.find((step) => step.id === activeStep) ?? steps[0]

  const useTemplate = (template: CertificateTemplate) => {
    setSelectedTemplate(cloneTemplate(template))
    setActiveStep('editor')
  }

  const startNewProject = () => {
    setSelectedTemplate(cloneTemplate(defaultTemplate))
    setActiveStep('templates')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">C</div>
          <div>
            <h1>CertStudio</h1>
            <p>Design once. Generate for everyone.</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="local-badge">Local workspace</span>
          <button className="ghost-action" type="button" onClick={startNewProject}>New project</button>
        </div>
      </header>

      <nav className="workflow-nav" aria-label="Certificate workflow">
        {steps.map((step, index) => (
          <button
            type="button"
            key={step.id}
            className={activeStep === step.id ? 'workflow-step active' : 'workflow-step'}
            onClick={() => setActiveStep(step.id)}
          >
            <span className="step-index">{index + 1}</span>
            <span>
              <strong>{step.label}</strong>
              <small>{step.description}</small>
            </span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeStep === 'templates' && (
          <TemplatesPanel
            selectedTemplate={selectedTemplate}
            onSelect={(template) => setSelectedTemplate(cloneTemplate(template))}
            onUseTemplate={useTemplate}
          />
        )}
        {activeStep === 'editor' && <CertificateEditor template={selectedTemplate} onChange={setSelectedTemplate} />}
        {(activeStep === 'recipients' || activeStep === 'generate') && <PlaceholderPanel step={selectedStep} />}
      </main>
    </div>
  )
}
