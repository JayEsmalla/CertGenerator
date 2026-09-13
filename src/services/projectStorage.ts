import type { CertificateElement, CertificateTemplate } from '../types/certificate'
import type { RecipientDataset } from '../types/recipients'

export type PersistedWorkflowStep = 'templates' | 'editor' | 'recipients' | 'generate'

export type PersistedProject = {
  version: 2
  revision: number
  activeStep: PersistedWorkflowStep
  template: CertificateTemplate
  recipients: RecipientDataset
  updatedAt: number
}

type LegacyPersistedProject = Omit<PersistedProject, 'version' | 'revision'> & { version: 1 }

type AssetRecord = {
  id: string
  blob: Blob
  mimeType: string
  size: number
  createdAt: number
}

export type StorageHealth = {
  usage: number | null
  quota: number | null
  persistent: boolean | null
}

const DB_NAME = 'certstudio'
const DB_VERSION = 2
const PROJECT_STORE = 'projects'
const TEMPLATE_STORE = 'templates'
const ASSET_STORE = 'assets'
const META_STORE = 'meta'
const CURRENT_PROJECT_KEY = 'current'
const BACKUP_PROJECT_KEY = 'last-good'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isWorkflowStep(value: unknown): value is PersistedWorkflowStep {
  return value === 'templates' || value === 'editor' || value === 'recipients' || value === 'generate'
}

function isTemplate(value: unknown): value is CertificateTemplate {
  if (!isObject(value)) return false
  return typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.width === 'number'
    && Number.isFinite(value.width)
    && value.width > 0
    && typeof value.height === 'number'
    && Number.isFinite(value.height)
    && value.height > 0
    && Array.isArray(value.elements)
    && value.elements.every((element) => isObject(element) && typeof element.id === 'string' && typeof element.type === 'string')
}

function isRecipientDataset(value: unknown): value is RecipientDataset {
  if (!isObject(value) || !Array.isArray(value.fields) || !Array.isArray(value.rows)) return false
  if (!value.fields.every((field) => typeof field === 'string')) return false
  return value.rows.every((row) => isObject(row)
    && typeof row.id === 'string'
    && typeof row.enabled === 'boolean'
    && isObject(row.values)
    && Object.values(row.values).every((cell) => typeof cell === 'string'))
}

function normalizeProject(value: unknown): PersistedProject | null {
  if (!isObject(value)) return null
  if (value.version !== 1 && value.version !== 2) return null
  if (!isWorkflowStep(value.activeStep) || !isTemplate(value.template) || !isRecipientDataset(value.recipients)) return null
  if (typeof value.updatedAt !== 'number' || !Number.isFinite(value.updatedAt)) return null

  const revision = value.version === 2 && typeof value.revision === 'number' && Number.isFinite(value.revision)
    ? Math.max(1, Math.floor(value.revision))
    : 1

  return {
    version: 2,
    revision,
    activeStep: value.activeStep,
    template: value.template,
    recipients: value.recipients,
    updatedAt: value.updatedAt,
  }
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(PROJECT_STORE)) database.createObjectStore(PROJECT_STORE)
      if (!database.objectStoreNames.contains(TEMPLATE_STORE)) database.createObjectStore(TEMPLATE_STORE, { keyPath: 'id' })
      if (!database.objectStoreNames.contains(ASSET_STORE)) database.createObjectStore(ASSET_STORE, { keyPath: 'id' })
      if (!database.objectStoreNames.contains(META_STORE)) database.createObjectStore(META_STORE)
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open local certificate storage.'))
    request.onblocked = () => reject(new Error('Local storage upgrade is blocked by another CertStudio tab. Close other tabs and retry.'))
  })
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Local storage request failed.'))
  })
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Local storage transaction failed.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Local storage transaction was aborted.'))
  })
}

function dataUrlToBlob(dataUrl: string) {
  const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.*)$/i.exec(dataUrl)
  if (!match) throw new Error('Unsupported embedded image data.')
  const mimeType = match[1] || 'application/octet-stream'
  const binary = atob(match[2])
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: mimeType })
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read stored image.'))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read stored image.'))
    reader.readAsDataURL(blob)
  })
}

