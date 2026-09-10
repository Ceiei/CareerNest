import { describe, expect, it } from 'vitest';
import { matchFields } from '../utils/engine/matcher';
import type { FieldDescriptor, ProfileCandidate } from '../utils/types';

const field = (overrides: Partial<FieldDescriptor>): FieldDescriptor => ({
  id: 'f1', kind: 'text', label: '姓名', context: '', required: false,
  existingValue: '', options: [], occurrence: 0, ...overrides
});

const candidates: ProfileCandidate[] = [
  { key: 'personal.fullName', label: '姓名', value: '张三', valueType: 'text', sensitive: true },
  { key: 'personal.phone', label: '手机号', value: '13800000000', valueType: 'text', sensitive: true },
  { key: 'education.0.school', label: '学校', value: '示例大学', valueType: 'text', sensitive: false, recordIndex: 0 },
  { key: 'personal.gender', label: '性别', value: '男', valueType: 'choice', sensitive: false }
];

describe('matchFields', () => {
  it('matches Chinese aliases without an LLM', () => {
    const [match] = matchFields([field({ label: '请输入真实姓名' })], candidates);
    expect(match?.candidateKey).toBe('personal.fullName');
    expect(match?.status).toBe('matched');
  });

  it('uses autocomplete metadata', () => {
    const [match] = matchFields([field({ label: 'Contact', autocomplete: 'tel-national' })], candidates);
    expect(match?.candidateKey).toBe('personal.phone');
  });

  it('does not overwrite existing fields', () => {
    const [match] = matchFields([field({ existingValue: '网页已有值' })], candidates);
    expect(match?.status).toBe('existing');
    expect(match?.candidateKey).toBeUndefined();
  });

  it('checks whether a select option can accept the candidate', () => {
    const [match] = matchFields([field({ kind: 'select', label: '性别', options: [{ label: '男', value: 'M' }, { label: '女', value: 'F' }] })], candidates);
    expect(match?.candidateKey).toBe('personal.gender');
    expect(match?.confidence).toBeGreaterThan(0.8);
  });
});
