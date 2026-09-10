import type { FieldDescriptor, FieldOption, Primitive } from '../types';
import { normalizeText } from './text';
import { choiceMatchScore } from '../choices';

export function chooseOption(options: FieldOption[], raw: string): FieldOption | undefined {
  const best = options.map((option) => ({
    option,
    score: Math.max(choiceMatchScore(option.label, raw), choiceMatchScore(option.value, raw))
  })).sort((a, b) => b.score - a.score)[0];
  return best && best.score >= 0.7 ? best.option : undefined;
}

export function normalizeFillValue(field: FieldDescriptor, value: Primitive): string {
  let raw = String(value).trim();
  const semantic = normalizeText(`${field.label} ${field.name ?? ''}`);
  if (/手机|电话|phone|mobile|tel/.test(semantic)) raw = raw.replace(/[\s()-]/g, '');
  if (/身份证|证件号|idnumber/.test(semantic)) raw = raw.replace(/\s/g, '').toUpperCase();
  if (field.kind === 'date') {
    const match = raw.replace(/[年/.]/g, '-').replace(/月/g, '-').replace(/日/g, '').match(/(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
    if (match) {
      const [, year, month = '1', day = '1'] = match;
      raw = field.inputType === 'month' ? `${year}-${month.padStart(2, '0')}` : `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return raw;
}

export function looksLikeValue(field: FieldDescriptor, value: Primitive): boolean {
  const raw = String(value).trim();
  if (field.maxLength && raw.length > field.maxLength) return false;
  if (field.pattern) { try { if (!new RegExp(`^(?:${field.pattern})$`, 'u').test(raw)) return false; } catch { /* invalid site patterns are ignored */ } }
  const semantic = normalizeText(`${field.label} ${field.name ?? ''}`);
  if (/邮箱|email/.test(semantic)) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
  if (/手机|手机号|mobile/.test(semantic)) return /^\+?\d{7,15}$/.test(raw.replace(/[\s()-]/g, ''));
  if (/身份证|idnumber/.test(semantic)) return /^(\d{15}|\d{17}[\dXx])$/.test(raw.replace(/\s/g, ''));
  return true;
}
