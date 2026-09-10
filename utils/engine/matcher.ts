import type { FieldDescriptor, FieldMatch, ProfileCandidate } from '../types';
import { ALIAS_RULES, suffixOf } from './aliases';
import { normalizeText, similarity } from './text';
import { looksLikeValue } from './formatter';
import { choiceMatchScore } from '../choices';

const SECTION_HINTS: Record<string, string[]> = {
  education: ['教育', '学历', '院校', '学校', 'education', 'academic'],
  experience: ['实习', '工作', '任职', 'experience', 'employment'],
  projects: ['项目', 'project'],
  research: ['科研', '研究', 'research'],
  publications: ['论文', '发表', 'publication', 'paper'],
  awards: ['获奖', '荣誉', '竞赛', 'award'],
  preferences: ['求职意向', '申请意向', '志愿', 'preference']
};

function collectionOf(key: string): string {
  return key.split('.')[0] ?? '';
}

function aliasesFor(candidate: ProfileCandidate): string[] {
  const suffix = suffixOf(candidate.key);
  const rule = ALIAS_RULES.find((entry) => entry.suffix === suffix);
  return [...(rule?.aliases ?? []), candidate.label, suffix];
}

function optionCompatibility(field: FieldDescriptor, candidate: ProfileCandidate): number {
  if (!field.options.length) return 0;
  return Math.max(...field.options.map((option) => Math.max(choiceMatchScore(option.label, String(candidate.value)), choiceMatchScore(option.value, String(candidate.value)))));
}

function scoreCandidate(field: FieldDescriptor, candidate: ProfileCandidate): { score: number; reason: string } {
  const haystack = `${field.label} ${field.name ?? ''} ${field.context}`;
  const normalized = normalizeText(haystack);
  let score = 0;
  const reasons: string[] = [];
  const rule = ALIAS_RULES.find((entry) => entry.suffix === suffixOf(candidate.key));

  if (!looksLikeValue(field, candidate.value)) return { score: 0, reason: '资料值格式不符合字段要求' };

  if (field.autocomplete && rule?.autocomplete?.some((token) => field.autocomplete?.startsWith(token))) {
    score += 0.94;
    reasons.push('HTML autocomplete');
  }
  const aliasScore = Math.max(...aliasesFor(candidate).map((alias) => {
    const normalizedAlias = normalizeText(alias);
    if (!normalizedAlias) return 0;
    if (normalized === normalizedAlias) return 0.92;
    if (normalized.includes(normalizedAlias)) return normalizedAlias.length <= 2 ? 0.68 : 0.82;
    return similarity(haystack, alias) * 0.72;
  }));
  if (aliasScore > 0) {
    score += aliasScore;
    reasons.push('标签别名');
  }

  const collection = collectionOf(candidate.key);
  const context = normalizeText(field.context);
  if (SECTION_HINTS[collection]?.some((hint) => context.includes(normalizeText(hint)))) {
    score += 0.1;
    reasons.push('区块上下文');
  }
  if (candidate.recordIndex !== undefined && field.occurrence === candidate.recordIndex) {
    score += 0.06;
    reasons.push('重复项顺序');
  }
  if (field.options.length) {
    const compatibility = optionCompatibility(field, candidate);
    if (compatibility >= 0.84) {
      score += 0.08;
      reasons.push('选项可用');
    } else if (['select', 'radio', 'checkbox'].includes(field.kind)) {
      score -= 0.12;
    }
  }
  if (field.kind === 'date' && candidate.valueType === 'date') score += 0.08;
  return { score: Math.max(0, Math.min(0.99, score)), reason: reasons.join(' + ') || '无明显规则' };
}

export function matchFields(fields: FieldDescriptor[], candidates: ProfileCandidate[]): FieldMatch[] {
  return fields.map((field) => {
    if (field.existingValue) {
      return { fieldId: field.id, confidence: 1, reason: '网页已有内容，默认不覆盖', status: 'existing' };
    }
    const ranked = candidates
      .map((candidate) => ({ candidate, ...scoreCandidate(field, candidate) }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const second = ranked[1];
    if (!best || best.score < 0.58) {
      return { fieldId: field.id, confidence: best?.score ?? 0, reason: '没有达到阈值的本地规则', status: 'unmatched' };
    }
    const ambiguous = second && second.score >= 0.58 && best.score - second.score < 0.08;
    return {
      fieldId: field.id,
      candidateKey: best.candidate.key,
      value: best.candidate.value,
      confidence: best.score,
      reason: best.reason,
      status: ambiguous ? 'ambiguous' : 'matched'
    };
  });
}
