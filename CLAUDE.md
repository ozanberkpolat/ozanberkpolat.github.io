# blog.obp.com.tr

Ozan Berk Polat's public Azure blog. **Astro 7** static site (moved off Jekyll + Chirpy on 2026-10-03),
deployed to GitHub Pages by `.github/workflows/pages-deploy.yml` (`withastro/action@v6`, which runs
`npm run build` = `astro build && pagefind --site dist`). Pages settings: **build type `workflow`** and custom domain `blog.obp.com.tr`, both set through the API
(`gh api -X PUT repos/ozanberkpolat/ozanberkpolat.github.io/pages -f build_type=workflow -f cname=blog.obp.com.tr`).
⚠️ Until the cutover the repo was on `legacy` (branch build) racing the Actions deploy; moving `CNAME`
out of the root made the legacy build drop the domain and the site 404'd for ~5 minutes (2026-10-03).
Workflow deployments ignore `public/CNAME`; the domain lives in the Pages settings.

## Design
Direction "D, Lead + Log" picked by the owner on 2026-10-03 from a design-options round (A Warm Console
+ C Front Page blend): obp.com.tr's warm dark ground (`#0f0e0d`), one orange accent (`#ff8000`),
Plus Jakarta Sans + JetBrains Mono, dot grid. Dark first, light via system setting or the nav toggle.
All tokens are in `src/styles/global.css`.

## Content model
- Posts stay in `_posts/YYYY-MM-DD-slug.md` (n8n's `Azure Blog Publish` commits there) and are served
  at `/posts/<slug>/`, the old Chirpy permalink. The collection id is the filename minus the date.
- `categories` containing **`News`** = an automatic Azure Radar note (`/radar/`, home rail).
  Everything else is an article (home list). One rule: `isRadar` / `isArticle` in `src/lib/posts.ts`.
- Optional front matter `figure` + `figure_note` (e.g. `"$26,385"` / `"saved per year"`): the newest
  article that has one becomes the home page lead story. No figure anywhere = plain list.
- Kramdown leftovers (`{: .prompt-info }` after a blockquote, `> [!WARNING]`, `{: .noshadow }`) are
  handled by `src/lib/remark-kramdown.mjs`. Needs `@astrojs/markdown-remark` installed, because
  Astro 7's default Markdown processor (Sätteri) does not run remark plugins.
- **Scheduling:** a post dated in the future is left out of every page until a build runs on or after
  that date. The workflow rebuilds every Sunday 06:00 UTC (09:00 TRT), and n8n's daily commit rebuilds
  too. Hand-written posts go out on Sundays (owner, 2026-10-03): commit them with that Sunday's date.
  The file is public in the repo from the moment it is committed.
- Drafts live in `drafts/` (gitignored, local only) until the owner approves them.
- Mermaid fences are excluded from Shiki and rendered client-side only when `mermaid: true`.

## URLs kept from Chirpy
Every URL in the old sitemap (520) still resolves: posts, `/categories/<slug>/`, `/tags/<slug>/`
(Jekyll slugify), `/archives/`, `/about/`, `/feed.xml` (Atom), `/sitemap.xml` (own endpoint).
`/news/` redirects to `/radar/`, `/page2/`..`/page17/` to `/`. `public/sw.min.js` replaces Chirpy's
service worker: it clears its caches and unregisters itself so returning visitors get the new site.

## Analytics
Google Analytics `G-2R66G7C07T` and GoatCounter `ozanberkplt`, both in `src/layouts/Base.astro`.
AdSense was dropped on purpose.

## Run
`npm run dev` (search is unavailable there, the Pagefind index only exists after a build),
`npm run build`, `npx astro preview --host 100.84.61.54 --port 4330` for a tailnet preview.
