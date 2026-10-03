import { allPosts, summary } from '../lib/posts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Atom, same path as Chirpy's feed so existing subscribers keep working.
export async function GET({ site }: { site: URL }) {
  const posts = (await allPosts()).slice(0, 30);
  const url = (p: string) => new URL(p, site).href;
  const entries = posts.map(p => `  <entry>
    <title>${esc(p.data.title)}</title>
    <link href="${url(`/posts/${p.id}/`)}"/>
    <id>${url(`/posts/${p.id}/`)}</id>
    <published>${p.data.date.toISOString()}</published>
    <updated>${p.data.date.toISOString()}</updated>
    ${p.data.categories.map(c => `<category term="${esc(c)}"/>`).join('')}
    <summary>${esc(summary(p, 400))}</summary>
  </entry>`).join('\n');
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Ozan Berk Polat</title>
  <subtitle>Azure Cloud Consultant</subtitle>
  <link href="${url('/feed.xml')}" rel="self"/>
  <link href="${url('/')}"/>
  <id>${url('/')}</id>
  <updated>${posts[0].data.date.toISOString()}</updated>
  <author><name>Ozan Berk Polat</name></author>
${entries}
</feed>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
}
