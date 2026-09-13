import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import StorageManager from './components/StorageManager'
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
  type ProjectBackup,
} from './services/projectStorage'
import { emptyRecipientDataset } from './types/recipients'
import type { CertificateTemplate } from './types/certificate'
import type { RecipientDataset } from './types/recipients'

const CertificateEditor = lazy(() => import('./components/CertificateEditor'))
const GeneratePanel = lazy(() => import('./components/GeneratePanel'))
const QuickCustomizePanel = lazy(() => import('./components/QuickCustomizePanel'))
const RecipientsPanel = lazy(() => import('./components/RecipientsPanel'))

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

function TemplatesPanel({ templates, customTemplateIds, selectedTemplate, onSelect, onUseTemplate, onDeleteTemplate }: {
  templates: CertificateTemplate[]
  customTemplateIds: string[]
  selectedTemplate: CertificateTemplate
  onSelect: (template: CertificateTemplate) => void
  onUseTemplate: (template: CertificateTemplate) => void
  onDeleteTemplate: (template: CertificateTemplate) => void
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const categories = useMemo(() => ['All', ...Array.from(new Set(templates.map((template) => template.category)))], [templates])
  const visibleTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return templates.filter((template) => {
      const matchesCategory = category === 'All' || template.category === category
      if (!matchesCategory) return false
      if (!normalizedQuery) return true
      const searchable = [template.name, template.category, template.description, template.purpose, template.style, ...(template.tags ?? [])]
        .filter(Boolean).join(' ').toLowerCase()
      return searchable.includes(normalizedQuery)
    })
  }, [category, query, templates])

  return (
    <section className="template-stage">
      <div className="template-stage-header"><div><div className="eyebrow">Template library</div><h2>Choose a design that is already presentation-ready.</h2><p>Pick the closest certificate for your organization, replace the essential details, and generate. Every official template is still fully editable when you need deeper customization.</p></div><div className="template-count"><strong>{visibleTemplates.length}</strong><span>{visibleTemplates.length === templates.length ? 'available templates' : `of ${templates.length} templates`}</span></div></div>
      <div className="template-browser-controls"><label className="template-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by purpose, style, or template name" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear template search">×</button>}</label><div className="template-category-filter" aria-label="Filter templates by category">{categories.map((item) => <button type="button" key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
      {visibleTemplates.length ? <TemplateGallery templates={visibleTemplates} selectedId={selectedTemplate.id} customTemplateIds={customTemplateIds} onSelect={onSelect} onUseTemplate={onUseTemplate} onDeleteTemplate={onDeleteTemplate} /> : <div className="template-empty-results"><strong>No matching templates.</strong><span>Try another keyword or choose a different category.</span></div>}
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
  const [storageOpen, setStorageOpen] = useState(false)
  const [autosaveEnabled, setAutosaveEnabled] = useState(true)
  const [externalUpdate, setExternalUpdate] = useState(false)
  const tabId = useRef(typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
  const channelRef = useRef<BroadcastChannel | null>(null)

  const availableTemplates = useMemo(() => [...starterTemplates, ...customTemplates], [customTemplates])
  const customTemplateIds = useMemo(() => customTemplates.map((template) => template.id), [customTemplates])
  const currentProject = useMemo<ProjectBackup['project']>(() => ({ activeStep, template: selectedTemplate, recipients }), [activeStep, recipients, selectedTemplate])

  useEffect(() => {
    let cancelled = false
    void Promise.all([loadProject(), loadCustomTemplates()])
      .then(([project, templates]) => {
        if (cancelled) return
        setCustomTemplates(templates)
        if (project) {
          setActiveStep(project.activeStep)
          setSelectedTemplate(project.template)
          setRecipients(project.recipients)
        }
        setSaveState('saved')
      })
      .catch(() => { if (!cancelled) setSaveState('error') })
      .finally(() => { if (!cancelled) setHydrated(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel('certstudio-project')
    channelRef.current = channel
    channel.onmessage = (event) => {
      const message = event.data as { type?: string; tabId?: string }
      if (message?.type === 'saved' && message.tabId !== tabId.current) {
        setExternalUpdate(true)
        setAutosaveEnabled(false)
      }
    }
    return () => { channel.close(); channelRef.current = null }
  }, [])

  useEffect(() => {
    if (!hydrated || !autosaveEnabled || externalUpdate) return
    setSaveState('saving')
    const timeout = window.setTimeout(() => {
      void saveProject(currentProject)
        .then((receipt) => {
          setSaveState('saved')
          channelRef.current?.postMessage({ type: 'saved', tabId: tabId.current, revision: receipt.revision, updatedAt: receipt.updatedAt })
        })
        .catch(() => setSaveState('error'))
    }, 750)
    return () => window.clearTimeout(timeout)
  }, [autosaveEnabled, currentProject, externalUpdate, hydrated])

  useEffect(() => {
    if (!hydrated || !autosaveEnabled || externalUpdate) return
    const flush = () => {
      if (document.visibilityState === 'hidden') void saveProject(currentProject).catch(() => undefined)
    }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', flush)
    return () => { document.removeEventListener('visibilitychange', flush); window.removeEventListener('pagehide', flush) }
  }, [autosaveEnabled, currentProject, externalUpdate, hydrated])

  const useTemplate = (template: CertificateTemplate) => {
    setSelectedTemplate(cloneTemplate(template))
    setEditorMode(template.quickFields?.length ? 'quick' : 'advanced')
    setActiveStep('editor')
  }

  const restoreProject = (project: ProjectBackup['project']) => {
    setActiveStep(project.activeStep)
    setSelectedTemplate(cloneTemplate(project.template))
    setRecipients(structuredClone(project.recipients))
    setExternalUpdate(false)
    setAutosaveEnabled(true)
  }

  const resetInMemoryProject = () => {
    setSelectedTemplate(cloneTemplate(defaultTemplate))
    setRecipients(structuredClone(emptyRecipientDataset))
    setEditorMode('quick')
    setActiveStep('templates')
    setTemplateNotice('')
    setExternalUpdate(false)
  }

  const startNewProject = () => {
    void clearProject().catch(() => setSaveState('error'))
    resetInMemoryProject()
  }

  const saveDesignToLibrary = async () => {
    const isExistingCustom = customTemplateIds.includes(selectedTemplate.id)
    const template: CertificateTemplate = { ...cloneTemplate(selectedTemplate), id: isExistingCustom ? selectedTemplate.id : `custom-${Date.now()}`, description: selectedTemplate.description || 'Custom certificate template saved in CertStudio.' }
    try {
      await saveCustomTemplate(template)
      setCustomTemplates((current) => [...current.filter((item) => item.id !== template.id), template].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedTemplate(template)
      setTemplateNotice(isExistingCustom ? 'Template updated.' : 'Template saved to your library.')
      window.setTimeout(() => setTemplateNotice(''), 2500)
    } catch { setTemplateNotice('Could not save this template locally.') }
  }

  const removeCustomTemplate = async (template: CertificateTemplate) => {
    try {
      await deleteCustomTemplate(template.id)
      setCustomTemplates((current) => current.filter((item) => item.id !== template.id))
      if (selectedTemplate.id === template.id) setSelectedTemplate(cloneTemplate(defaultTemplate))
    } catch { setTemplateNotice('Could not delete this template.') }
  }

  if (!hydrated) return <div className="storage-loading"><div className="brand-mark">C</div><strong>Restoring your CertStudio workspace…</strong></div>

  const saveLabel = saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Storage issue' : 'Saved locally'
  const activeStepIndex = Math.max(0, steps.findIndex((step) => step.id === activeStep))

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block"><div className="brand-mark" aria-hidden="true">C</div><div><h1>CertStudio</h1><p>Design once. Generate for everyone.</p></div></div>
        <div className="header-actions">
          {templateNotice && <span className="template-notice">{templateNotice}</span>}
          {externalUpdate && <span className="external-update-banner" role="alert">Another tab saved this project. <button type="button" onClick={() => window.location.reload()}>Reload latest</button><button type="button" onClick={() => { setExternalUpdate(false); setAutosaveEnabled(true) }}>Keep this tab</button></span>}
          <span className={`local-badge ${saveState}`}><span className="save-status-dot" aria-hidden="true" />{autosaveEnabled ? saveLabel : 'Autosave off'}</span>
          <button className="app-action tertiary" type="button" onClick={() => setStorageOpen(true)}>Storage</button>
          {activeStep === 'editor' && <button className="app-action secondary" type="button" onClick={() => void saveDesignToLibrary()}>Save template</button>}
          <button className="app-action tertiary" type="button" onClick={startNewProject}>New project</button>
        </div>
      </header>

      <nav className="workflow-nav" aria-label="Certificate workflow">
        {steps.map((step, index) => {
          const isActive = activeStep === step.id
          const isComplete = index < activeStepIndex
          return <button type="button" key={step.id} className={`workflow-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`.trim()} onClick={() => setActiveStep(step.id)} aria-current={isActive ? 'step' : undefined}><span className="step-index">{isComplete ? '✓' : index + 1}</span><span className="step-copy"><strong>{step.label}</strong><small>{step.description}</small></span></button>
        })}
      </nav>

      <main className="app-main">
        <Suspense fallback={<div className="workflow-loading" role="status">Loading workspace…</div>}>
          {activeStep === 'templates' && <TemplatesPanel templates={availableTemplates} customTemplateIds={customTemplateIds} selectedTemplate={selectedTemplate} onSelect={(template) => setSelectedTemplate(cloneTemplate(template))} onUseTemplate={useTemplate} onDeleteTemplate={(template) => void removeCustomTemplate(template)} />}
          {activeStep === 'editor' && editorMode === 'quick' && selectedTemplate.quickFields?.length ? <QuickCustomizePanel template={selectedTemplate} onChange={setSelectedTemplate} onAdvanced={() => setEditorMode('advanced')} onContinue={() => setActiveStep('recipients')} /> : null}
          {activeStep === 'editor' && (editorMode === 'advanced' || !selectedTemplate.quickFields?.length) && <CertificateEditor template={selectedTemplate} onChange={setSelectedTemplate} onQuickCustomize={selectedTemplate.quickFields?.length ? () => setEditorMode('quick') : undefined} />}
          {activeStep === 'recipients' && <RecipientsPanel template={selectedTemplate} dataset={recipients} onChange={setRecipients} onContinue={() => setActiveStep('generate')} />}
          {activeStep === 'generate' && <GeneratePanel template={selectedTemplate} dataset={recipients} onBack={() => setActiveStep('recipients')} />}
        </Suspense>
      </main>

      <StorageManager open={storageOpen} onClose={() => setStorageOpen(false)} project={currentProject} autosaveEnabled={autosaveEnabled} onAutosaveChange={(enabled) => { setAutosaveEnabled(enabled); if (enabled) setExternalUpdate(false) }} onRestore={restoreProject} onClear={() => { resetInMemoryProject(); setCustomTemplates([]); setAutosaveEnabled(false) }} />
    </div>
  )
}
