import type { PersonProfile, Primitive, ProfileCandidate, WorkspaceMode } from './types';
import { BASIC_FIELDS } from './basic-fields';
import { choiceKeyForPath } from './choices';

export const EMPTY_PROFILE: PersonProfile = {
  schemaVersion: 1,
  personal: {
    fullName: '', englishName: '', gender: '', birthDate: '', phone: '', email: '',
    idNumber: '', nationality: '', nativePlace: '', politicalStatus: '', address: '',
    studentId: '', ethnicGroup: '', householdRegistration: '', emergencyContact: '', emergencyPhone: ''
  },
  education: [],
  experience: [],
  projects: [],
  research: [],
  publications: [],
  awards: [],
  skills: [],
  preferences: {},
  custom: {}
};

const LABELS: Record<string, string> = {
  fullName: '姓名', englishName: '英文名', gender: '性别', birthDate: '出生日期',
  phone: '手机号', email: '邮箱', idNumber: '证件号码', nationality: '国籍',
  nativePlace: '籍贯', politicalStatus: '政治面貌', address: '联系地址', studentId: '学号',
  ethnicGroup: '民族', householdRegistration: '户籍所在地', emergencyContact: '紧急联系人', emergencyPhone: '紧急联系电话',
  school: '学校', degree: '学历', major: '专业', startDate: '开始日期', endDate: '结束日期',
  gpa: 'GPA', ranking: '成绩排名', company: '公司', position: '职位', department: '部门',
  projectName: '项目名称', role: '项目角色', researchTopic: '研究方向', advisor: '导师',
  title: '标题', venue: '发表平台', awardName: '奖项名称', level: '级别', date: '日期',
  description: '描述', responsibilities: '职责', achievements: '成果', city: '城市', score: '成绩',
  enrollmentType: '培养方式', graduationDate: '毕业日期', language: '语言', proficiency: '熟练程度'
};

const SENSITIVE_SUFFIXES = new Set(['fullName', 'phone', 'email', 'idNumber', 'address', 'birthDate']);

function valueType(key: string, value: Primitive): ProfileCandidate['valueType'] {
  if (typeof value === 'boolean') return 'boolean';
  if (/date|日期|时间/i.test(key)) return 'date';
  if (/gender|degree|status|level|学历|性别|状态|级别/i.test(key)) return 'choice';
  return 'text';
}

export function flattenProfile(profile: PersonProfile, mode?: WorkspaceMode): ProfileCandidate[] {
  const result: ProfileCandidate[] = [];
  const add = (key: string, suffix: string, value: Primitive, recordIndex?: number) => {
    if (value === '' || value === null || value === undefined) return;
    result.push({
      key,
      label: BASIC_FIELDS.find(field => `${field.root}.${field.key}` === key)?.label ?? LABELS[suffix] ?? suffix,
      value,
      valueType: choiceKeyForPath(key) ? 'choice' : valueType(suffix, value),
      sensitive: SENSITIVE_SUFFIXES.has(suffix) || BASIC_FIELDS.some(field => `${field.root}.${field.key}` === key && field.sensitive),
      recordIndex
    });
  };

  Object.entries(profile.personal).forEach(([key, value]) => add(`personal.${key}`, key, value));
  const collections = ['education', 'experience', 'projects', 'research', 'publications', 'awards'] as const;
  collections.forEach((collection) => {
    profile[collection].forEach((record, index) => {
      Object.entries(record).forEach(([key, value]) => { if (key !== 'id') add(`${collection}.${index}.${key}`, key, value, index); });
    });
  });
  if (profile.skills.length) add('skills', 'skills', profile.skills.join('、'));
  Object.entries(profile.preferences).forEach(([key, value]) => add(`preferences.${key}`, key, value));
  Object.entries(profile.custom).forEach(([key, value]) => add(`custom.${key}`, key, value));
  if (!mode) return result;
  return result.filter(candidate => {
    const field = BASIC_FIELDS.find(item => `${item.root}.${item.key}` === candidate.key);
    return !field?.modes || field.modes.includes(mode);
  });
}

export function mergeProfile(base: PersonProfile, patch: Partial<PersonProfile>): PersonProfile {
  const legacy = patch as Partial<PersonProfile> & { basicProfile?: Partial<PersonProfile['personal']>; internships?: Array<Record<string, Primitive>>; customFields?: Record<string, Primitive> };
  const merged = {
    ...base,
    ...patch,
    personal: { ...base.personal, ...(legacy.basicProfile ?? {}), ...(patch.personal ?? {}) },
    experience: patch.experience ?? legacy.internships ?? base.experience,
    preferences: { ...base.preferences, ...(patch.preferences ?? {}) },
    custom: { ...base.custom, ...(legacy.customFields ?? {}), ...(patch.custom ?? {}) },
    schemaVersion: 1
  };
  const collections = ['education', 'experience', 'projects', 'research', 'publications', 'awards'] as const;
  collections.forEach((collection) => {
    merged[collection] = (merged[collection] ?? []).map((record) => ({ ...record, id: String(record.id || createRecordId()) }));
  });
  return merged;
}

export function createRecordId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `record-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function setProfilePath(profile: PersonProfile, path: string, value: Primitive): void {
  const parts = path.split('.').filter(Boolean);
  if (parts.length < 2) throw new Error(`无效路径：${path}`);
  if (parts.some((part) => ['__proto__', 'prototype', 'constructor'].includes(part))) throw new Error(`不安全的路径：${path}`);
  const allowedRoots = new Set(['personal', 'education', 'experience', 'projects', 'research', 'publications', 'awards', 'preferences', 'custom']);
  if (!allowedRoots.has(parts[0]!)) throw new Error(`不支持的资料区域：${parts[0]}`);
  let node: unknown = profile;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]!;
    const next = parts[i + 1]!;
    if (Array.isArray(node)) {
      const index = Number(part);
      if (!Number.isInteger(index) || index < 0) throw new Error(`无效数组下标：${part}`);
      node[index] ??= {};
      node = node[index];
    } else if (node && typeof node === 'object') {
      const object = node as Record<string, unknown>;
      object[part] ??= /^\d+$/.test(next) ? [] : {};
      node = object[part];
    } else {
      throw new Error(`无法写入路径：${path}`);
    }
  }
  const last = parts.at(-1)!;
  if (Array.isArray(node)) node[Number(last)] = value;
  else (node as Record<string, unknown>)[last] = value;
}
