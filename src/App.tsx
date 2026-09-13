import { useEffect, useMemo, useState } from 'react'
import CertificateEditor from './components/CertificateEditor'
import GeneratePanel from './components/GeneratePanel'
import QuickCustomizePanel from './components/QuickCustomizePanel'
import RecipientsPanel from './components/RecipientsPanel'
import TemplateGallery from './components/TemplateGallery'
import { defaultTemplate, starterTemplates } from './data/templates'
import {
  clearProject,
  deleteCustomTemplate,
  loadCustomTemplates,
  loadProject,
  saveCustomTemplate,
  saveProject,
  type PersistedWorkflowStep,
} from './services/projectStorage'
import { emptyRecipientDataset } from './types/recipients'
import type { CertificateTemplate } from './types/certificate'
import type { RecipientDataset } from './types/recipients'

type WorkflowStep = PersistedWorkflowStep

type StepDefinition = {
  id: WorkflowStep
  label: string
  description: string
  icon: string
}

type SaveState = 'loading' | 'saving' | 'saved' | 'error'

const steps: StepDefinition[] = [
  { id: 'templates', label: 'Templates', description: 'Choose a starting design', icon: '▦' },
  { id: 'editor', label: 'Editor', description: 'Customize every element', icon: '✦' },
  { id: 'recipients', label: 'Recipients', description: 'Import and review data', icon: '◎' },
  { id: 'generate', label: 'Generate', description: 'Export personalized files', icon: '↓' },
]

const cloneTemplate = (template: CertificateTemplate): CertificateTemplate => structuredClone(template)

function TemplatesPanel({
  templates,
  customTemplateIds,
  selectedTemplate,
  onSelect,
  onUseTemplate,
  onDeleteTemplate,
}: {
  templates: CertificateTemplate[]
  customTemplateIds: string[]
  selectedTemplate: CertificateTemplate
  onSelect: (template: CertificateTemplate) => void
  onUseTemplate: (template: CertificateTemplate) => void
  onDeleteTemplate: (template: CertificateTemplate) => void
}) {
  return (
    <section className="template-stage">
      <div className="template-stage-header">
        <div>
          <div className="eyebrow">Template library</div>
          <h2>Choose a design to make your own.</h2>
          <p>Starter designs and templates you save from the editor live here. Content, colors, images, positions, and merge fields remain fully editable.</p>
        </div>
        <div className="template-count"><strong>{templates.length}</strong><span>available templates</span></div>
      </div>
      <TemplateGallery
        templates={templates}
        selectedId={selectedTemplate.id}
        customTemplateIds={customTemplateIds}
        onSelect={onSelect}
        onUseTemplate={onUseTemplate}
        onDeleteTemplate={onDeleteTemplate}
      />
    </section>
  )
}

