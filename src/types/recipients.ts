export type RecipientValues = Record<string, string>

export type RecipientRow = {
  id: string
  enabled: boolean
  values: RecipientValues
}

export type RecipientDataset = {
  fields: string[]
  rows: RecipientRow[]
  sourceName?: string
  warnings?: string[]
}

export const emptyRecipientDataset: RecipientDataset = {
  fields: ['name'],
  rows: [],
}
