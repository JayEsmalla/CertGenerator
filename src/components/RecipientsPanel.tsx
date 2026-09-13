import { useMemo, useRef, useState } from 'react'
import CertificatePreview from './CertificatePreview'
import { importRecipientFile } from '../services/importRecipients'
import { getTemplateMergeFields } from '../utils/mergeFields'
import type { CertificateTemplate } from '../types/certificate'
import type { RecipientDataset, RecipientRow } from '../types/recipients'

type RecipientsPanelProps = {
  template: CertificateTemplate
  dataset: RecipientDataset
  onChange: (dataset: RecipientDataset) => void
  onContinue: () => void
}

function safeFieldName(value: string, fallback: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, '_').replace(/^_+|_+$/g, '')
  return normalized || fallback
}

export default function RecipientsPanel({ template, dataset, onChange, onContinue }: RecipientsPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')
  const [previewIndex, setPreviewIndex] = useState(0)

  const enabledRows = useMemo(() => dataset.rows.filter((row) => row.enabled), [dataset.rows])
  const previewRow = enabledRows[Math.min(previewIndex, Math.max(enabledRows.length - 1, 0))]
  const requiredFields = useMemo(() => getTemplateMergeFields(template), [template])
  const missingFields = requiredFields.filter((field) => !dataset.fields.includes(field))

  const handleFile = async (file?: File) => {
    if (!file) return
    setIsImporting(true)
    setError('')
    try {
      const imported = await importRecipientFile(file)
      onChange(imported)
      setPreviewIndex(0)
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Unable to import this file.')
    } finally {
      setIsImporting(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const updateRow = (rowId: string, field: string, value: string) => {
    onChange({
      ...dataset,
      rows: dataset.rows.map((row) => row.id === rowId ? { ...row, values: { ...row.values, [field]: value } } : row),
    })
  }

  const toggleRow = (rowId: string, enabled: boolean) => {
    onChange({ ...dataset, rows: dataset.rows.map((row) => row.id === rowId ? { ...row, enabled } : row) })
  }

  const removeRow = (rowId: string) => {
    onChange({ ...dataset, rows: dataset.rows.filter((row) => row.id !== rowId) })
    setPreviewIndex(0)
  }

  const addRow = () => {
    const row: RecipientRow = {
      id: `recipient-manual-${Date.now()}`,
      enabled: true,
      values: Object.fromEntries(dataset.fields.map((field) => [field, ''])),
    }
    onChange({ ...dataset, rows: [...dataset.rows, row] })
  }

  const renameField = (oldField: string, requestedName: string) => {
    const newField = safeFieldName(requestedName, oldField)
    if (newField === oldField) return
    if (dataset.fields.includes(newField)) {
      setError(`The field “${newField}” already exists.`)
      return
    }
    setError('')
    onChange({
      ...dataset,
      fields: dataset.fields.map((field) => field === oldField ? newField : field),
      rows: dataset.rows.map((row) => {
        const values = { ...row.values, [newField]: row.values[oldField] ?? '' }
        delete values[oldField]
        return { ...row, values }
      }),
    })
  }

  return (
    <section className="recipients-stage">
      <div className="recipients-header">
        <div>
          <div className="eyebrow">Recipient data</div>
          <h2>Import, map, and verify before generating.</h2>
          <p>Upload a Word document, CSV, or text list. CertStudio extracts candidate rows and keeps them editable so the final certificates use only the data you approve.</p>
        </div>
        <div className="recipient-summary">
          <strong>{enabledRows.length}</strong>
          <span>enabled recipients</span>
        </div>
      </div>

      <div className="recipient-layout">
        <div className="recipient-data-card">
          <div
            className="import-zone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              void handleFile(event.dataTransfer.files[0])
            }}
          >
            <div className="import-icon">⇧</div>
            <div>
              <strong>{isImporting ? 'Reading document…' : 'Upload recipient data'}</strong>
              <p>DOCX tables or name lists · CSV · TXT</p>
            </div>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={isImporting}>{dataset.rows.length ? 'Replace file' : 'Choose file'}</button>
            <input ref={inputRef} type="file" accept=".docx,.csv,.txt" hidden onChange={(event) => void handleFile(event.target.files?.[0])} />
          </div>

          {dataset.sourceName && <div className="source-strip"><span>Source</span><strong>{dataset.sourceName}</strong></div>}
          {error && <div className="import-error">{error}</div>}
          {dataset.warnings?.map((warning) => <div className="import-warning" key={warning}>{warning}</div>)}

          {missingFields.length > 0 && (
            <div className="field-status warning">
              <strong>Template fields still need data</strong>
              <div>{missingFields.map((field) => <span key={field}>{`{{${field}}}`}</span>)}</div>
              <p>Rename imported column headers below to match these fields, or replace the merge field with fixed text in the Editor.</p>
            </div>
          )}

          {dataset.rows.length ? (
            <>
              <div className="review-toolbar">
                <div><strong>Review rows</strong><span>Rename column headers to map fields.</span></div>
                <button type="button" onClick={addRow}>+ Add row</button>
              </div>
              <div className="recipient-table-wrap">
                <table className="recipient-table">
                  <thead>
                    <tr>
                      <th className="include-column">Use</th>
                      {dataset.fields.map((field) => (
                        <th key={field}>
                          <input
                            key={field}
                            defaultValue={field}
                            title="Edit merge field name"
                            onBlur={(event) => renameField(field, event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') event.currentTarget.blur()
                            }}
                          />
                        </th>
                      ))}
                      <th className="row-action-column" />
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.rows.map((row) => (
                      <tr key={row.id} className={row.enabled ? '' : 'disabled-row'}>
                        <td className="include-column"><input type="checkbox" checked={row.enabled} onChange={(event) => toggleRow(row.id, event.target.checked)} aria-label={`Use row ${row.id}`} /></td>
                        {dataset.fields.map((field) => <td key={field}><input value={row.values[field] ?? ''} onChange={(event) => updateRow(row.id, field, event.target.value)} /></td>)}
                        <td className="row-action-column"><button type="button" onClick={() => removeRow(row.id)} aria-label="Remove recipient">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-recipient-state">
              <strong>No recipients imported yet.</strong>
              <p>For a Word document, use either a table with a Name/Participant column or a simple list where each name is on its own line.</p>
            </div>
          )}
        </div>

        <aside className="recipient-preview-card">
          <div className="preview-card-heading">
            <div><strong>Live merge preview</strong><span>{previewRow ? `${previewIndex + 1} of ${enabledRows.length}` : 'Waiting for data'}</span></div>
            <div className="preview-nav"><button type="button" disabled={!previewRow || previewIndex === 0} onClick={() => setPreviewIndex((index) => Math.max(0, index - 1))}>←</button><button type="button" disabled={!previewRow || previewIndex >= enabledRows.length - 1} onClick={() => setPreviewIndex((index) => Math.min(enabledRows.length - 1, index + 1))}>→</button></div>
          </div>
          <CertificatePreview template={template} data={previewRow?.values} className="recipient-certificate-preview" />
          {previewRow && (
            <div className="preview-record">
              {dataset.fields.map((field) => <div key={field}><span>{field}</span><strong>{previewRow.values[field] || '—'}</strong></div>)}
            </div>
          )}
          <button className="primary-action recipient-continue" type="button" disabled={!enabledRows.length} onClick={onContinue}>Continue to Generate <span>→</span></button>
        </aside>
      </div>
    </section>
  )
}
