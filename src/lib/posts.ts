import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
const TZ = 'Europe/Istanbul';

// The daily n8n teasers carry the "News" category; everything else is a real article.
export const isRadar = (p: Post) => p.data.categories.includes('News');
export const isArticle = (p: Post) => !isRadar(p);

// Posts dated in the future stay hidden until a build runs on or after that date
// (the Pages workflow rebuilds every Sunday 09:00 TRT, and n8n's daily commit rebuilds too).
export async function allPosts() {
  const now = Date.now();
  return (await getCollection('posts', p => p.data.date.getTime() <= now))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// Jekyll's default slugify: lowercase, every run of non-alphanumerics becomes one "-".
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const ymd = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ });
export const year = (d: Date) => ymd(d).slice(0, 4);
export const longDate = (d: Date) => d.toLocaleDateString('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
export const shortDate = (d: Date) => d.toLocaleDateString('en-GB', { timeZone: TZ, day: 'numeric', month: 'short' });

export const readMinutes = (p: Post) => Math.max(1, Math.round((p.body ?? '').split(/\s+/).length / 200));

const plain = (md: string) => md
  .replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\{:[^}]*\}/g, ' ').replace(/^>\s?/gm, '').replace(/^#+\s.*$/gm, ' ').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();

export function summary(p: Post, max = 180) {
  const s = p.data.description ?? plain(p.body ?? '');
  return s.length > max ? s.slice(0, s.lastIndexOf(' ', max)) + '…' : s;
}

// Radar items: area = the teaser's own category; source = the last markdown link in the body.
export const area = (p: Post) => p.data.categories.find(c => c !== 'News') ?? 'Azure';
export function source(p: Post) {
  const links = [...(p.body ?? '').matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)];
  const url = links.at(-1)?.[1];
  if (!url) return null;
  const u = new URL(url);
  const id = u.searchParams.get('id');
  return { url, label: u.hostname === 'azure.microsoft.com' && id ? `Azure update ${id}` : u.hostname.replace(/^www\./, '') };
}
// ponytail: title heuristic; the teaser skill could write a status field if this misfires.
export const status = (p: Post) =>
  /\bpreview\b/i.test(p.data.title) ? 'Preview' : /\b(GA|general availability|generally available)\b/i.test(p.data.title) ? 'GA' : '';

export function groupBy<T>(items: T[], key: (t: T) => string) {
  const m = new Map<string, T[]>();
  for (const it of items) { const k = key(it); m.set(k, [...(m.get(k) ?? []), it]); }
  return [...m.entries()];
}

export function counts(values: string[]) {
  return groupBy(values, v => v).map(([k, v]) => [k, v.length] as const).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
