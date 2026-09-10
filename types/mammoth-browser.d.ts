declare module 'mammoth/mammoth.browser' {
  export interface ExtractRawTextInput { arrayBuffer: ArrayBuffer }
  export interface ExtractRawTextResult { value: string; messages: unknown[] }
  const mammoth: { extractRawText(input: ExtractRawTextInput): Promise<ExtractRawTextResult> };
  export default mammoth;
}
