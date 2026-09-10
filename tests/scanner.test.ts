import { beforeEach, describe, expect, it } from 'vitest';
import { scanDocument } from '../utils/engine/scanner';

beforeEach(() => {
  document.body.innerHTML = '';
  Object.defineProperty(globalThis, 'CSS', { value: { escape: (value: string) => value }, configurable: true });
});

describe('scanDocument', () => {
  it('extracts labels, metadata and select options', () => {
    document.body.innerHTML = `
      <section><h2>基本信息</h2>
        <label for="candidate-name">真实姓名</label><input id="candidate-name" autocomplete="name" required>
        <label>最高学历<select name="degree"><option value="">请选择</option><option value="master">硕士</option></select></label>
      </section>`;
    const { fields, elements } = scanDocument(document);
    expect(fields).toHaveLength(2);
    expect(fields[0]).toMatchObject({ label: expect.stringContaining('真实姓名'), autocomplete: 'name', required: true });
    expect(fields[1]?.options[1]).toEqual({ value: 'master', label: '硕士' });
    expect(elements.get(fields[0]!.id)).toHaveLength(1);
  });

  it('groups radio inputs with the same name', () => {
    document.body.innerHTML = `
      <label><input type="radio" name="gender" value="M">男</label>
      <label><input type="radio" name="gender" value="F">女</label>`;
    const { fields, elements } = scanDocument(document);
    expect(fields).toHaveLength(1);
    expect(fields[0]?.kind).toBe('radio');
    expect(fields[0]?.options).toHaveLength(2);
    expect(elements.get(fields[0]!.id)).toHaveLength(2);
  });

  it('tracks repeated field occurrence order', () => {
    document.body.innerHTML = '<input name="school"><input name="school">';
    const { fields } = scanDocument(document);
    expect(fields.map((item) => item.occurrence)).toEqual([0, 1]);
  });

  it('scans contenteditable textboxes and constraints', () => {
    document.body.innerHTML = '<label>补充说明<div contenteditable="true" role="textbox" aria-label="补充说明"></div></label><input name="bio" maxlength="20" pattern=".+">';
    const { fields } = scanDocument(document);
    expect(fields[0]?.kind).toBe('textarea');
    expect(fields[1]).toMatchObject({ maxLength: 20, pattern: '.+' });
  });
});
