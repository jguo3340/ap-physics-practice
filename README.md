# Physics 1 Practice

A study site for AP Physics 1: AP-style multiple-choice practice organized by unit, with an explanation for every answer, plus a cheat sheet for each unit with key ideas, equations, and diagrams.

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
├── data/units.ts         The 8 units: titles, summaries, exam weights, topics
├── site.ts               Site name and description
├── layouts/BaseLayout    Header, navigation, and footer shared by every page
├── components/           Reusable pieces (unit cards, exam weight bars, logo)
├── pages/                One file per page; the file path becomes the web address
│   ├── index.astro           Home page  →  /
│   ├── units/index.astro     All units  →  /units
│   └── units/[slug].astro    One page per unit  →  /units/kinematics, ...
└── styles/global.css     Colors, fonts, and spacing for the whole site
public/                   Files served as-is (the favicon)
```

Common edits:

- **Rename the site:** change `name` in `src/site.ts`.
- **Change a unit's text or topics:** edit `src/data/units.ts`. Every page updates.
- **Change colors:** edit the variables at the top of `src/styles/global.css`. Dark mode has its own set just below.

## Deploying

The site is static, so it can be hosted free on Vercel, Netlify, or GitHub Pages. On Vercel, import this repository and keep the default Astro settings. Every push to `main` then updates the live site.

To serve it from a sub-folder (GitHub Pages uses `https://<user>.github.io/<repo>/`), set the `BASE_PATH` environment variable to `/<repo>` when building.

## Roadmap

1. Site skeleton: home, unit list, and unit pages (done)
2. Practice engine: questions stored as files, instant feedback, explanations, equations with KaTeX
3. Content: a cheat sheet for each unit and original questions, starting with Units 1 and 2
4. Visuals: interactive force diagrams and motion graphs
5. Later: progress tracking

## A note on questions

AP is a registered trademark of the College Board, which is not affiliated with this site. Every question here is written for this site. Past exam questions are used only as a guide to style and difficulty, never copied.
