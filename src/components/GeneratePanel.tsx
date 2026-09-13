import { useMemo, useRef, useState } from 'react'
import CertificatePreview from './CertificatePreview'
import {
  exportCombinedPdf,
  exportIndividualZip,
  exportSinglePdf,
  type RenderRecipient,
} from '../services/exportCertificates'
import { analyzeRecipientIntegrity } from '../services/recipientValidation'
import type { CertificateTemplate } from '../types/certificate'
import type { RecipientDataset, RecipientRow } from '../types/recipients'

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

function nextPaint() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

export default function GeneratePanel({ template, dataset, onBack }: GeneratePanelProps) {
  const enabledRows = useMemo(() => dataset.rows.filter((row) => row.enabled), [dataset.rows])
  const integrity = useMemo(() => analyzeRecipientIntegrity(template, dataset), [dataset, template])
  const [selectedId, setSelectedId] = useState(enabledRows[0]?.id ?? '')
  const [activeExport, setActiveExport] = useState<ExportMode>(null)
  const [progress, setProgress] = useState<ProgressState>({ completed: 0, total: 0, label: '' })
  const [error, setError] = useState('')
  const [renderRow, setRenderRow] = useState<RecipientRow | null>(null)
  const renderNode = useRef<HTMLDivElement>(null)
  const abortController = useRef<AbortController | null>(null)

  const selectedRow = enabledRows.find((row) => row.id === selectedId) ?? enabledRows[0]

  const renderRecipient: RenderRecipient = async (row) => {
    setRenderRow(row)
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await nextPaint()
      const node = renderNode.current
      if (node?.dataset.exportRowId === row.id) return node
    }
    throw new Error('The certificate renderer did not become ready. Try the export again.')
  }

  const runExport = async (mode: Exclude<ExportMode, null>) => {
    if (!integrity.canGenerate || !enabledRows.length) return
    const controller = new AbortController()
    abortController.current = controller
    setError('')
    setActiveExport(mode)
    setProgress({ completed: 0, total: mode === 'single' ? 1 : enabledRows.length, label: 'Preparing certificate output' })

    const onProgress = (completed: number, total: number, label: string) => setProgress({ completed, total, label })

    try {
      if (mode === 'combined') {
        await exportCombinedPdf(template, enabledRows, renderRecipient, onProgress, controller.signal)
      } else if (mode === 'zip') {
        await exportIndividualZip(template, enabledRows, renderRecipient, onProgress, controller.signal)
      } else {
        if (!selectedRow) throw new Error('Select a recipient before exporting a single certificate.')
        const index = enabledRows.findIndex((row) => row.id === selectedRow.id)
        await exportSinglePdf(template, selectedRow, index, renderRecipient, onProgress, controller.signal)
      }
    } catch (exportError) {
      const cancelled = exportError instanceof DOMException && exportError.name === 'AbortError'
      setError(cancelled ? 'Export cancelled.' : exportError instanceof Error ? exportError.message : 'Certificate export failed.')
    } finally {
      abortController.current = null
      setRenderRow(null)
      setActiveExport(null)
    }
  }

  const cancelExport = () => abortController.current?.abort()
  const percent = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0

  return (
    <section className="generate-stage">
      <div className="generate-header">
        <div>
          <div className="eyebrow">Generation</div>
          <h2>Export the approved certificate batch.</h2>
          <p>Every file is rendered from the same certificate component used in your preview. Large batches are processed sequentially and automatically split into safe output parts.</p>
        </div>
        <div className="recipient-summary"><strong>{enabledRows.length}</strong><span>certificates ready</span></div>
      </div>

      {!integrity.canGenerate ? (
        <div className="generate-empty">
          <strong>{!enabledRows.length ? 'No enabled recipients.' : 'Recipient data needs attention.'}</strong>
          <p>{!enabledRows.length ? 'Return to the Recipients step and enable at least one row before generating files.' : `${integrity.invalidCount} enabled recipient${integrity.invalidCount === 1 ? '' : 's'} still have missing required certificate data. Resolve them before exporting.`}</p>
          <button type="button" onClick={onBack}>← Back to Recipients</button>
        </div>
      ) : (
        <div className="generate-layout">
          <div className="generate-preview-card">
            <div className="preview-card-heading">
              <div><strong>Final preview</strong><span>{selectedRow?.values.name || 'Selected recipient'}</span></div>
              <select value={selectedRow?.id ?? ''} onChange={(event) => setSelectedId(event.target.value)} disabled={Boolean(activeExport)}>
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
              <span><strong>Combined PDF</strong><small>One PDF per safe batch of up to 250 recipients.</small><em className="export-badge">Recommended</em></span>
              <span>→</span>
            </button>

            <button className="export-option" type="button" disabled={Boolean(activeExport)} onClick={() => void runExport('zip')}>
              <span className="export-option-icon">⌑</span>
              <span><strong>ZIP of individual PDFs</strong><small>Separate PDFs packaged in bounded ZIP parts for reliable browser memory use.</small></span>
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
                <div className="export-progress-footer">
                  <small>{progress.total ? `${Math.min(progress.completed, progress.total)} of ${progress.total}` : 'Preparing'}</small>
                  <button className="cancel-export" type="button" onClick={cancelExport}>Cancel</button>
                </div>
              </div>
            )}
            {error && <div className="import-error export-error">{error}</div>}

            <button className="back-to-recipients" type="button" disabled={Boolean(activeExport)} onClick={onBack}>← Review recipients</button>
          </aside>
        </div>
      )}

      {integrity.canGenerate && renderRow && (
        <div className="export-render-host" aria-hidden="true">
          <div
            ref={renderNode}
            className="export-render-item"
            data-export-row-id={renderRow.id}
            style={{ width: template.width, height: template.height }}
          >
            <CertificatePreview template={template} data={renderRow.values} />
          </div>
        </div>
      )}
    </section>
  )
}
