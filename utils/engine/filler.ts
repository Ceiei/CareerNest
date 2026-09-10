import type { FieldDescriptor, FillResult, Primitive } from '../types';
import { chooseOption, looksLikeValue, normalizeFillValue } from './formatter';
import { choiceMatchScore } from '../choices';

type FillableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement;
const isInput = (element: HTMLElement): element is HTMLInputElement => element.tagName === 'INPUT';
const isTextarea = (element: HTMLElement): element is HTMLTextAreaElement => element.tagName === 'TEXTAREA';
const isSelect = (element: HTMLElement): element is HTMLSelectElement => element.tagName === 'SELECT';

function dispatch(element: HTMLElement): void {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const view = element.ownerDocument.defaultView;
  const prototype = isTextarea(element) ? view?.HTMLTextAreaElement.prototype : view?.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  setter?.call(element, value);
  dispatch(element);
}

async function fillCustomCombobox(element: HTMLElement, raw: string): Promise<boolean> {
  element.click();
  await new Promise((resolve) => setTimeout(resolve, 80));
  const documentRef = element.ownerDocument;
  const options = [...documentRef.querySelectorAll<HTMLElement>('[role="option"], .ant-select-item-option, .el-select-dropdown__item, [data-value]')]
    .filter((item) => documentRef.defaultView?.getComputedStyle(item).display !== 'none');
  const best = options
    .map((option) => ({ option, score: choiceMatchScore(option.textContent ?? '', raw) }))
    .sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < 0.7) return false;
  best.option.click();
  return true;
}

export async function fillField(
  field: FieldDescriptor,
  elements: FillableElement[],
  value: Primitive,
  overwrite = false
): Promise<FillResult> {
  const raw = normalizeFillValue(field, value);
  if (!elements.length) return { fieldId: field.id, ok: false, reason: '字段已经离开页面' };
  if (field.existingValue && !overwrite) return { fieldId: field.id, ok: false, reason: '跳过已有内容' };
  const first = elements[0]!;
  try {
    if (isInput(first) && !['radio', 'checkbox'].includes(first.type)) {
      if (!looksLikeValue(field, raw)) return { fieldId: field.id, ok: false, reason: '资料值格式与字段不匹配' };
      if (field.maxLength && raw.length > field.maxLength) return { fieldId: field.id, ok: false, reason: `内容超过 ${field.maxLength} 字限制` };
      setNativeValue(first, raw);
    } else if (isTextarea(first)) {
      setNativeValue(first, raw);
    } else if (isSelect(first)) {
      const option = chooseOption(field.options, raw);
      if (!option) return { fieldId: field.id, ok: false, reason: `找不到选项“${raw}”` };
      first.value = option.value;
      dispatch(first);
    } else if (field.kind === 'radio' || field.kind === 'checkbox') {
      if (field.kind === 'checkbox' && elements.length === 1 && typeof value === 'boolean') {
        const checkbox = first as HTMLInputElement;
        if (checkbox.checked !== value) checkbox.click();
        dispatch(checkbox);
        return { fieldId: field.id, ok: true };
      }
      const option = chooseOption(field.options, raw);
      const index = option ? field.options.indexOf(option) : -1;
      const target = elements[index] as HTMLInputElement | undefined;
      if (!target) return { fieldId: field.id, ok: false, reason: `找不到选项“${raw}”` };
      target.click();
      dispatch(target);
    } else if (field.kind === 'textarea' && (first.isContentEditable || first.getAttribute('role') === 'textbox')) {
      first.focus(); first.textContent = raw; dispatch(first);
    } else if (field.kind === 'combobox') {
      if (!(await fillCustomCombobox(first, raw))) return { fieldId: field.id, ok: false, reason: `找不到自定义选项“${raw}”` };
    } else {
      return { fieldId: field.id, ok: false, reason: '不支持的控件' };
    }
    return { fieldId: field.id, ok: true };
  } catch (error) {
    return { fieldId: field.id, ok: false, reason: error instanceof Error ? error.message : '填写失败' };
  }
}
