import { IMPORT_LIMITS } from '../config/limits'
import type { RecipientDataset, RecipientRow } from '../types/recipients'

const aliases: Record<string, string> = {
  'name': 'name',
  'full name': 'name',
  'fullname': 'name',
  'recipient': 'name',
  'recipient name': 'name',
  'participant': 'name',
  'participant name': 'name',
  'attendee': 'name',
  'attendee name': 'name',
  'organization': 'organization',
  'organisation': 'organization',
  'company': 'organization',
  'school': 'organization',
  'institution': 'organization',
  'event': 'event',
  'seminar': 'event',
  'program': 'event',
  'programme': 'event',
  'award': 'award',
  'recognition': 'award',
  'role': 'role',
  'position': 'role',
  'designation': 'role',
  'date': 'date',
  'date issued': 'date',
  'signatory': 'signatory',
  'signer': 'signatory',
}

function limitError(message: string) {
  return new Error(`${message} Import a smaller, cleaner recipient file and try again.`)
}

function cleanCell(value: string) {
  const cleaned = value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
  if (cleaned.length > IMPORT_LIMITS.maxCellChars) {
    throw limitError(`A cell exceeds the ${IMPORT_LIMITS.maxCellChars.toLocaleString()} character limit.`)
  }
  return cleaned
}

function normalizeField(value: string, index: number) {
  const cleaned = cleanCell(value).toLowerCase().replace(/[:*]/g, '').trim()
  if (aliases[cleaned]) return aliases[cleaned]
  const safe = cleaned
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return safe || `column_${index + 1}`
}

function makeUniqueFields(fields: string[]) {
  const counts = new Map<string, number>()
  return fields.map((field) => {
    const count = counts.get(field) ?? 0
    counts.set(field, count + 1)
    return count === 0 ? field : `${field}_${count + 1}`
  })
}

function rowId(index: number) {
  return typeof crypto?.randomUUID === 'function'
    ? `recipient-${crypto.randomUUID()}`
    : `recipient-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`
}

function assertTableLimits(rows: string[][]) {
  if (rows.length > IMPORT_LIMITS.maxRows + 1) {
    throw limitError(`The file contains more than ${IMPORT_LIMITS.maxRows.toLocaleString()} recipient rows.`)
  }
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0)
  if (maxColumns > IMPORT_LIMITS.maxColumns) {
    throw limitError(`The file contains more than ${IMPORT_LIMITS.maxColumns} columns.`)
  }
}

function makeRows(fields: string[], sourceRows: string[][]): RecipientRow[] {
  if (fields.length > IMPORT_LIMITS.maxColumns) throw limitError(`The file contains more than ${IMPORT_LIMITS.maxColumns} columns.`)
  const filtered = sourceRows.filter((row) => row.some((value) => cleanCell(value)))
  if (filtered.length > IMPORT_LIMITS.maxRows) throw limitError(`The file contains more than ${IMPORT_LIMITS.maxRows.toLocaleString()} recipients.`)

  return filtered.map((row, index) => ({
    id: rowId(index),
    enabled: true,
    values: Object.fromEntries(fields.map((field, fieldIndex) => [field, cleanCell(row[fieldIndex] ?? '')])),
  }))
}

function hasRecognizableHeader(row: string[]) {
  return row.some((cell) => Boolean(aliases[cleanCell(cell).toLowerCase().replace(/[:*]/g, '').trim()]))
}

function datasetFromTable(rows: string[][], sourceName: string): RecipientDataset {
  assertTableLimits(rows)
  const maxColumns = Math.max(...rows.map((row) => row.length), 1)
  const firstRow = rows[0] ?? []
  const firstRowIsHeader = hasRecognizableHeader(firstRow)

  let fields: string[]
  let dataRows: string[][]

  if (firstRowIsHeader) {
    fields = makeUniqueFields(Array.from({ length: maxColumns }, (_, index) => normalizeField(firstRow[index] ?? '', index)))
    dataRows = rows.slice(1)
  } else if (maxColumns === 1) {
    fields = ['name']
    dataRows = rows
  } else {
    fields = Array.from({ length: maxColumns }, (_, index) => `column_${index + 1}`)
    dataRows = rows
  }

  return {
    fields,
    rows: makeRows(fields, dataRows),
    sourceName,
    warnings: firstRowIsHeader
      ? ['A table header was detected. Review the mapped field names before generating.']
      : ['No clear table header was detected. Review and rename the imported columns before generating.'],
  }
}

function pushDelimitedRow(rows: string[][], currentRow: string[], current: string) {
  currentRow.push(current)
  if (currentRow.length > IMPORT_LIMITS.maxColumns) throw limitError(`The file contains more than ${IMPORT_LIMITS.maxColumns} columns.`)
  rows.push(currentRow)
  if (rows.length > IMPORT_LIMITS.maxRows + 1) throw limitError(`The file contains more than ${IMPORT_LIMITS.maxRows.toLocaleString()} recipient rows.`)
}

