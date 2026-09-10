import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../samples/campus-recruitment/', import.meta.url));
const json = name => JSON.parse(readFileSync(join(root, name), 'utf8'));
const kinds = new Set(['text', 'textarea', 'date', 'select', 'radio', 'checkbox', 'combobox', 'custom']);
const pathPattern = /^(personal|preferences|custom)\.[A-Za-z]\w*$|^(education|experience|projects|research|publications|awards)\.\d+\.[A-Za-z]\w*$/;
const forbiddenKeys = /^(existingValue|candidateValue|cookie|cookies|token|accessToken|password|otp|verificationCode|localStorage|sessionStorage)$/i;
function inspect(value, path) {
  if (typeof value === 'string') {
    assert(!/(?<!\d)1[3-9]\d{9}(?!\d)/.test(value), `Possible phone: ${path}`);
    assert(!/(?<!\d)\d{17}[\dXx](?!\d)/.test(value), `Possible ID: ${path}`);
    assert(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value), `Possible email: ${path}`);
    if (value.startsWith('https://')) {
      const url = new URL(value);
      assert(!url.username && !url.password, `URL credentials: ${path}`);
      assert(!/[?&#](token|sid|code|phone|email|auth|ticket)=/i.test(value), `Sensitive URL: ${path}`);
    }
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      assert(!forbiddenKeys.test(key), `Forbidden key: ${path}.${key}`);
      if (key === 'value') assert(/\.options\.\d+$/.test(path), `Unexpected value field: ${path}`);
      inspect(child, `${path}.${key}`);
    }
  }
}
const manifest = json('manifest.json');
const ids = new Set();
let count = 0;
for (const site of manifest.companies) {
  assert(!ids.has(site.companyId), 'Duplicate company'); ids.add(site.companyId);
  if (!site.file) { assert.equal(site.fieldCount, 0); continue; }
  const c = json(site.file);
  const e = json(`evidence/${site.companyId}.json`);
  assert.equal(c.companyId, site.companyId);
  assert.equal(c.status, 'observed_form');
  assert.equal(c.completeness, 'partial');
  assert.equal(c.fields.length, site.fieldCount);
  assert.equal(e.rows.length, c.fields.length);
  assert(c.limitations.length > 0);
  const fieldIds = new Set();
  c.fields.forEach((f, i) => {
    assert(!fieldIds.has(f.id)); fieldIds.add(f.id);
    assert(f.label && f.section && kinds.has(f.kind));
    assert([true, false, null].includes(f.required));
    assert(f.expectedKey === null || pathPattern.test(f.expectedKey));
    assert(f.maxLength === undefined || (Number.isInteger(f.maxLength) && f.maxLength >= 0));
    assert.equal(f.evidence.source, `evidence/${site.companyId}.json`);
    assert.equal(f.evidence.row, i + 1);
    assert.equal(f.label, e.rows[i][1]);
    assert.equal(f.kind, e.rows[i][2]);
    assert.equal(f.required, e.rows[i][3]);
    assert.equal(f.expectedKey, e.rows[i][4] || null);
    for (const o of f.options) {
      assert.equal(o.label, o.value);
      assert.equal(f.optionValueStatus, 'label_only_not_dom_value');
    }
  });
  count += c.fields.length;
}
assert.equal(count, manifest.totals.fields);
assert.equal(ids.size, manifest.totals.targetCompanies);
assert.equal(readdirSync(join(root, 'companies')).filter(n => n.endsWith('.json')).length, manifest.totals.observedCompanies);
function walk(dir = '') {
  for (const item of readdirSync(join(root, dir), { withFileTypes: true })) {
    const name = join(dir, item.name);
    if (item.isDirectory()) walk(name);
    else if (name.endsWith('.json')) inspect(json(name), name);
  }
}
walk();
execFileSync(process.execPath, [fileURLToPath(new URL('./build-campus-samples.mjs', import.meta.url)), '--check'], { stdio: 'inherit' });
console.log(`Validated ${count} fields: structure, evidence, totals, regeneration and common privacy patterns. Manual review is still required.`);
