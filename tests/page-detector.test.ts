import { describe, it, expect } from 'vitest';
import { detectPage } from '../utils/page-detector';

describe('page draft extraction', () => {
  it('extracts a readable JD without input values or forms', () => {
    document.body.innerHTML='<main><h1>算法实习</h1><p>任职要求：熟悉 Python</p><input value="secret"><form><p>Private profile</p></form></main>';
    const page=detectPage(document);
    expect(page.kind).toBe('job');
    expect(page.title).toBe('算法实习');
    expect(page.description).toContain('熟悉 Python');
    expect(page.description).not.toContain('secret');
    expect(page.description).not.toContain('Private profile');
  });
  it('recognizes upload pages without uploading anything', () => {
    document.body.innerHTML='<input type="file">';
    expect(detectPage(document).kind).toBe('upload');
  });
});
