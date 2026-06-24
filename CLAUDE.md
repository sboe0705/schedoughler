# Schedoughler — Claude Context

## Project Overview

Schedoughler is a single-page bread-baking scheduler. The user picks a recipe and sets a target finish time; the app calculates every step's start and end by working backwards from that time. Step durations can be nudged where the recipe allows a flexible range.

**Tech stack:** Vue 3 (Composition API) · Vite 8 · Vitest 4 · plain JavaScript (no TypeScript) · scoped CSS in SFCs · no routing library · no component library · no external state manager.

## Build & Run Commands

```bash
npm install          # install dependencies
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # production build → dist/
npm run preview      # preview production build
npm test             # run Vitest unit tests

./dev.sh             # convenience wrapper for npm run dev
./build.sh           # convenience wrapper: npm test && npm run build
./screenshot.sh      # capture full-page screenshot of the running app → schedoughler-screenshot.png
```

CI runs `npm test` then `npm run build` on every push and PR; pushes to `main` are deployed to GitHub Pages automatically.

## Project Structure

```
src/
├── scheduler.js          # All recipe data (RECIPES array) + core scheduling algorithm
├── scheduler.test.js     # Vitest unit tests — scheduler.js functions only
├── App.vue               # Root component; owns all reactive state
├── utils.js              # Date/time formatting helpers
└── components/
    ├── SetupCard.vue     # Finish-time picker + derived start-time display
    ├── RecipePicker.vue  # Horizontal recipe selector chips
    ├── StepTimeline.vue  # Container that renders all step rows
    ├── StepRow.vue       # Individual step card with timeline rail
    └── NudgeControls.vue # ± buttons for flexible step durations

index.html            # HTML entry point; loads Google Fonts; lang="de"
vite.config.js        # Vite config — Vue plugin + dynamic base path for GitHub Pages
.github/workflows/ci.yml  # CI: test → build → deploy to GitHub Pages
design/               # Reference materials and design prototypes (not deployed)
README.md             # Data model reference + recipe conversion prompt + CLAUDE.md update instructions
CLAUDE.md             # This file — Claude Code context for this repository
```

## Coding Conventions

**Vue components** use `<script setup>` with the Composition API. Props are declared with `defineProps`, events with `defineEmits`. Two-way binding follows the `modelValue` / `update:modelValue` convention.

**State** lives in `App.vue` as Vue `ref`s (`recipeId`, `finishAt`, `overrides`). A `watch` persists them to `localStorage`. The schedule itself is a `computed` ref derived from `computeSchedule(recipe, finishAt, overrides)` — a pure, framework-agnostic function in `scheduler.js`. Data flows down via props; events flow up via `$emit`.

**Styling** uses scoped CSS inside each SFC — no preprocessor, no utility framework. Fonts are Bitter (headings) and Hanken Grotesk (body), loaded from Google Fonts in `index.html`.

**Language:** UI labels are in German.

**Tests** are co-located with source as `*.test.js` files. Only pure functions in `scheduler.js` are unit-tested; there are no Vue component tests.

## Recipe Data Model

Recipes live in the `RECIPES` array exported from `src/scheduler.js`. The full schema (Recipe, Step, Ingredient fields, step kinds and their colors) is documented in `README.md`. Recipes may carry an optional `source: { url, title }` field; when present, `SetupCard.vue` renders a link icon next to the recipe name.

## Important Constraints

- **No TypeScript.** Keep all source files as plain `.js` / `.vue`.
- **No Vue component tests.** Tests go in `scheduler.test.js` and cover pure functions only.
- **New recipes** belong in the `RECIPES` array in `src/scheduler.js`.
- **`vite.config.js` base path** must stay dynamic (`process.env.GITHUB_REPOSITORY`-based) for GitHub Pages to work correctly — do not hardcode it.
- **German UI** — all user-visible labels, step kinds, and descriptions are in German; keep new additions consistent.
