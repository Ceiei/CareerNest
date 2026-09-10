import type { FieldDescriptor, FieldKind, FieldOption } from '../types';
import { getSiteAdapter } from './adapters';
import { normalizeText } from './text';

type FillableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement;
const isInput = (element: HTMLElement): element is HTMLInputElement => element.tagName === 'INPUT';
const isTextarea = (element: HTMLElement): element is HTMLTextAreaElement => element.tagName === 'TEXTAREA';
const isSelect = (element: HTMLElement): element is HTMLSelectElement => element.tagName === 'SELECT';

function visible(element: HTMLElement): boolean {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style?.display !== 'none' && style?.visibility !== 'hidden' && style?.opacity !== '0' && !element.hasAttribute('disabled') && rect.width >= 0 && rect.height >= 0;
}

function labelText(element: HTMLElement): string {
  const parts: string[] = [];
  const documentRef = element.ownerDocument;
  const id = element.id;
  if (id) documentRef.querySelectorAll(`label[for="${CSS.escape(id)}"]`).forEach((label) => parts.push(label.textContent ?? ''));
  const wrapping = element.closest('label');
  if (wrapping) parts.push(wrapping.textContent ?? '');
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) labelledBy.split(/\s+/).forEach((labelId) => parts.push(documentRef.getElementById(labelId)?.textContent ?? ''));
  parts.push(element.getAttribute('aria-label') ?? '');
  parts.push(element.getAttribute('placeholder') ?? '');
  parts.push(element.getAttribute('name') ?? '');
  parts.push(id);
  const nearby = element.closest('.form-item, .ant-form-item, .el-form-item, [class*="formItem"], [class*="field"]');
  if (nearby) parts.push(nearby.querySelector('label, [class*="label"]')?.textContent ?? '');
  return [...new Set(parts.map((part) => part.trim()).filter(Boolean))].join(' / ').slice(0, 300);
}

function contextText(element: HTMLElement): string {
  const section = element.closest('fieldset, section, article, .form-section, [class*="section"], [class*="experience"], [class*="education"]');
  const heading = section?.querySelector('legend, h1, h2, h3, h4, [class*="title"]')?.textContent ?? '';
  return heading.trim().slice(0, 160);
}

function kindOf(element: HTMLElement): FieldKind | null {
  if (isTextarea(element) || element.isContentEditable || element.getAttribute('role') === 'textbox') return 'textarea';
  if (isSelect(element)) return 'select';
  if (isInput(element)) {
    if (['hidden', 'submit', 'button', 'reset', 'file', 'image'].includes(element.type)) return null;
    if (element.type === 'radio') return 'radio';
    if (element.type === 'checkbox') return 'checkbox';
    if (['date', 'month', 'datetime-local'].includes(element.type)) return 'date';
    return 'text';
  }
  if (element.getAttribute('role') === 'combobox' || element.getAttribute('aria-haspopup') === 'listbox') return 'combobox';
  return null;
}

function optionsOf(elements: FillableElement[], kind: FieldKind): FieldOption[] {
  if (kind === 'select') {
    return [...(elements[0] as HTMLSelectElement).options]
      .filter((option) => !option.disabled)
      .map((option) => ({ value: option.value, label: option.text.trim() }));
  }
  if (kind === 'radio' || kind === 'checkbox') {
    return elements.map((item) => ({ value: (item as HTMLInputElement).value, label: labelText(item) }));
  }
  return [];
}

function currentValue(element: FillableElement, kind: FieldKind): string {
  if (isInput(element)) {
    if (kind === 'radio' || kind === 'checkbox') return element.checked ? element.value : '';
    return element.value;
  }
  if (isTextarea(element) || isSelect(element)) return element.value;
  return element.textContent?.trim() ?? '';
}

export interface ScanOutput {
  fields: FieldDescriptor[];
  elements: Map<string, FillableElement[]>;
}

export function scanDocument(documentRef: Document = document): ScanOutput {
  const selector = 'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"], [aria-haspopup="listbox"]';
  const roots: Array<Document | ShadowRoot> = [documentRef];
  documentRef.querySelectorAll<HTMLIFrameElement>('iframe').forEach((frame) => { try { if (frame.contentDocument) roots.push(frame.contentDocument); } catch { /* cross-origin frames are inaccessible */ } });
  const discoverShadows = (root: Document | ShadowRoot) => root.querySelectorAll<HTMLElement>('*').forEach((node) => { if (node.shadowRoot) { roots.push(node.shadowRoot); discoverShadows(node.shadowRoot); } });
  roots.slice().forEach(discoverShadows);
  const raw = roots.flatMap((root) => [...root.querySelectorAll<HTMLElement>(selector)])
    .filter(visible);
  const consumed = new Set<HTMLElement>();
  const elements = new Map<string, FillableElement[]>();
  const fields: FieldDescriptor[] = [];
  let index = 0;

  for (const element of raw) {
    if (consumed.has(element)) continue;
    const kind = kindOf(element);
    if (!kind) continue;
    let group: FillableElement[] = [element];
    if ((kind === 'radio' || kind === 'checkbox') && isInput(element) && element.name) {
      group = raw.filter((candidate) => isInput(candidate) && candidate.type === element.type && candidate.name === element.name && candidate.closest('form') === element.closest('form'));
    }
    group.forEach((item) => consumed.add(item));
    const id = `field-${index++}`;
    elements.set(id, group);
    const existing = group.map((item) => currentValue(item, kind)).filter(Boolean).join(', ');
    fields.push({
      id,
      kind,
      inputType: isInput(element) ? element.type : undefined,
      label: labelText(element) || `未命名字段 ${index}`,
      context: contextText(element),
      name: element.getAttribute('name') ?? undefined,
      autocomplete: element.getAttribute('autocomplete') ?? undefined,
      required: element.hasAttribute('required') || element.getAttribute('aria-required') === 'true',
      existingValue: existing,
      options: optionsOf(group, kind),
      occurrence: 0,
      selectorHint: element.id ? `#${element.id}` : element.getAttribute('name') ? `[name="${element.getAttribute('name')}"]` : element.tagName.toLowerCase(),
      maxLength: isInput(element) || isTextarea(element) ? (element.maxLength > 0 ? element.maxLength : undefined) : undefined,
      pattern: isInput(element) ? element.pattern || undefined : undefined
    });
  }

  const occurrences = new Map<string, number>();
  fields.forEach((field) => {
    const key = normalizeText(field.label.split('/')[0] ?? field.label);
    field.occurrence = occurrences.get(key) ?? 0;
    occurrences.set(key, field.occurrence + 1);
  });
  const adapter = getSiteAdapter(new URL(documentRef.location.href));
  return { fields: adapter.enrich(fields, documentRef), elements };
}
