import { describe, expect, it, vi } from 'vitest';
import { fillField } from '../utils/engine/filler';
import type { FieldDescriptor } from '../utils/types';

const descriptor = (overrides: Partial<FieldDescriptor>): FieldDescriptor => ({
  id: 'f1', kind: 'text', label: '姓名', context: '', required: false,
  existingValue: '', options: [], occurrence: 0, ...overrides
});

describe('fillField', () => {
  it('uses native setters and emits input/change events', async () => {
    const input = document.createElement('input');
    const onInput = vi.fn(); input.addEventListener('input', onInput);
    const result = await fillField(descriptor({}), [input], '张三');
    expect(result.ok).toBe(true);
    expect(input.value).toBe('张三');
    expect(onInput).toHaveBeenCalledOnce();
  });

  it('normalizes dates', async () => {
    const input = document.createElement('input'); input.type = 'date';
    await fillField(descriptor({ kind: 'date', inputType: 'date' }), [input], '2026年9月7日');
    expect(input.value).toBe('2026-09-07');
  });

  it('selects an option by visible text', async () => {
    const select = document.createElement('select');
    select.add(new Option('请选择', '')); select.add(new Option('硕士研究生', 'master'));
    const result = await fillField(descriptor({ kind: 'select', options: [{ label: '请选择', value: '' }, { label: '硕士研究生', value: 'master' }] }), [select], '硕士研究生');
    expect(result.ok).toBe(true); expect(select.value).toBe('master');
  });

  it('refuses to overwrite a non-empty field', async () => {
    const input = document.createElement('input'); input.value = '原内容';
    const result = await fillField(descriptor({ existingValue: '原内容' }), [input], '新内容');
    expect(result.ok).toBe(false); expect(input.value).toBe('原内容');
  });
});
