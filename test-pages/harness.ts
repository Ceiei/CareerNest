import { scanDocument } from '../utils/engine/scanner';
import { matchFields } from '../utils/engine/matcher';
import { fillField } from '../utils/engine/filler';
import { EMPTY_PROFILE, flattenProfile, mergeProfile } from '../utils/profile';
import { calculateMetrics } from '../utils/metrics';

const profile = mergeProfile(structuredClone(EMPTY_PROFILE), {
  personal: { ...EMPTY_PROFILE.personal, fullName: '测试同学', phone: '138-0000-0000', email: 'student@example.com', birthDate: '2003-05-06', gender: '女性', politicalStatus: '共青团员' },
  education: [{ id: 'edu-demo', school: '示例大学', major: '计算机科学', degree: '硕士', gpa: '3.8', ranking: '5/120' }],
  research: [{ id: 'research-demo', researchTopic: '可信人工智能' }],
  preferences: { 是否服从调剂: '是' }
});

document.querySelector('#engine-run')?.addEventListener('click', async () => {
  const scan = scanDocument(document); const matches = matchFields(scan.fields, flattenProfile(profile));
  const results: Array<{ fieldId: string; ok: boolean; reason?: string; label?: string; candidateKey?: string; value?: unknown }> = [];
  for (const match of matches.filter((item) => item.status === 'matched' && item.value !== undefined)) {
    const field = scan.fields.find((item) => item.id === match.fieldId)!;
    results.push({ ...(await fillField(field, scan.elements.get(field.id)!, match.value!)), label: field.label, candidateKey: match.candidateKey, value: match.value });
  }
  const answerable = matches.filter((item) => item.status !== 'existing' && item.candidateKey);
  const metrics = calculateMetrics(answerable.map((item) => ({ answerable: true, expectedKey: item.candidateKey, predictedKey: item.candidateKey })));
  const result = document.querySelector('#result');
  if (result) result.textContent = JSON.stringify({ scanned: scan.fields.length, matched: answerable.length, filled: results.filter((item) => item.ok).length, coverage: metrics.coverage, existingPreserved: (document.querySelector('[name="application_id"]') as HTMLInputElement).value, results }, null, 2);
});
