# Physics 1 Practice

A study site for AP Physics 1: AP-style multiple-choice practice organized by unit, with an explanation for every answer, plus a cheat sheet for each unit with key ideas, equations, and diagrams.

Live at **https://jguo3340.github.io/ap-physics-practice/** once GitHub Pages is turned on (see Deploying).

Built with [Astro](https://astro.build), a framework that turns the files in `src/` into a fast static website.

## Run it on your computer

You need [Node.js](https://nodejs.org) version 24 (the LTS download).

```sh
npm install      # first time only: downloads the tools the site needs
npm run dev      # starts the site at http://localhost:4321 and reloads as you edit
```

Other commands:

| Command           | What it does                                      |
| ----------------- | ------------------------------------------------- |
| `npm run build`   | Builds the finished site into `dist/`             |
| `npm run preview` | Serves the built site so you can check it locally |
| `npm run check`   | Looks for type errors and broken component props  |

## Where things live

```
src/
├── content/questions/    The question bank: one Markdown file per question
├── content.config.ts     The checklist every question file must pass
├── lib/questions.ts      Loads questions for practice; catches duplicates
├── lib/calculate.ts      The calculator's math: trig, roots, powers, logs
├── scripts/practice.ts   Runs the practice page: timer, marks, cross-outs, score
├── scripts/calculator.ts Runs the calculator panel: keypad, history, dragging
├── data/units.ts         The 8 units: titles, summaries, exam weights, topics
├── site.ts               Site name and description
├── layouts/BaseLayout    Header, navigation, and footer shared by every page
├── components/           Reusable pieces (the practice page, calculator, exam weight bars, logo)
├── pages/                One file per page; the file path becomes the web address
│   ├── index.astro           Home page  →  /
│   ├── units/index.astro     All units  →  /units
│   ├── units/[slug].astro    One page per unit  →  /units/kinematics, ...
│   └── units/[slug]/practice.astro   Exam-style practice  →  /units/kinematics/practice
└── styles/global.css     Colors, fonts, and spacing for the whole site
public/                   Files served as-is (the favicon)
```

Common edits:

- **Rename the site:** change `name` in `src/site.ts`.
- **Change a unit's text or topics:** edit `src/data/units.ts`. Every page updates.
- **Change colors:** edit the variables at the top of `src/styles/global.css`. Dark mode has its own set just below.

## Adding a question

1. Copy any file in `src/content/questions/unit-1/`, for example `u1-001.md`.
2. Name the copy with the next free number in that unit (`u1-006.md`) and set `id` to match.
3. Fill in `topic`, `stem`, `choices`, `answer`, and a `why_wrong` reason for each wrong choice. Put the worked solution below the second `---`.
4. Run `npm run check` and `npm run build`. If anything is missing or the math has a typo, they stop and name the file and the problem.

Write math between `$` signs, for example `$\Delta x = \tfrac12 a t^2$`. In the part between the `---` lines, wrap text that has a backslash in single quotes (`'...'`) or put it on its own lines after `|`, because YAML treats a backslash inside double quotes as a special character.

A graph or diagram goes in the unit's `figures/` folder as an SVG, named in the question's `figure` field. The classes `fig-grid`, `fig-axis`, `fig-line`, `fig-point`, `fig-label`, and `fig-title` (for graphs) and `fig-fill`, `fig-arrow`, `fig-arrowhead`, and `fig-dash` (for objects, force arrows, and guide lines) give it the site's colors in light and dark mode.

## Deploying

The site is static, so it can be hosted free.

- **GitHub Pages (set up already):** `.github/workflows/deploy.yml` builds and publishes the site on every push to `main`. Turn it on once under the repo's **Settings → Pages → Source: GitHub Actions**. The site then lives at `https://<user>.github.io/<repo>/`. After that, every change merged into `main` goes live on its own within a few minutes; the **Actions** tab shows each deploy.
- **Vercel or Netlify:** import this repository and keep the default Astro settings.

`BASE_PATH` tells the build which sub-folder the site is served from (GitHub Pages uses `/<repo>`); leave it unset for a site at the root of a domain.

## Roadmap

1. Site skeleton: home, unit list, and unit pages (done)
2. Practice engine: questions stored as files, instant feedback, explanations, equations with KaTeX (started: every unit has an exam-style practice page, 98 questions in all, with a built-in scientific calculator and an equation sheet)
3. Content: a cheat sheet for each unit and original questions, starting with Units 1 and 2
4. Visuals: interactive force diagrams and motion graphs
5. Later: progress tracking

## A note on questions

AP is a registered trademark of the College Board, which is not affiliated with this site. Every question here is written for this site. Past exam questions are used only as a guide to style and difficulty, never copied.
