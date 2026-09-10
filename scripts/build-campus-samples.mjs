import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../samples/campus-recruitment/', import.meta.url));
const check = process.argv.includes('--check');
const generated = [];
function emit(name, data) {
  const output = JSON.stringify(data, null, 2) + '\n';
  if (check) {
    if (readFileSync(join(root, name), 'utf8') !== output) throw new Error(`Stale generated file: ${name}`);
  } else writeFileSync(join(root, name), output);
}
// Input is a compact, manually reviewed transcription of DOM labels/attributes.
// Never feed full pages or candidate data into this script.
for (const name of readdirSync(join(root, 'evidence')).filter(n => n.endsWith('.json')).sort()) {
  const source = JSON.parse(readFileSync(join(root, 'evidence', name), 'utf8'));
  const counts = new Map();
  const fields = source.rows.map((row, i) => {
    const [section, label, kind, required, key, maxLength = null, notes = '', options = []] = row;
    const signature = `${section}:${label}`;
    const occurrence = counts.get(signature) ?? 0;
    counts.set(signature, occurrence + 1);
    return {
      id: `${source.companyId}-${String(i + 1).padStart(3, '0')}`,
      section, label, kind, required, occurrence, context: section,
      options: options.map(label => ({ label, value: label })),
      optionValueStatus: options.length ? 'label_only_not_dom_value' : 'not_observed',
      optionsStatus: ['combobox', 'select', 'radio'].includes(kind) ? (options.length ? 'observed_labels' : 'not_observed') : 'not_applicable',
      ...(maxLength === null ? {} : { maxLength }),
      expectedKey: key || null,
      mappingStatus: !key ? 'manual_or_unmapped' : key.startsWith('custom.') ? 'custom_proposed' : 'annotated',
      answerable: Boolean(key), requiresGeneration: false,
      evidence: { source: `evidence/${name}`, row: i + 1, method: 'live_dom_metadata_transcription' },
      notes
    };
  });
  const { rows, ...metadata } = source;
  const company = { schemaVersion: 1, scenario: 'campus_recruitment', ...metadata, fields };
  generated.push(company);
  emit(`companies/${name}`, company);
}

const blocked = JSON.parse(readFileSync(join(root, 'pending-sites.json'), 'utf8'));
const companies = generated.map(c => ({
  companyId: c.companyId, company: c.company, status: c.status,
  completeness: c.completeness, loginStatus: 'authenticated_at_capture',
  capturedAt: c.capturedAt, entryUrl: c.entryUrl, formUrl: c.url,
  file: `companies/${c.companyId}.json`, fieldCount: c.fields.length,
  unknownRequiredCount: c.fields.filter(f => f.required === null).length,
  unobservedOptionsCount: c.fields.filter(f => f.optionsStatus === 'not_observed').length,
  captureScope: c.captureScope
}));
const total = companies.reduce((n, c) => n + c.fieldCount, 0);
emit('manifest.json', {
  schemaVersion: 1, scenario: 'campus_recruitment',
  updatedAt: [...generated.map(c => c.capturedAt), ...blocked.map(c => c.checkedAt)].sort().at(-1),
  totals: { targetCompanies: companies.length + blocked.length, observedCompanies: companies.length, fields: total, pendingCompanies: blocked.length },
  companies: [...companies, ...blocked]
});
const keys = new Map();
for (const c of generated) for (const f of c.fields) {
  if (!f.expectedKey) continue;
  const path = f.expectedKey.replace(/\.\d+\./g, '.*.');
  if (!keys.has(path)) keys.set(path, { path, labels: new Set(), kinds: new Set(), sources: [] });
  const k = keys.get(path);
  k.labels.add(f.label); k.kinds.add(f.kind);
  k.sources.push({ companyId: c.companyId, fieldId: f.id });
}
emit('field-catalog.json', {
  schemaVersion: 1, purpose: '人工标注的资料路径目录；不含资料值，不是可导入的个人简历，也不证明自动填写成功',
  fields: [...keys.values()].sort((a,b) => a.path.localeCompare(b.path, 'en')).map(k => ({...k, labels: [...k.labels].sort(), kinds: [...k.kinds].sort()}))
});
console.log(`${check ? 'Checked' : 'Generated'} ${companies.length} companies, ${total} field observations.`);
