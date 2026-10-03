import { defineConfig } from 'astro/config';
import remarkKramdown from './src/lib/remark-kramdown.mjs';

// Old Chirpy URLs that have no page of their own any more.
const redirects = { '/news/': '/radar/' };
for (let i = 2; i <= 17; i++) redirects[`/page${i}/`] = '/';

export default defineConfig({
  site: 'https://blog.obp.com.tr',
  trailingSlash: 'always',
  build: { format: 'directory' },
  redirects,
  markdown: {
    remarkPlugins: [remarkKramdown],
    shikiConfig: { theme: 'vitesse-dark' },
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
  },
});
