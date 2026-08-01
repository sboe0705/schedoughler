# Schedoughler

A bread-baking scheduler that pins the **finish time** and walks every step backwards, so you always know when to start.

---

## Data model

The full model lives in `src/scheduler.js` and is made up of three nested types.

### Recipe

```js
{
  id:           string,   // URL-safe identifier, e.g. 'sauerteig'
  name:         string,   // display name, e.g. 'Sauerteigbrot'
  totalShort:   string,   // human duration hint, e.g. '~28 Std'
  subtitle:     string,   // short tagline / attribution
  source?:      { url: string, title: string },  // optional link to original recipe
  idealFinish?: { hour: number, minute: number }, // optional target clock time-of-day
                          // for defaultFinishTime() — chosen so this recipe's long
                          // rises/cold-retards land overnight instead of the bake
                          // landing at 3am; hand-picked per recipe, not guessed
  steps:        Step[],   // ordered list, first to last
}
```

### Step

```js
{
  title: string,        // name shown in the timeline, e.g. 'Vorteig ansetzen'
  dur:   number,        // default duration in minutes
  kind:  string,        // one of the four KINDS keys (see below)
  desc:  string,        // one-sentence instruction shown under the step

  // Optional — only for steps where the duration is adjustable:
  min:  number,         // shortest acceptable duration in minutes
  max:  number,         // longest acceptable duration in minutes
  step: number,         // nudge increment in minutes

  // Optional — marks a step that spans overnight:
  sleep: true,

  // Optional — ingredients needed at the start of this step:
  ingredients: Ingredient[],
}
```

**Rule of thumb for `min`/`max`/`step`:** add these whenever a baker would reasonably shift the duration (bulk ferments, cold retards). Leave them off for mechanical steps like kneading, and always leave them off `bake` steps — oven time is fixed and must not be manually adjustable.

### KINDS

| key    | colour  | meaning                             |
|--------|---------|-------------------------------------|
| `prep` | amber   | active hands-on work (knead, shape) |
| `rise` | tan     | room-temperature fermentation       |
| `cold` | slate   | cold retard in the fridge           |
| `bake` | terracotta | in the oven                      |

### Ingredient

```js
{
  amount?: number,   // numeric quantity, omit for references like 'Vorteig'
  unit?:   string,   // e.g. 'g', 'ml', 'TL' — omit when not applicable
  name:    string,   // ingredient name
  note?:   string,   // parenthetical detail, e.g. 'handwarm' or 'Type 550'
}
```

Ingredients live on the step where they are **first introduced**. A step that only transforms dough (shaping, baking) carries no `ingredients` field at all.

---

## Saved bakes

Each row in the recipe selection view has a bookmark button that saves or removes a bake — the active recipe's finish time and any duration overrides — as a bookmark. Saved recipes are pinned in their own "Gespeicherte Backzeiten" section at the top of the list (soonest finish time first); everything else stays in the alphabetical "Alle Rezepte" section.

