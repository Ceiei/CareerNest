export type Primitive = string | number | boolean;
export type WorkspaceMode = 'job' | 'academic';

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'combobox';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDescriptor {
  id: string;
  kind: FieldKind;
  inputType?: string;
  label: string;
  context: string;
  name?: string;
  autocomplete?: string;
  required: boolean;
  existingValue: string;
  options: FieldOption[];
  occurrence: number;
  selectorHint?: string;
  maxLength?: number;
  pattern?: string;
}

export interface ProfileCandidate {
  key: string;
  label: string;
  value: Primitive;
  valueType: 'text' | 'date' | 'boolean' | 'choice';
  sensitive: boolean;
  recordIndex?: number;
}

export interface FieldMatch {
  fieldId: string;
  candidateKey?: string;
  value?: Primitive;
  confidence: number;
  reason: string;
  status: 'matched' | 'ambiguous' | 'unmatched' | 'existing';
}

export interface FillInstruction {
  fieldId: string;
  candidateKey: string;
  value: Primitive;
}

export interface FillResult {
  fieldId: string;
  ok: boolean;
  reason?: string;
}

export interface PersonProfile {
  schemaVersion: number;
  personal: {
    fullName: string;
    englishName: string;
    gender: string;
    birthDate: string;
    phone: string;
    email: string;
    idNumber: string;
    nationality: string;
    nativePlace: string;
    politicalStatus: string;
    address: string;
    studentId: string;
    ethnicGroup: string;
    householdRegistration: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  education: Array<Record<string, Primitive>>;
  experience: Array<Record<string, Primitive>>;
  projects: Array<Record<string, Primitive>>;
  research: Array<Record<string, Primitive>>;
  publications: Array<Record<string, Primitive>>;
  awards: Array<Record<string, Primitive>>;
  skills: string[];
  preferences: Record<string, Primitive>;
  custom: Record<string, Primitive>;
}

export interface ResumeRecord extends Record<string, Primitive> {
  id: string;
}

export interface LlmConfig {
  enabled: boolean;
  baseUrl: string;
  model: string;
  apiKey: string;
}

export interface FeishuConfig {
  domain: 'feishu' | 'lark';
  accessToken: string;
  appToken: string;
  tableId: string;
}

export interface AppSettings {
  llm: LlmConfig;
  feishu: FeishuConfig;
}

export type ExtensionMessage =
  | { type: 'DETECT_PAGE' }
  | { type: 'SCAN_FORM' }
  | { type: 'FILL_FORM'; instructions: FillInstruction[] }
  | { type: 'FOCUS_FIELD'; fieldId: string }
  | {
      type: 'LLM_MATCH';
      fields: FieldDescriptor[];
      candidates: Array<Pick<ProfileCandidate, 'key' | 'label' | 'valueType'>>;
    }
  | { type: 'AI_GENERATE'; question: string; context: string; facts: Array<{ key: string; label: string; value: Primitive }> }
  | { type: 'AI_EXTRACT_RESUME'; resumeText: string }
  | { type: 'FEISHU_IMPORT'; config: FeishuConfig };