function parseDelimited(text: string, delimiter: string) {
  if (text.includes('\0')) throw new Error('This file appears to be binary rather than CSV/text data.')
  if (text.length > IMPORT_LIMITS.maxExtractedChars) throw limitError('The extracted text is too large.')

  const rows: string[][] = []
  let currentRow: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      index += 1
      continue
    }
    if (char === '"') {
      quoted = !quoted
      continue
    }
    if (char === delimiter && !quoted) {
      currentRow.push(current)
      if (currentRow.length > IMPORT_LIMITS.maxColumns) throw limitError(`The file contains more than ${IMPORT_LIMITS.maxColumns} columns.`)
      current = ''
      continue
    }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      pushDelimitedRow(rows, currentRow, current)
      currentRow = []
      current = ''
      continue
    }
    current += char
    if (current.length > IMPORT_LIMITS.maxCellChars) throw limitError(`A cell exceeds the ${IMPORT_LIMITS.maxCellChars.toLocaleString()} character limit.`)
  }

  if (quoted) throw new Error('The CSV contains an unterminated quoted field.')
  if (current || currentRow.length) pushDelimitedRow(rows, currentRow, current)
  return rows
}

async function assertDocxHeader(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error('The selected DOCX is not a valid Word/ZIP document.')
  }
}

function assertFileSize(file: File) {
  if (!file.size) throw new Error('The selected recipient file is empty.')
  if (file.size > IMPORT_LIMITS.maxFileBytes) {
    throw limitError(`Recipient files must be ${Math.round(IMPORT_LIMITS.maxFileBytes / 1024 / 1024)} MB or smaller.`)
  }
}

async function importDocx(file: File): Promise<RecipientDataset> {
  await assertDocxHeader(file)
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer })
  if (result.value.length > IMPORT_LIMITS.maxExtractedChars) throw limitError('The Word document expands to too much text.')
  const document = new DOMParser().parseFromString(result.value, 'text/html')

  const tables = [...document.querySelectorAll('table')]
    .map((table) => [...table.querySelectorAll('tr')]
      .map((row) => [...row.querySelectorAll('th,td')].map((cell) => cleanCell(cell.textContent ?? '')))
      .filter((row) => row.some(Boolean)))
    .filter((rows) => rows.length)
    .sort((a, b) => b.length - a.length)

  if (tables.length) {
    assertTableLimits(tables[0])
    const dataset = datasetFromTable(tables[0], file.name)
    if (tables.length > 1) dataset.warnings?.push(`Found ${tables.length} tables; imported the table with the most rows.`)
    if (result.messages.length) dataset.warnings?.push(`${result.messages.length} document conversion note(s) were reported.`)
    return dataset
  }

  const rawResult = await mammoth.extractRawText({ arrayBuffer })
  if (rawResult.value.length > IMPORT_LIMITS.maxExtractedChars) throw limitError('The Word document expands to too much text.')
  const lines = rawResult.value
    .split(/\r?\n/)
    .map((line) => cleanCell(line).replace(/^([•●▪◦*-]|\d+[.)])\s*/, ''))
    .filter(Boolean)
  if (lines.length > IMPORT_LIMITS.maxRows) throw limitError(`The document contains more than ${IMPORT_LIMITS.maxRows.toLocaleString()} candidate recipients.`)

  return {
    fields: ['name'],
    rows: makeRows(['name'], lines.map((line) => [line])),
    sourceName: file.name,
    warnings: [
      'No Word table was found. Each non-empty paragraph/list line was imported as a candidate name. Review the rows and remove headings or unrelated text before generating.',
      ...(rawResult.messages.length ? [`${rawResult.messages.length} document conversion note(s) were reported.`] : []),
    ],
  }
}

async function importCsv(file: File): Promise<RecipientDataset> {
  const text = await file.text()
  const rows = parseDelimited(text.replace(/^\uFEFF/, ''), ',').filter((row) => row.some((cell) => cleanCell(cell)))
  if (!rows.length) return { fields: ['name'], rows: [], sourceName: file.name, warnings: ['The file did not contain importable rows.'] }
  return datasetFromTable(rows, file.name)
}

async function importTxt(file: File): Promise<RecipientDataset> {
  const text = await file.text()
  if (text.includes('\0')) throw new Error('This file appears to be binary rather than plain text.')
  if (text.length > IMPORT_LIMITS.maxExtractedChars) throw limitError('The text file is too large after decoding.')
  const lines = text.split(/\r?\n/).map(cleanCell).filter(Boolean)
  if (lines.length > IMPORT_LIMITS.maxRows) throw limitError(`The file contains more than ${IMPORT_LIMITS.maxRows.toLocaleString()} recipients.`)
  return {
    fields: ['name'],
    rows: makeRows(['name'], lines.map((line) => [line])),
    sourceName: file.name,
    warnings: ['Each non-empty text line was imported as a candidate name. Review the list before generating.'],
  }
}

export async function importRecipientFile(file: File): Promise<RecipientDataset> {
  assertFileSize(file)
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'docx') return importDocx(file)
  if (extension === 'csv') return importCsv(file)
  if (extension === 'txt') return importTxt(file)
  throw new Error('Unsupported file type. Upload a DOCX, CSV, or TXT file.')
}

export const __importTestUtils = { cleanCell, datasetFromTable, parseDelimited, assertTableLimits }
