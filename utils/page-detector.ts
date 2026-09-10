export interface PageContext {
  kind: 'job' | 'application' | 'upload' | 'page';
  title: string;
  description: string;
  url: string;
  method: 'visible_dom';
}

export function detectPage(doc: Document = document): PageContext {
  // Read public page prose only; input values are never read for a JD draft.
  const scope = doc.querySelector('main,article,[role="main"]') ?? doc.body;
  const copy = scope.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('input,textarea,select,script,style,nav,header,footer,form,[contenteditable]').forEach(node => node.remove());
  const text = (copy.textContent ?? '').replace(/[\t ]+/g, ' ').replace(/\n\s*\n/g, '\n').trim().slice(0, 30000);
  const count = doc.querySelectorAll('input:not([type=hidden]),textarea,select').length;
  const upload = Boolean(doc.querySelector('input[type=file]'));
  return {kind: upload ? 'upload' : count >= 4 ? 'application' : /岗位职责|任职要求|职位描述|申请条件|job description|requirements|qualifications/i.test(text) ? 'job' : 'page',
    title: (doc.querySelector('h1')?.textContent ?? doc.title).trim(), description: text,
    url: doc.location?.href ?? '', method: 'visible_dom'};
}
