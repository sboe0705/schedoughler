---
description: Convert a bread recipe (URL, pasted text, book, handwritten card) into a Schedoughler recipe object, insert it into RECIPES, tune its idealFinish, and verify
---

# Add a recipe

Turns a raw recipe into an entry of the `RECIPES` array in `src/scheduler.js`, then tunes and verifies its timing.

Work through all five phases in order. Do not stop after phase 1 — a converted object that is not inserted, tuned and tested is not a finished import.

## Phase 1 — Get the recipe text

- **URL given** → fetch it (WebFetch) and keep the original URL + page title for the `source` field.
- **Text pasted / photo of a card described** → use it as-is; no `source` field unless a real URL is known.
- **Nothing given** → ask the user for the recipe before doing anything else.

## Phase 2 — Convert to a recipe object

### Target schema

Recipe object:

| field        | notes                                                                 |
|--------------|-----------------------------------------------------------------------|
| `id`         | short kebab-case string derived from the name; must be unique in `RECIPES` |
| `name`       | human display name (German)                                            |
| `totalShort` | rough total time as a string, e.g. `'~28 Std'` or `'~3,5 Std'`          |
| `subtitle`   | one-line tagline (flavour + source if known)                           |
| `source`     | optional `{ url, title }` — only when a real URL to the original is known |
| `steps`      | ordered array of Step objects                                          |

Do **not** write an `idealFinish` yet. It cannot be guessed from the recipe text — it is derived in phase 4 by simulating the schedule.

Step object — required fields:

| field   | notes                                          |
|---------|------------------------------------------------|
| `title` | short label for the timeline                   |
| `dur`   | default duration in whole minutes              |
| `kind`  | exactly one of `'prep'` \| `'rise'` \| `'cold'` \| `'bake'` |
| `desc`  | one sentence describing what the baker does    |

Step object — optional fields:

| field              | notes                                                                                   |
|--------------------|------------------------------------------------------------------------------------------|
| `min`, `max`, `step` | only when the duration is genuinely flexible (proofs, retards). `min`/`max` in minutes, `step` is the nudge increment (usually 15 or 30). **Never on a `bake` step.** |
| `sleep: true`      | the step spans overnight                                                                  |
| `ingredients`      | array of Ingredient objects — only on steps where new ingredients are introduced          |

Ingredient object: `amount` (number, omit for references like `Vorteig`), `unit` (`'g'`, `'ml'`, …, omit when N/A), `name`, `note` (optional parenthetical, e.g. `'handwarm'`, `'Weizenmehl Type 550'`).

### Kind guide

- `prep` — active hands-on work: mixing, kneading, shaping, scoring
- `rise` — room-temperature fermentation or proofing
- `cold` — cold retard in the fridge
- `bake` — time in the oven; always a fixed duration, never `min`/`max`/`step`

### Conversion rules

1. One step per distinct phase — never merge kneading and bulk ferment into one step.
2. Add `min`/`max`/`step` only where a real flexibility window exists (proof times, retards). Fixed steps like kneading or baking carry only `dur`. If a source recipe gives a *range* for the bake, collapse it into a single representative `dur`.
3. Baking temperature and vessel info belong in the `bake` step's `desc`, not in a separate step.
4. Never give the oven preheat its own step. Fold it into the `desc` of the `bake` step it precedes (e.g. `"Ofen mit Gusseisentopf auf 230 °C vorheizen, dann …"`) and do **not** add its time to `dur` — preheating runs in parallel with earlier steps and must not lengthen the schedule.
5. Assign ingredients to the step where they are first introduced. A `Vorteig` used in a later step appears there as `{ name: 'Vorteig' }` (no amount/unit).
6. All user-visible text (`name`, `subtitle`, `title`, `desc`, ingredient names/notes) is **German**, matching the existing recipes.

Match the formatting of the neighbouring entries in [src/scheduler.js](src/scheduler.js) — copy an existing recipe's shape rather than inventing a layout.

## Phase 3 — Insert into RECIPES

Insert the object into the `RECIPES` array in [src/scheduler.js](src/scheduler.js) **in alphabetical order by `name`**. The array is kept sorted — do not append at the end.

Check that the `id` collides with no existing recipe.

## Phase 4 — Pick and verify `idealFinish`

**Invoke the `tune-ideal-finish` skill** for the recipe just inserted, and follow it through. It owns the whole procedure: first guess, `./check-critical-times.sh` simulation, and the tuning loop over the finish time and the flexible steps' `dur` values.

The recipe is not finished until that skill reports either a clean run or the unavoidable minimum for the new recipe. Only the new recipe needs to come out clean — do not retune other recipes as a side effect.

## Phase 5 — Test, report, commit

1. `npm test` — adding a recipe changes the recipe count, so bump the count assertion in [src/scheduler.test.js](src/scheduler.test.js) to match.
2. `./build.sh` (tests + production build) before committing.
3. Report to the user: the recipe name, chosen `idealFinish`, the simulated start→finish window, and any critical steps that could not be avoided.
4. Commit to `main` and push **only when the user asks** — per the repo's normal commit policy.

## Reference

- [`tune-ideal-finish`](../tune-ideal-finish/SKILL.md) — phase 4 in full; also usable on its own for existing recipes.
- [README.md](README.md) — the data model documented for humans.
- [CLAUDE.md](CLAUDE.md) — project conventions.

Keep this skill and those documents in sync when the schema changes.
