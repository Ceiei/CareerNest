import { BASIC_GROUPS } from './basic-fields';
import type { PersonProfile } from './types';
import type { WorkspaceMode } from './types';
import { canonicalChoiceValue, choiceKeyForPath, choices } from './choices';

export function renderBasicEditor(container: HTMLElement, profile: PersonProfile, mode: WorkspaceMode): void {
  container.replaceChildren();
  for (const group of BASIC_GROUPS) {
    const section = document.createElement('section');
    const title = document.createElement('h3'); title.textContent = group.title;
    const grid = document.createElement('div'); grid.className = 'record-fields';
    const fields = group.fields.filter(field => !field.modes || field.modes.includes(mode));
    if (!fields.length) continue;
    for (const field of fields) {
      const label = document.createElement('label'); label.textContent = field.label;
      const choiceKey = choiceKeyForPath(`${group.root}.${field.key}`);
      const input = choiceKey ? document.createElement('select') : field.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      if (input instanceof HTMLInputElement) input.type = field.type ?? 'text';
      else if (input instanceof HTMLTextAreaElement) { input.rows = 3; label.className = 'textarea-field'; }
      else {
        input.add(new Option('请选择', '')); choices(choiceKey!).forEach(option => input.add(new Option(option.label, option.value)));
        const current = String(profile[group.root][field.key] ?? '');
        const canonical = canonicalChoiceValue(choiceKey!, current);
        if (current && !canonical) input.add(new Option(`原值：${current}`, current));
      }
      input.dataset.basicRoot = group.root; input.dataset.basicKey = field.key;
      const current = String(profile[group.root][field.key] ?? '');
      input.value = choiceKey ? (canonicalChoiceValue(choiceKey, current) ?? current) : current;
      if (field.hint && !(input instanceof HTMLSelectElement)) input.placeholder = field.hint;
      label.append(input); grid.append(label);
    }
    section.append(title, grid); container.append(section);
  }
}

export function collectBasicEditor(container: HTMLElement, profile: PersonProfile): void {
  container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('[data-basic-key]').forEach(input => {
    const root = input.dataset.basicRoot as 'custom' | 'preferences';
    const key = input.dataset.basicKey!;
    if (input.value.trim()) profile[root][key] = input.value.trim();
    else delete profile[root][key];
  });
}
