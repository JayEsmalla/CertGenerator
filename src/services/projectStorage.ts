import type { CertificateTemplate } from '../types/certificate'
import type { RecipientDataset } from '../types/recipients'

export type PersistedWorkflowStep = 'templates' | 'editor' | 'recipients' | 'generate'

export type PersistedProject = {
  version: 1
  activeStep: PersistedWorkflowStep
  template: CertificateTemplate
  recipients: RecipientDataset
  updatedAt: number
}

const DB_NAME = 'certstudio'
const DB_VERSION = 1
const PROJECT_STORE = 'projects'
const TEMPLATE_STORE = 'templates'
const CURRENT_PROJECT_KEY = 'current'

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(PROJECT_STORE)) database.createObjectStore(PROJECT_STORE)
      if (!database.objectStoreNames.contains(TEMPLATE_STORE)) database.createObjectStore(TEMPLATE_STORE, { keyPath: 'id' })
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open local certificate storage.'))
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

export async function loadProject() {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(PROJECT_STORE, 'readonly')
    const value = await requestResult(transaction.objectStore(PROJECT_STORE).get(CURRENT_PROJECT_KEY))
    await transactionDone(transaction)
    return (value as PersistedProject | undefined) ?? null
  } finally {
    database.close()
  }
}

export async function saveProject(project: Omit<PersistedProject, 'version' | 'updatedAt'>) {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(PROJECT_STORE, 'readwrite')
    transaction.objectStore(PROJECT_STORE).put({ ...project, version: 1, updatedAt: Date.now() } satisfies PersistedProject, CURRENT_PROJECT_KEY)
    await transactionDone(transaction)
  } finally {
    database.close()
  }
}

export async function clearProject() {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(PROJECT_STORE, 'readwrite')
    transaction.objectStore(PROJECT_STORE).delete(CURRENT_PROJECT_KEY)
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
    return (templates as CertificateTemplate[]).sort((a, b) => a.name.localeCompare(b.name))
  } finally {
    database.close()
  }
}

export async function saveCustomTemplate(template: CertificateTemplate) {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(TEMPLATE_STORE, 'readwrite')
    transaction.objectStore(TEMPLATE_STORE).put(template)
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
