import * as mammoth from 'mammoth'
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

function cleanCell(value: string) {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
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
  return `recipient-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`
}

function makeRows(fields: string[], sourceRows: string[][]): RecipientRow[] {
  return sourceRows
    .filter((row) => row.some((value) => cleanCell(value)))
    .map((row, index) => ({
      id: rowId(index),
      enabled: true,
      values: Object.fromEntries(fields.map((field, fieldIndex) => [field, cleanCell(row[fieldIndex] ?? '')])),
    }))
}

function hasRecognizableHeader(row: string[]) {
  return row.some((cell) => Boolean(aliases[cleanCell(cell).toLowerCase().replace(/[:*]/g, '').trim()]))
}

function datasetFromTable(rows: string[][], sourceName: string): RecipientDataset {
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
      ? ['A Word table header was detected. Review the mapped field names before generating.']
      : ['No clear table header was detected. Review and rename the imported columns before generating.'],
  }
}

function parseDelimited(text: string, delimiter: string) {
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
      current = ''
      continue
    }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      currentRow.push(current)
      rows.push(currentRow)
      currentRow = []
      current = ''
      continue
    }
    current += char
  }

  if (current || currentRow.length) {
    currentRow.push(current)
    rows.push(currentRow)
  }
  return rows
}

async function importDocx(file: File): Promise<RecipientDataset> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer })
  const document = new DOMParser().parseFromString(result.value, 'text/html')

  const tables = [...document.querySelectorAll('table')]
    .map((table) => [...table.querySelectorAll('tr')]
      .map((row) => [...row.querySelectorAll('th,td')].map((cell) => cleanCell(cell.textContent ?? '')))
      .filter((row) => row.some(Boolean)))
    .filter((rows) => rows.length)
    .sort((a, b) => b.length - a.length)

  if (tables.length) {
    const dataset = datasetFromTable(tables[0], file.name)
    if (tables.length > 1) dataset.warnings?.push(`Found ${tables.length} tables; imported the table with the most rows.`)
    if (result.messages.length) dataset.warnings?.push(`${result.messages.length} document conversion note(s) were reported.`)
    return dataset
  }

  const rawResult = await mammoth.extractRawText({ arrayBuffer })
  const lines = rawResult.value
    .split(/\r?\n/)
    .map((line) => cleanCell(line).replace(/^([•●▪◦*-]|\d+[.)])\s*/, ''))
    .filter(Boolean)

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
  const lines = (await file.text()).split(/\r?\n/).map(cleanCell).filter(Boolean)
  return {
    fields: ['name'],
    rows: makeRows(['name'], lines.map((line) => [line])),
    sourceName: file.name,
    warnings: ['Each non-empty text line was imported as a candidate name. Review the list before generating.'],
  }
}

export async function importRecipientFile(file: File): Promise<RecipientDataset> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'docx') return importDocx(file)
  if (extension === 'csv') return importCsv(file)
  if (extension === 'txt') return importTxt(file)
  throw new Error('Unsupported file type. Upload a DOCX, CSV, or TXT file.')
}
