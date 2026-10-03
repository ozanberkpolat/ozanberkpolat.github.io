import { getCollection } from 'astro:content';
import { isArticle, ymd } from '../lib/posts';

// Hand-written articles INCLUDING scheduled ones, for the weekly post pipeline (ops-backend's
// blog article gateway): which topics exist and which Sundays are taken. Titles of scheduled
// posts are already public in the repo, so listing them here leaks nothing new.
export async function GET() {
  const now = Date.now();
  const rows = (await getCollection('posts')).filter(isArticle)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map(p => ({ title: p.data.title, date: ymd(p.data.date), url: `/posts/${p.id}/`,
                 categories: p.data.categories, tags: p.data.tags, scheduled: p.data.date.getTime() > now }));
  return new Response(JSON.stringify(rows, null, 1), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
