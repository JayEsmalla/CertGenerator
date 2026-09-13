declare module 'mammoth' {
  export type MammothMessage = {
    type: string
    message: string
    error?: unknown
  }

  export type MammothResult = {
    value: string
    messages: MammothMessage[]
  }

  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>
}
