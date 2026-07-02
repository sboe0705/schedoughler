# Schedoughler — Claude Context

## Project Overview

Schedoughler is a two-view bread-baking scheduler. The **recipe selection view** is a searchable, vertical list of recipes (saved bakes pinned in their own section at the top, sorted by finish time; all others follow alphabetically); the **scheduler view** shows the plan for one recipe. The user picks a recipe and sets a target finish time; the app calculates every step's start and end by working backwards from that time. Step durations can be nudged where the recipe allows a flexible range. Tapping the bookmark button on a recipe row saves its current bake plan (finish time + overrides) as a bookmark that is restored on the next tap; editing a saved recipe's plan keeps the bookmark in sync automatically.

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
├── scheduler.js           # All recipe data (RECIPES array) + core scheduling algorithm
├── scheduler.test.js      # Vitest unit tests — scheduler.js functions only
├── App.vue                # Root component; owns all reactive state, toggles between the two views
├── utils.js               # Date/time formatting helpers
└── components/
    ├── RecipeSelectView.vue # Recipe selection view: header, search field, saved/all-recipes sections
    ├── RecipeRow.vue       # Single recipe row (saved vs. normal variant) with a bookmark button
    ├── SchedulerHeader.vue # Scheduler view title bar: back button, recipe name/subtitle, source link
    ├── SetupCard.vue       # Finish-time picker + derived start-time display
    ├── StepTimeline.vue    # Container that renders all step rows
    ├── StepRow.vue         # Individual step card with timeline rail
    └── NudgeControls.vue   # ± buttons for flexible step durations

index.html            # HTML entry point; loads Google Fonts; lang="de"
vite.config.js        # Vite config — Vue plugin + dynamic base path for GitHub Pages
.github/workflows/ci.yml  # CI: test → build → deploy to GitHub Pages
design/               # Reference materials and design prototypes (not deployed)
README.md             # Data model reference + recipe conversion prompt + CLAUDE.md update instructions
CLAUDE.md             # This file — Claude Code context for this repository
```

## Coding Conventions

**Vue components** use `<script setup>` with the Composition API. Props are declared with `defineProps`, events with `defineEmits`. Two-way binding follows the `modelValue` / `update:modelValue` convention.

**State** lives in `App.vue` as Vue `ref`s (`view`, `recipeId`, `finishAt`, `overrides`, `savedBakes`). `view` (`'select' | 'plan'`) toggles between the two views and is not persisted — every fresh page load opens on the recipe selection view. A `watch` persists `recipeId`/`finishAt`/`overrides` to `localStorage`; `savedBakes` is persisted separately under `schedoughler.saved.v1` via helpers in `scheduler.js`. A second watcher on `finishAt`/`overrides` keeps an already-saved recipe's bookmark in sync while its plan is being edited. The schedule itself is a `computed` ref derived from `computeSchedule(recipe, finishAt, overrides)` — a pure, framework-agnostic function in `scheduler.js`. `RecipeSelectView.vue` owns its own local `query` ref (search text) — it is UI-only and not lifted to `App.vue` or persisted. Data flows down via props; events flow up via `$emit`.

**Styling** uses scoped CSS inside each SFC — no preprocessor, no utility framework. Fonts are Bitter (headings) and Hanken Grotesk (body), loaded from Google Fonts in `index.html`.

**Language:** UI labels are in German.

**Tests** are co-located with source as `*.test.js` files. Only pure functions in `scheduler.js` are unit-tested; there are no Vue component tests.

## Recipe Data Model

Recipes live in the `RECIPES` array exported from `src/scheduler.js`. The full schema (Recipe, Step, Ingredient fields, step kinds and their colors) is documented in `README.md`. Recipes may carry an optional `source: { url, title }` field; when present, `SchedulerHeader.vue` renders a link icon next to the recipe name in the scheduler view's title bar.

## Search

`RecipeSelectView.vue` filters both list sections live against a local `query` ref using `matchesQuery(recipe, query)` from `scheduler.js` — case-insensitive, whitespace-split, every word must occur in the recipe's title or any step's title/description. An empty query matches everything.

## Saved Bakes

Tapping the bookmark button on a `RecipeRow.vue` saves or removes the active bake plan (finish time + overrides) for that recipe — an explicit tap, not a gesture; the button click calls `stopPropagation` so it never also opens the scheduler. `App.vue` calls `toggleSavedBake` from `scheduler.js` and persists via `persistSavedBakes`. Saved recipes are pinned in their own "Gespeicherte Backzeiten" section at the top of the selection list (sorted by saved finish time ascending) and rendered with a filled bookmark button and a "Fertig …" pill; unsaved recipes live in the alphabetical "Alle Rezepte" section with an outline bookmark button. Editing a saved recipe's plan (date/time or a step nudge) in the scheduler view immediately re-persists the saved bake with the new values via a dedicated `watch` in `App.vue`. Saved bakes auto-expire 2 hours after their finish time and are pruned on mount and every 60 s.

## Important Constraints

- **No TypeScript.** Keep all source files as plain `.js` / `.vue`.
- **No Vue component tests.** Tests go in `scheduler.test.js` and cover pure functions only.
- **New recipes** belong in the `RECIPES` array in `src/scheduler.js`.
- **`vite.config.js` base path** must stay dynamic (`process.env.GITHUB_REPOSITORY`-based) for GitHub Pages to work correctly — do not hardcode it.
- **German UI** — all user-visible labels, step kinds, and descriptions are in German; keep new additions consistent.
