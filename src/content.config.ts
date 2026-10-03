import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Jekyll accepted a string or a list; normalize to a list of strings.
const list = z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]).nullish()
  .transform(v => (v == null ? [] : [v].flat().map(String)));

const posts = defineCollection({
  // _posts/YYYY-MM-DD-slug.md stays where n8n commits it; the id is Chirpy's /posts/<slug>/.
  loader: glob({ pattern: '*.md', base: './_posts', generateId: ({ entry }) => entry.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '') }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    categories: list,
    tags: list,
    description: z.string().optional(),
    toc: z.boolean().optional(),
    mermaid: z.boolean().optional(),
    // Key figure for the home page lead story, e.g. "$26,385" + "saved per year".
    figure: z.string().optional(),
    figure_note: z.string().optional(),
  }),
});

export const collections = { posts };
