import { useMemo, useRef, useState } from 'react'
import CertificatePreview from './CertificatePreview'
import {
  exportCombinedPdf,
  exportIndividualZip,
  exportSinglePdf,
  type ExportTarget,
} from '../services/exportCertificates'
import type { CertificateTemplate } from '../types/certificate'
import type { RecipientDataset } from '../types/recipients'

type GeneratePanelProps = {
  template: CertificateTemplate
  dataset: RecipientDataset
  onBack: () => void
}

type ExportMode = 'single' | 'combined' | 'zip' | null

type ProgressState = {
  completed: number
  total: number
  label: string
}

export default function GeneratePanel({ template, dataset, onBack }: GeneratePanelProps) {
  const enabledRows = useMemo(() => dataset.rows.filter((row) => row.enabled), [dataset.rows])
  const [selectedId, setSelectedId] = useState(enabledRows[0]?.id ?? '')
  const [activeExport, setActiveExport] = useState<ExportMode>(null)
  const [progress, setProgress] = useState<ProgressState>({ completed: 0, total: 0, label: '' })
  const [error, setError] = useState('')
  const renderNodes = useRef(new Map<string, HTMLDivElement>())

  const selectedRow = enabledRows.find((row) => row.id === selectedId) ?? enabledRows[0]

  const targets = (): ExportTarget[] => {
    const readyTargets: ExportTarget[] = []
    enabledRows.forEach((row, index) => {
      const element = renderNodes.current.get(row.id)
      if (element) readyTargets.push({ row, index, element })
    })
    return readyTargets
  }

  const runExport = async (mode: Exclude<ExportMode, null>) => {
    if (!enabledRows.length) return
    setError('')
    setActiveExport(mode)
    setProgress({ completed: 0, total: mode === 'single' ? 1 : enabledRows.length, label: 'Preparing certificate output' })

    const onProgress = (completed: number, total: number, label: string) => setProgress({ completed, total, label })

    try {
      const allTargets = targets()
      if (allTargets.length !== enabledRows.length) throw new Error('Certificate render targets are not ready yet. Try again in a moment.')

      if (mode === 'combined') {
        await exportCombinedPdf(template, allTargets, onProgress)
      } else if (mode === 'zip') {
        await exportIndividualZip(template, allTargets, onProgress)
      } else {
        const target = allTargets.find((item) => item.row.id === selectedRow?.id)
        if (!target) throw new Error('Select a recipient before exporting a single certificate.')
        await exportSinglePdf(template, target, onProgress)
      }
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Certificate export failed.')
    } finally {
      setActiveExport(null)
    }
  }

  const percent = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0

  return (
    <section className="generate-stage">
      <div className="generate-header">
        <div>
          <div className="eyebrow">Generation</div>
          <h2>Export the approved certificate batch.</h2>
          <p>Every file is rendered from the exact same certificate component used in your preview, with each enabled recipient merged into the selected design.</p>
        </div>
        <div className="recipient-summary"><strong>{enabledRows.length}</strong><span>certificates ready</span></div>
      </div>

      {!enabledRows.length ? (
        <div className="generate-empty">
          <strong>No enabled recipients.</strong>
          <p>Return to the Recipients step and enable at least one row before generating files.</p>
          <button type="button" onClick={onBack}>← Back to Recipients</button>
        </div>
      ) : (
        <div className="generate-layout">
          <div className="generate-preview-card">
            <div className="preview-card-heading">
              <div><strong>Final preview</strong><span>{selectedRow?.values.name || 'Selected recipient'}</span></div>
              <select value={selectedRow?.id ?? ''} onChange={(event) => setSelectedId(event.target.value)}>
                {enabledRows.map((row, index) => <option key={row.id} value={row.id}>{row.values.name || `Recipient ${index + 1}`}</option>)}
              </select>
            </div>
            <CertificatePreview template={template} data={selectedRow?.values} className="generate-certificate-preview" />
            <div className="generate-preview-meta">
              <span>{template.name}</span>
              <span>{template.orientation}</span>
              <span>{template.width} × {template.height}</span>
            </div>
          </div>

          <aside className="export-options-card">
            <div className="export-heading"><div className="eyebrow">Download options</div><h3>Choose your output.</h3></div>

            <button className="export-option" type="button" disabled={Boolean(activeExport)} onClick={() => void runExport('combined')}>
              <span className="export-option-icon">▤</span>
              <span><strong>Combined PDF</strong><small>One multi-page PDF containing every enabled recipient.</small></span>
              <span>→</span>
            </button>

            <button className="export-option" type="button" disabled={Boolean(activeExport)} onClick={() => void runExport('zip')}>
              <span className="export-option-icon">⌑</span>
              <span><strong>ZIP of individual PDFs</strong><small>A separate PDF for each recipient, packaged in one archive.</small></span>
              <span>→</span>
            </button>

            <button className="export-option" type="button" disabled={Boolean(activeExport) || !selectedRow} onClick={() => void runExport('single')}>
              <span className="export-option-icon">□</span>
              <span><strong>Selected recipient PDF</strong><small>Download only the certificate currently shown in the preview.</small></span>
              <span>→</span>
            </button>

            {activeExport && (
              <div className="export-progress" aria-live="polite">
                <div><strong>{progress.label}</strong><span>{percent}%</span></div>
                <div className="progress-track"><div style={{ width: `${percent}%` }} /></div>
                <small>{progress.total ? `${Math.min(progress.completed, progress.total)} of ${progress.total}` : 'Preparing'}</small>
              </div>
            )}
            {error && <div className="import-error export-error">{error}</div>}

            <button className="back-to-recipients" type="button" disabled={Boolean(activeExport)} onClick={onBack}>← Review recipients</button>
          </aside>
        </div>
      )}

      <div className="export-render-host" aria-hidden="true">
        {enabledRows.map((row) => (
          <div
            key={row.id}
            className="export-render-item"
            style={{ width: template.width, height: template.height }}
            ref={(node) => {
              if (node) renderNodes.current.set(row.id, node)
              else renderNodes.current.delete(row.id)
            }}
          >
            <CertificatePreview template={template} data={row.values} />
          </div>
        ))}
      </div>
    </section>
  )
}
