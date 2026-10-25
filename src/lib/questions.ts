// Loads the question bank and gets each question ready for the quiz. This is
// also where the checks that look across files live (the schema in
// content.config.ts checks one file at a time): ids must match file names, and
// the same question can't be in the bank twice.
import { getCollection, type CollectionEntry } from 'astro:content';
import katex from 'katex';
import { units } from '../data/units';

export type Letter = 'A' | 'B' | 'C' | 'D';
export const letters: Letter[] = ['A', 'B', 'C', 'D'];

export interface PreparedQuestion {
  entry: CollectionEntry<'questions'>;
  id: string;
  topic: string;
  topicTitle: string;
  difficulty: 1 | 2 | 3;
  stemHtml: string;
  choicesHtml: Record<Letter, string>;
  whyWrongHtml: Partial<Record<Letter, string>>;
  figureSvg: string | null;
  sourceLabel: string;
}

// Figures are inlined as SVG so they can use the site's colors in light and dark mode.
const figures = import.meta.glob<string>('../content/questions/*/figures/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Turns text with $...$ math into HTML. Bad math stops the build. */
function inline(text: string) {
  return text
    .split(/(\$[^$]+\$)/g)
    .map((part) =>
      part.length > 2 && part.startsWith('$') && part.endsWith('$')
        ? katex.renderToString(part.slice(1, -1), { throwOnError: true })
        : escapeHtml(part),
    )
    .join('');
}

/** Like inline(), but a blank line starts a new paragraph. */
function paragraphs(text: string) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p>${inline(p.replace(/\s*\n\s*/g, ' '))}</p>`)
    .join('');
}

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

let prepared: PreparedQuestion[] | undefined;

async function prepareAll() {
  if (prepared) return prepared;
  const entries = await getCollection('questions');
  const stems = new Map<string, string>();
  prepared = entries.map((entry) => {
    const q = entry.data;
    const fail = (message: string): never => {
      throw new Error(`Question ${entry.id}: ${message}`);
    };

    if (entry.id !== `unit-${q.unit}/${q.id}`) {
      fail(`the file must be src/content/questions/unit-${q.unit}/${q.id}.md`);
    }
    const stem = normalize(q.stem);
    const twin = stems.get(stem);
    if (twin) fail(`it has the same question text as ${twin}`);
    stems.set(stem, q.id);

    let figureSvg: string | null = null;
    if (q.figure) {
      figureSvg = figures[`../content/questions/unit-${q.unit}/figures/${q.figure}`] ?? null;
      if (!figureSvg) fail(`figure ${q.figure} is not in src/content/questions/unit-${q.unit}/figures/`);
    }

    try {
      const whyWrongHtml: Partial<Record<Letter, string>> = {};
      for (const l of letters) {
        const reason = q.why_wrong[l];
        if (reason) whyWrongHtml[l] = inline(reason);
      }
      return {
        entry,
        id: q.id,
        topic: q.topic,
        topicTitle: units.find((u) => u.number === q.unit)!.topics.find((t) => t.id === q.topic)!.title,
        difficulty: q.difficulty,
        stemHtml: paragraphs(q.stem),
        choicesHtml: Object.fromEntries(letters.map((l) => [l, inline(q.choices[l])])) as Record<Letter, string>,
        whyWrongHtml,
        figureSvg,
        sourceLabel: q.source.type === 'original' ? 'Original question' : q.source.citation!,
      };
    } catch (error) {
      return fail(`the math could not be read (${(error as Error).message})`);
    }
  });
  return prepared;
}

/** The published questions for one unit, in topic order. */
export async function getUnitQuestions(unitNumber: number) {
  const all = await prepareAll();
  return all
    .filter((q) => q.entry.data.unit === unitNumber && q.entry.data.publish)
    .sort((a, b) => a.topic.localeCompare(b.topic, undefined, { numeric: true }) || a.id.localeCompare(b.id));
}
