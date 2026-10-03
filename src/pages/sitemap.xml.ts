import { allPosts, slugify } from '../lib/posts';

// Own endpoint at /sitemap.xml (the path Search Console knows), not @astrojs/sitemap's index file.
export async function GET({ site }: { site: URL }) {
  const posts = await allPosts();
  const paths = new Set(['/', '/radar/', '/categories/', '/tags/', '/archives/', '/about/']);
  for (const p of posts) {
    paths.add(`/posts/${p.id}/`);
    p.data.categories.forEach(c => paths.add(`/categories/${slugify(c)}/`));
    p.data.tags.forEach(t => paths.add(`/tags/${slugify(t)}/`));
  }
  const body = [...paths].map(p => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
