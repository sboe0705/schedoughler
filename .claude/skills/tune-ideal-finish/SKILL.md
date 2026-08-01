---
description: Pick, verify and tune a recipe's idealFinish clock time with ./check-critical-times.sh so no step starts while the baker is asleep or away — for a new recipe or for existing ones
---

# Tune `idealFinish`

`idealFinish: { hour, minute }` on a recipe in [src/scheduler.js](src/scheduler.js) is the clock time-of-day `defaultFinishTime()` targets. The app schedules backwards from it, so the finish time decides when every earlier step lands. A badly chosen one puts a shaping step at 3am.

It cannot be guessed from the recipe text — it has to be simulated. That is what this skill does.

Use it when adding a recipe (invoked from the `add-recipe` skill), when a recipe's step durations change, or when the user asks to optimize baking/ideal times generally.

## The simulator

```bash
./check-critical-times.sh          # every recipe, full step listing
./check-critical-times.sh -w       # only recipes that have warnings
```

For each recipe it anchors the finish at `idealFinish` on a reference day, walks the schedule backwards exactly like the app, and flags every step whose **start** falls inside a critical window. Recipes without an `idealFinish` are skipped with `⏭`.

Critical windows are defined in `CRITICAL_PERIODS` near the top of [check-critical-times.sh](check-critical-times.sh):

- `22:00–05:00` — asleep
- `09:00–16:00` — at work / away

Only a step's **start** matters — a rise may run through the night, it just must not need to be *begun* then. Do not edit `CRITICAL_PERIODS` unless the user asks; it encodes their personal schedule.

For a warned recipe the script also scans the full 24 h clock on a 15-minute grid and prints `💡 Bessere Fertigzeit: HH:MM` when a finish time exists with fewer critical starts. Treat that as the strong first candidate.

## Procedure

1. **Start from a plausible guess** if the recipe has no `idealFinish` yet:
   - long overnight doughs (sourdough, cold retard, 24 h+) → around **18:00**
   - short same-day recipes → a mealtime finish (lunch, dinner)
2. **Run the simulator** and read the new/target recipe's block.
3. **Tune, then re-run.** Two levers, in this order:
   - **the `idealFinish` clock time** — free to move anywhere; try the script's `💡` suggestion first;
   - **the default `dur` of flexible proofs and retards** — allowed **only inside that step's own `min`/`max` range**, never beyond it. Fixed steps (kneading, shaping) and every `bake` step are off limits.
4. **Repeat until** the recipe reports `✓` — or until the script says `(keine bessere Fertigzeit im 24-h-Raster gefunden — N bleibt das Minimum.)`, meaning the remaining warnings are unavoidable for these durations.
5. **Sanity-check the result as a human plan**, not just as a green checkmark: `06:30` is technically outside the night window but is still a bad ask. Prefer a finish that reads like a real baking day.

## Scope discipline

- When tuning **one** recipe, change only that recipe. Other recipes' warnings are pre-existing; report them if they look new, but do not retune them as a side effect.
- When the user explicitly asks to optimize **all** recipes, work through them one at a time, re-running the script after each change so you can attribute every improvement or regression.
- Never touch `min`/`max`/`step` bounds themselves to make a schedule fit — those describe what the dough tolerates, not what the calendar wants.

## Finishing up

1. `npm test` — schedule assertions in [src/scheduler.test.js](src/scheduler.test.js) can depend on ideal times.
2. Report per recipe: chosen `idealFinish`, the simulated start → finish window, and any critical step starts that could not be avoided.
3. Commit only when the user asks.
