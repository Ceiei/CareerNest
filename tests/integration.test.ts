import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { scanDocument } from '../utils/engine/scanner';
import { matchFields } from '../utils/engine/matcher';
import { fillField } from '../utils/engine/filler';
import { EMPTY_PROFILE, flattenProfile, mergeProfile } from '../utils/profile';
import { calculateMetrics } from '../utils/metrics';

beforeEach(() => {
  const html = readFileSync('test-pages/university-form.html', 'utf8');
  document.documentElement.innerHTML = html;
  Object.defineProperty(globalThis, 'CSS', { value: { escape: (value: string) => value }, configurable: true });
});

describe('university application flow', () => {
  it('fills the distributed demo page with distinct education level and academic degree', async () => {
    document.documentElement.innerHTML = readFileSync('local_service/static/demo-form.html', 'utf8');
    const profile = mergeProfile(structuredClone(EMPTY_PROFILE), {
      personal: { ...EMPTY_PROFILE.personal, fullName: '演练同学', phone: '138-0000-0000', email: 'demo@example.invalid', gender: '女性' },
      education: [{ id: 'edu-demo', school: '示例大学', major: '计算机', degree: '本科', academicDegree: '学士' }],
    });
    const scan = scanDocument(document);
    for (const match of matchFields(scan.fields, flattenProfile(profile))) {
      if (match.status !== 'matched' || match.value === undefined) continue;
      const field = scan.fields.find(item => item.id === match.fieldId)!;
      await fillField(field, scan.elements.get(field.id)!, match.value!);
    }
    expect((document.querySelector('[name="fullName"]') as HTMLInputElement).value).toBe('演练同学');
    expect((document.querySelector('[name="school"]') as HTMLInputElement).value).toBe('示例大学');
    expect((document.querySelector('[name="degree"]') as HTMLSelectElement).value).toBe('本科');
    expect((document.querySelector('[name="academicDegree"]') as HTMLSelectElement).value).toBe('学士学位');
    expect(document.querySelector('[type="submit"]')).toBeNull();
  });
  it('scans, matches and fills a representative form without submitting', async () => {
    const profile = mergeProfile(structuredClone(EMPTY_PROFILE), {
      personal: { ...EMPTY_PROFILE.personal, fullName: '测试同学', phone: '138-0000-0000', email: 'student@example.com', birthDate: '2003年5月6日', gender: '女性', politicalStatus: '共青团员' },
      education: [{ id: 'edu-1', school: '示例大学', major: '计算机科学', degree: '硕士', gpa: '3.8', ranking: '5/120' }],
      research: [{ id: 'research-1', researchTopic: '可信人工智能' }],
      preferences: { 是否服从调剂: '是' }
    });
    const scan = scanDocument(document);
    const matches = matchFields(scan.fields, flattenProfile(profile));
    const expectedByLabel: Record<string, string> = {
      真实姓名: 'personal.fullName', 联系电话: 'personal.phone', 电子邮箱: 'personal.email', 出生日期: 'personal.birthDate',
      性别: 'personal.gender', 政治面貌: 'personal.politicalStatus', 是否服从调剂: 'preferences.是否服从调剂',
      毕业院校: 'education.0.school', 主修专业: 'education.0.major', 最高学历: 'education.0.degree',
      平均绩点: 'education.0.gpa', 专业排名: 'education.0.ranking', 研究方向: 'research.0.researchTopic'
    };
    const evaluation = scan.fields.flatMap((field) => {
      const expected = Object.entries(expectedByLabel).find(([label]) => field.label.includes(label));
      if (!expected) return [];
      return [{ answerable: true, expectedKey: expected[1], predictedKey: matches.find((match) => match.fieldId === field.id)?.candidateKey }];
    });
    const metrics = calculateMetrics(evaluation);
    expect(metrics.accuracy).toBeGreaterThanOrEqual(0.9);
    expect(metrics.coverage).toBeGreaterThanOrEqual(0.8);

    for (const match of matches.filter((item) => item.status === 'matched' && item.value !== undefined)) {
      const field = scan.fields.find((item) => item.id === match.fieldId)!;
      await fillField(field, scan.elements.get(field.id)!, match.value!);
    }
    expect((document.querySelector('#full-name') as HTMLInputElement).value).toBe('测试同学');
    expect((document.querySelector('[name="mobile"]') as HTMLInputElement).value).toBe('13800000000');
    expect((document.querySelector('[name="degree"]') as HTMLSelectElement).value).toBe('master');
    expect((document.querySelector('[name="application_id"]') as HTMLInputElement).value).toBe('EXISTING-001');
    expect(document.querySelector('form')?.dataset.submitted).toBeUndefined();
  });
});