- **Tap** a row's body → opens the scheduler, restoring the saved finish time and overrides if that recipe has a saved bake, otherwise starting from a fresh default finish time
- **Tap** the outline bookmark button on a row without a saved bake → saves it (the live finish time + overrides if it's the recipe currently open in the scheduler, otherwise a fresh default plan); the button click does not also open the scheduler
- **Tap** the filled bookmark button on a saved row → removes the bookmark, without opening the scheduler
- **Editing a saved recipe's plan** (changing the finish date/time or nudging a flexible step) while it is open in the scheduler immediately re-persists the saved bake with the new values
- **Auto-expiry** — saved bakes are dropped automatically 2 hours after their finish time, both on app launch and every 60 seconds while the page is open

Saved bakes are persisted to `localStorage` under the key `schedoughler.saved.v1`.

The persistence helpers (`loadSavedBakes`, `persistSavedBakes`, `toggleSavedBake`, `pruneSavedBakes`) and the constants `SAVED_KEY` / `SAVED_EXPIRY_MS` live in `src/scheduler.js`.

---

## Starred recipes

Each row also has a star button for marking a recipe as a favorite — meant for recipes you've already tried and rated highly. Starring is a plain local preference (no finish time attached) and never expires. Starred recipes that aren't currently saved are pinned in their own "Favoriten" section, sorted alphabetically, between the saved-bakes section and "Alle Rezepte"; a recipe that's both saved and starred stays in the saved-bakes section with its star shown filled.

Starred recipes are persisted to `localStorage` under the key `schedoughler.starred.v1`. The persistence helpers (`loadStarredRecipes`, `persistStarredRecipes`, `toggleStarredRecipe`) and the constant `STARRED_KEY` live in `src/scheduler.js`.

---

## Adding a recipe

### 1. Manual authoring

Copy an existing entry in the `RECIPES` array in `src/scheduler.js` and edit the fields. The scheduler picks it up automatically — no registration step needed.

### 2. AI-assisted conversion

If you have a recipe from a website, book, or handwritten card, hand it to Claude Code in this repository and invoke the **`add-recipe` skill** (`/add-recipe`, or just ask for the recipe to be added). The skill is the single source of truth for the conversion and lives in [`.claude/skills/add-recipe/SKILL.md`](.claude/skills/add-recipe/SKILL.md).

It covers the whole import, not just the conversion:

1. **Convert** the raw recipe into a recipe object following the schema and rules above (German UI text, one step per phase, no separate preheat step, `min`/`max`/`step` only on genuinely flexible steps and never on `bake`).
2. **Insert** it into the `RECIPES` array in `src/scheduler.js`, in alphabetical order by `name` — the array is kept sorted.
3. **Pick and verify an `idealFinish`** — delegated to the separate [`tune-ideal-finish` skill](.claude/skills/tune-ideal-finish/SKILL.md), see below.
4. **Test and build** — `npm test` (bump the recipe-count assertion in `src/scheduler.test.js`) and `./build.sh`, then commit to `main`.

Keep the skill file in sync with this document whenever the data model changes.

## Tuning `idealFinish`

`idealFinish` cannot be guessed from a recipe's text — it has to be simulated against the baker's day. `./check-critical-times.sh` anchors each recipe's finish at its `idealFinish`, walks the schedule backwards like the app does, and warns when a step *starts* inside a critical window (asleep `22:00–05:00`, away `09:00–16:00`, configurable via `CRITICAL_PERIODS` in the script). For a warned recipe it also scans the whole 24-hour clock and suggests a better finish time.

```bash
./check-critical-times.sh          # every recipe, full step listing
./check-critical-times.sh -w       # only recipes with warnings
```

The tuning loop — try the suggested finish time, then adjust the default `dur` of flexible proofs *within their own `min`/`max` range* only — is captured in the [`tune-ideal-finish` skill](.claude/skills/tune-ideal-finish/SKILL.md). Invoke it via Claude Code (`/tune-ideal-finish`) for a new recipe, after changing step durations, or to re-optimize existing recipes.

---

## Maintaining CLAUDE.md

`CLAUDE.md` lives in the project root and gives Claude Code the context it needs to work effectively in this repository: tech stack, commands, project structure, coding conventions, and constraints.

Update it whenever the project structure, tech stack, scripts, or coding conventions change in a meaningful way (e.g. a new dependency, a renamed directory, a new shell script, a new convention).

### Regeneration prompt

Open Claude Code in this repository and run the following prompt. It will read the codebase from scratch and rewrite `CLAUDE.md` based on what it actually finds.

```
Analyze this repository and update the existing CLAUDE.md file in the project root. Include:

- Project overview – what this project does and its tech stack
- Build & run commands – install, dev server, build, test, and any shell scripts
- Project structure – key directories and their purpose
- Coding conventions – patterns, naming, frameworks in use
- Important constraints – things to avoid or always do

Base everything on what you actually find in the codebase, including the README.md in the project root. Do not invent or assume anything not present.
```

After Claude generates the file, review it and correct anything that is missing or imprecise before committing.