async function sha256(blob: Blob) {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function assetRecordForBlob(blob: Blob): Promise<AssetRecord> {
  const hash = await sha256(blob)
  return {
    id: `asset-${hash}`,
    blob,
    mimeType: blob.type || 'application/octet-stream',
    size: blob.size,
    createdAt: Date.now(),
  }
}

async function prepareTemplateForStorage(template: CertificateTemplate) {
  const assets = new Map<string, AssetRecord>()
  const elements: CertificateElement[] = []

  for (const element of template.elements) {
    if (element.type !== 'image') {
      elements.push(element)
      continue
    }

    let assetId = element.assetId
    if (element.src?.startsWith('data:')) {
      const record = await assetRecordForBlob(dataUrlToBlob(element.src))
      assets.set(record.id, record)
      assetId = record.id
    }

    elements.push(assetId ? { ...element, assetId, src: undefined } : element)
  }

  return { template: { ...template, elements }, assets: [...assets.values()] }
}

async function hydrateTemplateAssets(template: CertificateTemplate) {
  const assetIds = [...new Set(template.elements
    .filter((element) => element.type === 'image' && element.assetId && !element.src)
    .map((element) => element.type === 'image' ? element.assetId : undefined)
    .filter((id): id is string => Boolean(id)))]

  if (!assetIds.length) return template

  const database = await openDatabase()
  try {
    const transaction = database.transaction(ASSET_STORE, 'readonly')
    const store = transaction.objectStore(ASSET_STORE)
    const records = await Promise.all(assetIds.map((id) => requestResult(store.get(id)) as Promise<AssetRecord | undefined>))
    await transactionDone(transaction)
    const urls = new Map<string, string>()
    for (const record of records) {
      if (record?.blob instanceof Blob) urls.set(record.id, await blobToDataUrl(record.blob))
    }
    return {
      ...template,
      elements: template.elements.map((element) => element.type === 'image' && element.assetId && !element.src
        ? { ...element, src: urls.get(element.assetId) }
        : element),
    }
  } finally {
    database.close()
  }
}

export async function storeImageAsset(blob: Blob) {
  const record = await assetRecordForBlob(blob)
  const database = await openDatabase()
  try {
    const transaction = database.transaction(ASSET_STORE, 'readwrite')
    transaction.objectStore(ASSET_STORE).put(record)
    await transactionDone(transaction)
  } finally {
    database.close()
  }
  return { assetId: record.id, src: await blobToDataUrl(blob) }
}

export async function loadProject() {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(PROJECT_STORE, 'readonly')
    const store = transaction.objectStore(PROJECT_STORE)
    const [currentValue, backupValue] = await Promise.all([
      requestResult(store.get(CURRENT_PROJECT_KEY)),
      requestResult(store.get(BACKUP_PROJECT_KEY)),
    ])
    await transactionDone(transaction)
    const project = normalizeProject(currentValue) ?? normalizeProject(backupValue)
    if (!project) return null
    return { ...project, template: await hydrateTemplateAssets(project.template) }
  } finally {
    database.close()
  }
}

let saveQueue: Promise<void> = Promise.resolve()

export function saveProject(project: Omit<PersistedProject, 'version' | 'revision' | 'updatedAt'>) {
  const operation = async () => {
    const prepared = await prepareTemplateForStorage(project.template)
    const database = await openDatabase()
    try {
      const transaction = database.transaction([PROJECT_STORE, ASSET_STORE], 'readwrite')
      const projectStore = transaction.objectStore(PROJECT_STORE)
      const currentValue = await requestResult(projectStore.get(CURRENT_PROJECT_KEY))
      const current = normalizeProject(currentValue)
      if (current) projectStore.put(current, BACKUP_PROJECT_KEY)
      for (const asset of prepared.assets) transaction.objectStore(ASSET_STORE).put(asset)
      projectStore.put({
        ...project,
        template: prepared.template,
        version: 2,
        revision: (current?.revision ?? 0) + 1,
        updatedAt: Date.now(),
      } satisfies PersistedProject, CURRENT_PROJECT_KEY)
      await transactionDone(transaction)
    } finally {
      database.close()
    }
  }

  const queued = saveQueue.then(operation, operation)
  saveQueue = queued.catch(() => undefined)
  return queued
}

export async function clearProject() {
  await saveQueue.catch(() => undefined)
  const database = await openDatabase()
  try {
    const transaction = database.transaction(PROJECT_STORE, 'readwrite')
    const store = transaction.objectStore(PROJECT_STORE)
    store.delete(CURRENT_PROJECT_KEY)
    store.delete(BACKUP_PROJECT_KEY)
    await transactionDone(transaction)
  } finally {
    database.close()
  }
}

export async function loadCustomTemplates() {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(TEMPLATE_STORE, 'readonly')
    const templates = await requestResult(transaction.objectStore(TEMPLATE_STORE).getAll())
    await transactionDone(transaction)
    const validTemplates = (templates as unknown[]).filter(isTemplate)
    return (await Promise.all(validTemplates.map(hydrateTemplateAssets))).sort((a, b) => a.name.localeCompare(b.name))
  } finally {
    database.close()
  }
}

export async function saveCustomTemplate(template: CertificateTemplate) {
  const prepared = await prepareTemplateForStorage(template)
  const database = await openDatabase()
  try {
    const transaction = database.transaction([TEMPLATE_STORE, ASSET_STORE], 'readwrite')
    transaction.objectStore(TEMPLATE_STORE).put(prepared.template)
    for (const asset of prepared.assets) transaction.objectStore(ASSET_STORE).put(asset)
    await transactionDone(transaction)
  } finally {
    database.close()
  }
}

export async function deleteCustomTemplate(id: string) {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(TEMPLATE_STORE, 'readwrite')
    transaction.objectStore(TEMPLATE_STORE).delete(id)
    await transactionDone(transaction)
  } finally {
    database.close()
  }
}

export async function getStorageHealth(): Promise<StorageHealth> {
  const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : null
  const persistent = navigator.storage?.persisted ? await navigator.storage.persisted() : null
  return {
    usage: typeof estimate?.usage === 'number' ? estimate.usage : null,
    quota: typeof estimate?.quota === 'number' ? estimate.quota : null,
    persistent,
  }
}

export async function requestPersistentStorage() {
  return navigator.storage?.persist ? navigator.storage.persist() : false
}

export const __storageTestUtils = { isTemplate, isRecipientDataset, normalizeProject }
export type { LegacyPersistedProject }
