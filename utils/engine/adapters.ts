import type { FieldDescriptor } from '../types';

export interface SiteAdapter {
  id: string;
  matches(url: URL): boolean;
  enrich(fields: FieldDescriptor[], document: Document): FieldDescriptor[];
}

const genericAdapter: SiteAdapter = {
  id: 'generic',
  matches: () => true,
  enrich: (fields) => fields
};

const adapters: SiteAdapter[] = [
  {
    id: 'beisen',
    matches: (url) => /beisen|italent/i.test(url.hostname),
    enrich: (fields) => fields.map((field) => ({ ...field, context: `${field.context} 北森招聘系统` }))
  },
  {
    id: 'moka',
    matches: (url) => /mokahr/i.test(url.hostname),
    enrich: (fields) => fields.map((field) => ({ ...field, context: `${field.context} Moka招聘系统` }))
  },
  genericAdapter
];

export function getSiteAdapter(url: URL): SiteAdapter {
  return adapters.find((adapter) => adapter.matches(url)) ?? genericAdapter;
}

export function registerSiteAdapter(adapter: SiteAdapter): void {
  adapters.unshift(adapter);
}
