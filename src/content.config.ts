// The question bank. Every question is one Markdown file in
// src/content/questions/unit-N/. The schema below is the checklist each file
// must pass; if one fails, `npm run check` and the build stop with a message
// that names the file, so a broken question never reaches the live site.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { units } from './data/units';

const letters = ['A', 'B', 'C', 'D'] as const;
const letter = z.enum(letters);

const questions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/questions' }),
  schema: z
    .object({
      /** u<unit>-<three digits>, the same as the file name. Never changes once published. */
      id: z.string().regex(/^u[1-8]-\d{3}$/, 'id must look like u1-001'),
      unit: z.number().int().min(1).max(8),
      /** Topic number from the course description, e.g. "1.2" */
      topic: z.string(),
      /** 1 easy, 2 medium, 3 hard */
      difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      source: z.object({
        type: z.enum(['original', 'past-exam']),
        /** Where a past-exam question came from, e.g. "2019 practice exam, Q7" */
        citation: z.string().nullable().default(null),
      }),
      /** false keeps the question in the bank without showing it on the site */
      publish: z.boolean(),
      /** File name of an SVG in the unit's figures/ folder, or null */
      figure: z.string().nullable().default(null),
      stem: z.string().min(1),
      choices: z.object({ A: z.string(), B: z.string(), C: z.string(), D: z.string() }),
      answer: letter,
      /** Why each wrong choice is wrong. Every wrong choice needs one. */
      why_wrong: z
        .object({
          A: z.string().optional(),
          B: z.string().optional(),
          C: z.string().optional(),
          D: z.string().optional(),
        })
        .strict(),
    })
    .superRefine((q, ctx) => {
      if (!q.id.startsWith(`u${q.unit}-`)) {
        ctx.addIssue({ code: 'custom', path: ['id'], message: `id must start with u${q.unit}- for unit ${q.unit}` });
      }
      const unit = units.find((u) => u.number === q.unit);
      if (!unit?.topics.some((t) => t.id === q.topic)) {
        ctx.addIssue({ code: 'custom', path: ['topic'], message: `topic ${q.topic} is not a topic of unit ${q.unit}` });
      }
      for (const l of letters) {
        const hasReason = Boolean(q.why_wrong[l]?.trim());
        if (l === q.answer && hasReason) {
          ctx.addIssue({ code: 'custom', path: ['why_wrong', l], message: `${l} is the answer, so it can't be in why_wrong` });
        }
        if (l !== q.answer && !hasReason) {
          ctx.addIssue({ code: 'custom', path: ['why_wrong', l], message: `explain why ${l} is wrong` });
        }
      }
      if (q.source.type === 'past-exam' && !q.source.citation) {
        ctx.addIssue({ code: 'custom', path: ['source', 'citation'], message: 'a past-exam question needs a citation' });
      }
    }),
});

export const collections = { questions };
