export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\s\-_—–:：,，.。/\\()[\]（）【】*]/g, '');
}

export function textTokens(value: string): string[] {
  const normalized = value.toLowerCase().normalize('NFKC');
  const latin = normalized.match(/[a-z0-9]+/g) ?? [];
  const chinese = normalized.match(/[\u3400-\u9fff]{2,}/g) ?? [];
  return [...new Set([...latin, ...chinese])];
}

export function similarity(a: string, b: string): number {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.84;
  const aSet = new Set(textTokens(a));
  const bSet = new Set(textTokens(b));
  const intersection = [...aSet].filter((token) => bSet.has(token)).length;
  const union = new Set([...aSet, ...bSet]).size;
  return union ? intersection / union : 0;
}

export function maskValue(value: string): string {
  if (value.length <= 2) return '*'.repeat(value.length);
  if (value.includes('@')) {
    const [name = '', domain = ''] = value.split('@');
    return `${name.slice(0, 1)}***@${domain}`;
  }
  return `${value.slice(0, 2)}${'*'.repeat(Math.min(8, value.length - 2))}`;
}
