import { describe, expect, it } from 'vitest';
import { renderBasicEditor, collectBasicEditor } from '../utils/basic-editor';
import { EMPTY_PROFILE, flattenProfile, mergeProfile } from '../utils/profile';
import { matchFields } from '../utils/engine/matcher';
import type { FieldDescriptor } from '../utils/types';

describe('campus basic information', () => {
  it('edits existing custom paths and round-trips them without losing other data', () => {
    const profile = mergeProfile(structuredClone(EMPTY_PROFILE), {
      custom: { idType: '护照', wechat: 'example', legacyNote: '保留' },
      preferences: { daysPerWeek: '4天' },
      education: [{ school: '示例大学' }]
    });
    const container = document.createElement('div');
    renderBasicEditor(container, profile, 'job');
    expect(container.querySelector<HTMLInputElement>('[data-basic-key="idType"]')?.value).toBe('护照');
    container.querySelector<HTMLInputElement>('[data-basic-key="currentCity"]')!.value = ' 上海 ';
    container.querySelector<HTMLInputElement>('[data-basic-key="wechat"]')!.value = '';
    collectBasicEditor(container, profile);
    const restored = mergeProfile(structuredClone(EMPTY_PROFILE), JSON.parse(JSON.stringify(profile)));
    expect(restored.custom).toEqual({ idType: '护照', currentCity: '上海', legacyNote: '保留' });
    expect(restored.preferences.daysPerWeek).toBe('4天');
    expect(restored.education[0]?.school).toBe('示例大学');
    expect(restored.custom.referencePhone).toBeUndefined();
  });

  it('switches views over one shared profile and keeps hidden mode values', () => {
    const profile = structuredClone(EMPTY_PROFILE);
    profile.preferences = { workCity: '上海', targetSchool: '示例大学' };
    const container = document.createElement('div');
    renderBasicEditor(container, profile, 'job');
    expect(container.querySelector('[data-basic-key="workCity"]')).toBeTruthy();
    expect(container.querySelector('[data-basic-key="targetSchool"]')).toBeNull();
    renderBasicEditor(container, profile, 'academic');
    expect(container.querySelector('[data-basic-key="workCity"]')).toBeNull();
    expect(container.querySelector<HTMLInputElement>('[data-basic-key="targetSchool"]')?.value).toBe('示例大学');
    expect(flattenProfile(profile, 'job').some(candidate => candidate.key === 'preferences.targetSchool')).toBe(false);
    expect(flattenProfile(profile, 'academic').some(candidate => candidate.key === 'preferences.workCity')).toBe(false);
  });

  it('renders canonical choices and preserves an unrecognized legacy value', () => {
    const profile = structuredClone(EMPTY_PROFILE);
    profile.custom.idType = '中华人民共和国居民身份证';
    profile.preferences.applicationType = '内部批次';
    const container = document.createElement('div');
    renderBasicEditor(container, profile, 'job');
    expect(container.querySelector<HTMLSelectElement>('[data-basic-key="idType"]')?.value).toBe('居民身份证');
    renderBasicEditor(container, profile, 'academic');
    const applicationType = container.querySelector<HTMLSelectElement>('[data-basic-key="applicationType"]')!;
    expect(applicationType.value).toBe('内部批次');
    expect(applicationType.selectedOptions[0]?.text).toBe('原值：内部批次');
  });

  it('offers Chinese matching labels and masks added contact details', () => {
    const profile = structuredClone(EMPTY_PROFILE);
    profile.custom = { referencePhone: '示例电话', idType: '护照', currentCity: '上海' };
    profile.preferences = { daysPerWeek: '4天', department: '技术部' };
    const candidates = flattenProfile(profile);
    expect(candidates.find(c => c.key === 'custom.referencePhone')?.sensitive).toBe(true);
    expect(candidates.find(c => c.key === 'preferences.department')?.label).toBe('意向部门');
    const fields = ['证件类型', '每周出勤'].map((label, i): FieldDescriptor => ({
      id: String(i), label, kind: 'text', context: '', required: false, existingValue: '', options: [], occurrence: 0
    }));
    expect(matchFields(fields, candidates).map(m => [m.status, m.candidateKey])).toEqual([
      ['matched', 'custom.idType'], ['matched', 'preferences.daysPerWeek']
    ]);
  });
});
