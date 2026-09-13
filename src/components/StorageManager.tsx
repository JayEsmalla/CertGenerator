import { useEffect, useRef, useState } from 'react'
import {
  clearAllLocalData,
  downloadProjectBackup,
  getStorageHealth,
  loadLastGoodProject,
  readProjectBackup,
  requestPersistentStorage,
  type ProjectBackup,
  type StorageHealth,
} from '../services/projectStorage'

type StorageManagerProps = {
  open: boolean
  onClose: () => void
  project: ProjectBackup['project']
  autosaveEnabled: boolean
  onAutosaveChange: (enabled: boolean) => void
  onRestore: (project: ProjectBackup['project']) => void
  onClear: () => void
}

function formatBytes(bytes: number | null) {
  if (bytes === null) return 'Unavailable'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`
}

export default function StorageManager({ open, onClose, project, autosaveEnabled, onAutosaveChange, onRestore, onClear }: StorageManagerProps) {
  const [health, setHealth] = useState<StorageHealth | null>(null)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    void getStorageHealth().then(setHealth).catch(() => setHealth(null))
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [])]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [onClose, open])

  if (!open) return null

  const refresh = () => void getStorageHealth().then(setHealth).catch(() => setHealth(null))

  const restorePrevious = async () => {
    setMessage('')
    try {
      const previous = await loadLastGoodProject()
      if (!previous) throw new Error('No previous local save is available yet.')
      onRestore({ activeStep: previous.activeStep, template: previous.template, recipients: previous.recipients })
      setMessage('Previous local save restored.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not restore the previous save.')
    }
  }

  const restoreFile = async (file?: File) => {
    if (!file) return
    setMessage('')
    try {
      onRestore(await readProjectBackup(file))
      setMessage('Backup restored. Autosave will create a fresh local revision.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not restore this backup.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const persistStorage = async () => {
    const granted = await requestPersistentStorage().catch(() => false)
    setMessage(granted ? 'Browser storage protection is enabled.' : 'The browser did not grant persistent storage. Download backups for important projects.')
    refresh()
  }

  const clear = async () => {
    if (!window.confirm('Clear every locally saved CertStudio project, custom template, and uploaded asset on this browser? This cannot be undone.')) return
    try {
      await clearAllLocalData()
      onClear()
      setMessage('All local CertStudio data was cleared.')
      refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not clear local data.')
    }
  }

  const percent = health?.usage != null && health.quota ? Math.min(100, Math.round((health.usage / health.quota) * 100)) : null

  return (
    <div className="storage-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={panelRef} className="storage-panel" role="dialog" aria-modal="true" aria-labelledby="storage-title">
        <div className="storage-panel-header"><div><span className="eyebrow">Local data</span><h2 id="storage-title">Storage & recovery</h2></div><button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close storage settings">×</button></div>
        <div className="storage-section">
          <div className="storage-row"><div><strong>Project autosave</strong><span>{autosaveEnabled ? 'Changes are saved locally after you edit.' : 'Private session: current changes stay in memory only.'}</span></div><button className={`storage-toggle ${autosaveEnabled ? 'on' : ''}`} type="button" role="switch" aria-checked={autosaveEnabled} onClick={() => onAutosaveChange(!autosaveEnabled)}>{autosaveEnabled ? 'On' : 'Off'}</button></div>
          <div className="storage-meter"><div><strong>{formatBytes(health?.usage ?? null)} used</strong><span>{health?.quota ? `of ${formatBytes(health.quota)} browser quota` : 'Browser quota unavailable'}</span></div>{percent !== null && <div className="storage-meter-track"><div style={{ width: `${percent}%` }} /></div>}</div>
          <div className="storage-row"><div><strong>Persistent browser storage</strong><span>{health?.persistent === true ? 'Protected from routine browser eviction.' : 'May be cleared by the browser under storage pressure.'}</span></div>{health?.persistent !== true && <button type="button" onClick={() => void persistStorage()}>Request</button>}</div>
        </div>
        <div className="storage-section"><h3>Backup & recovery</h3><div className="storage-actions"><button type="button" onClick={() => downloadProjectBackup(project)}>Download project backup</button><button type="button" onClick={() => fileRef.current?.click()}>Restore backup file</button><input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(event) => void restoreFile(event.target.files?.[0])} /><button type="button" onClick={() => void restorePrevious()}>Restore previous local save</button></div></div>
        <div className="storage-section danger"><h3>Local data cleanup</h3><p>This removes this browser's saved project, custom templates, and uploaded assets.</p><button type="button" onClick={() => void clear()}>Clear all local data</button></div>
        {message && <div className="storage-message" role="status">{message}</div>}
      </section>
    </div>
  )
}
