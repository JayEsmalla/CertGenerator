import { useState } from 'react'

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

function TemplatesPanel({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="stage-card welcome-stage">
      <div className="eyebrow">CertStudio 2.0</div>
      <h2>Certificates built for any organization.</h2>
      <p>
        Start from a reusable template, make it your own, then merge it with recipient data to create
        personalized certificates in bulk.
      </p>
      <div className="foundation-grid" aria-label="Planned foundation capabilities">
        <article>
          <span>01</span>
          <strong>Reusable templates</strong>
          <p>Design once and keep layouts independent from recipient information.</p>
        </article>
        <article>
          <span>02</span>
          <strong>Flexible data</strong>
          <p>Names, roles, awards, dates, departments, and custom fields can all be merged.</p>
        </article>
        <article>
          <span>03</span>
          <strong>Batch generation</strong>
          <p>Preview recipients before creating individual certificates or a combined set.</p>
        </article>
      </div>
      <button className="primary-action" onClick={onContinue}>
        Open editor workspace <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}

function EditorFoundation() {
  return (
    <section className="editor-shell" aria-label="Certificate editor workspace">
      <aside className="tool-rail">
        <button className="tool-button active" type="button"><span>+T</span>Text</button>
        <button className="tool-button" type="button"><span>▧</span>Image</button>
        <button className="tool-button" type="button"><span>◇</span>Shape</button>
        <button className="tool-button" type="button"><span>⌁</span>Uploads</button>
      </aside>

      <div className="canvas-workspace">
        <div className="canvas-toolbar">
          <div>
            <strong>Untitled Certificate</strong>
            <span>A4 · Landscape</span>
          </div>
          <div className="toolbar-actions">
            <button type="button" disabled aria-label="Undo">↶</button>
            <button type="button" disabled aria-label="Redo">↷</button>
            <span>100%</span>
          </div>
        </div>

        <div className="canvas-stage">
          <article className="certificate-placeholder">
            <div className="certificate-frame" />
            <div className="certificate-kicker">CERTIFICATE OF RECOGNITION</div>
            <div className="certificate-copy">This certificate is proudly presented to</div>
            <div className="certificate-name">{'{{name}}'}</div>
            <div className="certificate-divider" />
            <p>
              In recognition of outstanding participation and contribution to
              <strong> {'{{event}}'}</strong>.
            </p>
            <div className="certificate-signatures">
              <span>Authorized Signatory</span>
              <span>Date Issued</span>
            </div>
          </article>
        </div>
      </div>

      <aside className="properties-panel">
        <div className="panel-heading">
          <span>Properties</span>
          <small>Nothing selected</small>
        </div>
        <div className="empty-properties">
          <div>◇</div>
          <strong>Select an element</strong>
          <p>Element-specific controls will appear here as the editor engine is introduced.</p>
        </div>
      </aside>
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
  const selectedStep = steps.find((step) => step.id === activeStep) ?? steps[0]

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
          <button className="ghost-action" type="button">New project</button>
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
        {activeStep === 'templates' && <TemplatesPanel onContinue={() => setActiveStep('editor')} />}
        {activeStep === 'editor' && <EditorFoundation />}
        {(activeStep === 'recipients' || activeStep === 'generate') && <PlaceholderPanel step={selectedStep} />}
      </main>
    </div>
  )
}