export default function App() {
  const [activeStep, setActiveStep] = useState<WorkflowStep>('templates')
  const [editorMode, setEditorMode] = useState<'quick' | 'advanced'>('quick')
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate>(() => cloneTemplate(defaultTemplate))
  const [recipients, setRecipients] = useState<RecipientDataset>(emptyRecipientDataset)
  const [customTemplates, setCustomTemplates] = useState<CertificateTemplate[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('loading')
  const [templateNotice, setTemplateNotice] = useState('')

  const availableTemplates = useMemo(() => [...starterTemplates, ...customTemplates], [customTemplates])
  const customTemplateIds = useMemo(() => customTemplates.map((template) => template.id), [customTemplates])

  useEffect(() => {
    let cancelled = false
    void Promise.all([loadProject(), loadCustomTemplates()])
      .then(([project, templates]) => {
        if (cancelled) return
        setCustomTemplates(templates)
        if (project?.version === 1) {
          setActiveStep(project.activeStep)
          setSelectedTemplate(project.template)
          setRecipients(project.recipients)
        }
        setSaveState('saved')
      })
      .catch(() => {
        if (!cancelled) setSaveState('error')
      })
      .finally(() => {
        if (!cancelled) setHydrated(true)
      })

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    setSaveState('saving')
    const timeout = window.setTimeout(() => {
      void saveProject({ activeStep, template: selectedTemplate, recipients })
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'))
    }, 450)
    return () => window.clearTimeout(timeout)
  }, [activeStep, hydrated, recipients, selectedTemplate])

  const useTemplate = (template: CertificateTemplate) => {
    setSelectedTemplate(cloneTemplate(template))
    setEditorMode(template.quickFields?.length ? 'quick' : 'advanced')
    setActiveStep('editor')
  }

  const startNewProject = () => {
    void clearProject().catch(() => setSaveState('error'))
    setSelectedTemplate(cloneTemplate(defaultTemplate))
    setRecipients(structuredClone(emptyRecipientDataset))
    setEditorMode('quick')
    setActiveStep('templates')
    setTemplateNotice('')
  }

  const saveDesignToLibrary = async () => {
    const isExistingCustom = customTemplateIds.includes(selectedTemplate.id)
    const template: CertificateTemplate = {
      ...cloneTemplate(selectedTemplate),
      id: isExistingCustom ? selectedTemplate.id : `custom-${Date.now()}`,
      description: selectedTemplate.description || 'Custom certificate template saved in CertStudio.',
    }

    try {
      await saveCustomTemplate(template)
      setCustomTemplates((current) => {
        const withoutCurrent = current.filter((item) => item.id !== template.id)
        return [...withoutCurrent, template].sort((a, b) => a.name.localeCompare(b.name))
      })
      setSelectedTemplate(template)
      setTemplateNotice(isExistingCustom ? 'Template updated.' : 'Template saved to your library.')
      window.setTimeout(() => setTemplateNotice(''), 2500)
    } catch {
      setTemplateNotice('Could not save this template locally.')
    }
  }

  const removeCustomTemplate = async (template: CertificateTemplate) => {
    try {
      await deleteCustomTemplate(template.id)
      setCustomTemplates((current) => current.filter((item) => item.id !== template.id))
      if (selectedTemplate.id === template.id) setSelectedTemplate(cloneTemplate(defaultTemplate))
    } catch {
      setTemplateNotice('Could not delete this template.')
    }
  }

  if (!hydrated) {
    return <div className="storage-loading"><div className="brand-mark">C</div><strong>Restoring your CertStudio workspace…</strong></div>
  }

  const saveLabel = saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Storage issue' : 'Saved locally'

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">C</div>
          <div><h1>CertStudio</h1><p>Design once. Generate for everyone.</p></div>
        </div>
        <div className="header-actions">
          {templateNotice && <span className="template-notice">{templateNotice}</span>}
          <span className={`local-badge ${saveState}`}>{saveLabel}</span>
          {activeStep === 'editor' && <button className="ghost-action" type="button" onClick={() => void saveDesignToLibrary()}>Save template</button>}
          <button className="ghost-action" type="button" onClick={startNewProject}>New project</button>
        </div>
      </header>

      <nav className="workflow-nav" aria-label="Certificate workflow">
        {steps.map((step, index) => (
          <button type="button" key={step.id} className={activeStep === step.id ? 'workflow-step active' : 'workflow-step'} onClick={() => setActiveStep(step.id)}>
            <span className="step-index">{index + 1}</span><span><strong>{step.label}</strong><small>{step.description}</small></span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeStep === 'templates' && <TemplatesPanel templates={availableTemplates} customTemplateIds={customTemplateIds} selectedTemplate={selectedTemplate} onSelect={(template) => setSelectedTemplate(cloneTemplate(template))} onUseTemplate={useTemplate} onDeleteTemplate={(template) => void removeCustomTemplate(template)} />}
        {activeStep === 'editor' && editorMode === 'quick' && selectedTemplate.quickFields?.length ? (
          <QuickCustomizePanel
            template={selectedTemplate}
            onChange={setSelectedTemplate}
            onAdvanced={() => setEditorMode('advanced')}
            onContinue={() => setActiveStep('recipients')}
          />
        ) : null}
        {activeStep === 'editor' && (editorMode === 'advanced' || !selectedTemplate.quickFields?.length) && (
          <CertificateEditor
            template={selectedTemplate}
            onChange={setSelectedTemplate}
            onQuickCustomize={selectedTemplate.quickFields?.length ? () => setEditorMode('quick') : undefined}
          />
        )}
        {activeStep === 'recipients' && <RecipientsPanel template={selectedTemplate} dataset={recipients} onChange={setRecipients} onContinue={() => setActiveStep('generate')} />}
        {activeStep === 'generate' && <GeneratePanel template={selectedTemplate} dataset={recipients} onBack={() => setActiveStep('recipients')} />}
      </main>
    </div>
  )
}
