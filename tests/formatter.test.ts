import { describe, expect, it } from 'vitest';
import { chooseOption, looksLikeValue, normalizeFillValue } from '../utils/engine/formatter';
import type { FieldDescriptor } from '../utils/types';

const field = (overrides: Partial<FieldDescriptor>): FieldDescriptor => ({ id: 'f', kind: 'text', label: '', context: '', required: false, existingValue: '', options: [], occurrence: 0, ...overrides });

describe('field formatting', () => {
  it('normalizes phone and date values', () => {
    expect(normalizeFillValue(field({ label: '手机号码' }), '138-0000-0000')).toBe('13800000000');
    expect(normalizeFillValue(field({ kind: 'date', inputType: 'date' }), '2026年9月8日')).toBe('2026-09-08');
  });

  it('maps equivalent degree choices', () => {
    expect(chooseOption([{ label: '硕士研究生', value: 'master' }], '硕士')?.value).toBe('master');
    expect(chooseOption([{ label: 'Bachelor of Engineering', value: 'BEng' }], '学士')?.value).toBe('BEng');
    expect(chooseOption([{ label: '大学本科', value: 'undergraduate' }], '本科')?.value).toBe('undergraduate');
    expect(chooseOption([{ label: '学士学位', value: 'bachelor' }], '本科')).toBeUndefined();
  });

  it('rejects invalid high-risk formats', () => {
    expect(looksLikeValue(field({ label: '电子邮箱' }), 'not-an-email')).toBe(false);
  });
});
