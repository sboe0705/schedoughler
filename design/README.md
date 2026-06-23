# Handoff: Schedoughler — Bread-Baking Time Manager

## Overview
Schedoughler is a **mobile app** that schedules the steps of a bread recipe by
working **backwards from the moment the bread should be finished**. The baker
picks a pre-defined recipe and a target finish date/time; the app calculates
when every step must start (preferment, knead, bulk proof, shape, cold proof,
preheat, bake) and presents them as a vertical timeline. Overnight steps are
visually flagged so the baker can plan around sleep, and flexible proofing steps
(those with a duration *range*, e.g. "8–14 h") can be nudged earlier/later,
which shifts the start time while keeping the finish fixed.

The source recipe is a sourdough loaf by Marcel Paa (German); three more breads
were added to populate the picker.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working
prototype that demonstrates the intended look, layout, and behaviour. **They are
not production code to ship directly.**

The task is to **recreate this design in a real application environment**. There
is no existing codebase yet, so the developer should choose the most appropriate
framework. **Recommended: React Native (Expo)** — it targets iOS + Android from
one codebase, maps almost 1:1 onto the prototype's component structure, and (most
importantly) supports the **local notifications** that make this app genuinely
useful. Plain React (web) + a PWA wrapper is a valid lighter-weight alternative.

**The single most valuable asset in this bundle is [`scheduler.js`](./scheduler.js)** —
a framework-agnostic, dependency-free module containing the recipe data model and
the entire backward-scheduling engine. It is already extracted from the prototype
and ready to drop into the new project unchanged. Build the UI around it.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, and interactions are final.
Recreate the UI faithfully using the target platform's components, but you may
adapt idioms where native conventions are stronger (e.g. use the OS-native
date/time picker instead of HTML `<input type="date">`).

---

## Screens / Views

The prototype is a **single scrolling screen**. For the production app it is
clearest to think of it as one main screen with logical sections. (Future screens
— recipe editor, live/active-bake mode, notification settings — are noted at the
end as out of scope for this handoff.)

### Main screen — "Plan a bake"
**Purpose:** select a recipe + finish time, read the calculated schedule.

Vertical scroll, single column. Phone width (design drawn at 392 px logical
width). Sections top → bottom:

#### 1. Header
- App icon: 34×34, `border-radius: 11px`, background `#6B4426`, white serif "S"
  (Bitter 800, 19px), inset bottom shadow `inset 0 -3px 0 rgba(0,0,0,.18)`.
- Wordmark "Schedoughler": Bitter 800, 24px, `#2E2218`, letter-spacing −0.01em.
- Sub-label "BROT NACH PLAN": 12px, 600, `#9A8156`, uppercase, letter-spacing 0.04em.

#### 2. Recipe picker
- Section label "REZEPT WÄHLEN": 11px, 700, `#A8946C`, uppercase, letter-spacing 0.1em.
- Horizontal scroll row of recipe chips, `gap: 10px`.
- **Chip** (min-width 120px): column layout, padding 13×15px, `border-radius: 16px`.
  - Unselected: background `#FBF5EA`, border `1.5px solid #E5D5BB`. Name `#2E2218`,
    meta `#A8946C`.
  - Selected: background `#6B4426`, border `1.5px solid #6B4426`. Name `#FBF5EA`,
    meta (total time) `#E7C9A0`.
  - Name: Bitter 700, 14.5px. Meta: 11px, 600. Transition `all .15s`.

#### 3. Setup card (background `#FBF5EA`, border `1px solid #EADCC4`, radius 20px, padding 18px)
- Recipe name (Bitter 700, 17px, `#2E2218`) + subtitle (12.5px, 500, `#9A8156`).
- Label "BROT FERTIG AM" (11px, 700, `#A8946C`, uppercase).
- **Date input** (flex:1) + **Time input** (width 108px), `gap:10px`.
  Each: background `#F4EBDD`, border `1px solid #E5D5BB`, radius 12px, padding
  11×12px, Bitter serif, 15px, 600, `#3D2817`.
  → On native, replace with the platform date/time picker.
- **Start banner** (gradient `linear-gradient(180deg,#6B4426,#5a3820)`, radius 14px,
  padding 14px): left side label "JETZT LOSLEGEN" (11px, 700, `#E7C9A0`) + the
  computed start day/time (Bitter 800, 21px, `#FBF5EA`); right side "Gesamt" +
  total duration (Bitter 700, 15px, `#FBF5EA`).

#### 4. Step timeline — section label "ABLAUF"
Each step is a row: `[time column 60px] [rail 28px] [content card flex:1]`, `gap:12px`.

- **Time column** (right-aligned): start time (Bitter 700, 18px, **colored by step
  kind**) + day label below (10.5px, 600, `#A8946C`).
- **Rail**: vertical connector line `2px` wide `#E2D5BF`; a 16×16 dot colored by
  kind with a 4px cream halo + faint colored ring
  (`box-shadow: 0 0 0 4px #F4EBDD, 0 0 0 5px <kind>55`).
- **Content card**: radius 16px, padding 13×15px.
  - **Normal step:** background `#FBF5EA`, border `1px solid #EADCC4`.
  - **Overnight step (`sleep:true`):** background `#EBEEF3`, border `1px solid #D6DEE6`
    (blue-grey), PLUS a pill top-right: "über Nacht", background `#3D3450`, text
    `#EDE9F4`, 10px 700, radius 999px, with a small crescent-moon dot
    (a circle with `box-shadow: inset -3px -1px 0 0 #EDE9F4`).
  - Title: Bitter 700, 15.5px, `#2E2218`. Description: 12.5px, `#6E6253`, line-height 1.45.
  - Meta row: a **kind pill** (background `<kind>22`, text `<kind>`, 11px 700,
    radius 999px) + duration label (11.5px, 600, `#9A8156`).
  - **Flexible step (`min` present):** a divider (`1px dashed #E7D6BB`) then:
    - label "GÄRZEIT ANPASSEN" (10.5px, 700, `#B6A485`) + range label right
      (e.g. "8–14 Std").
    - Two buttons, `gap:8px`: **"‹ früher beginnen"** and **"später ›"**.
      Button: padding 9×13px, radius 11px, border `1px solid #E0CBA8`,
      background `#F4EBDD`, text `#6B4426`, 12.5px 700. Disabled state:
      `opacity:.3; pointer-events:none` (früher disabled at max, später at min).
  - **Last step only:** divider then "Brot fertig" + the finish time
    (Bitter 800, 17px, `#B5532A`).
- Footer note: "Zeiten rückwärts berechnet · Raumtemperatur ~22 °C"
  (11px, 600, `#C2B393`, centered).

---

## Interactions & Behavior
- **Select recipe** → switches active recipe, resets `overrides` to `{}`, and
  recomputes a fresh default finish time (`defaultFinishTime`).
- **Change date / time** → updates the target finish; whole timeline recomputes.
- **"früher beginnen" / "später ›"** → on a flexible step, lengthens / shortens
  that step's duration by `step.step` minutes, clamped to `[min,max]`. Because
  times are derived backwards from the fixed finish, lengthening a step moves its
  (and all earlier steps') start **earlier**; shortening moves them **later**.
  Buttons disable at the range bounds.
- All recalculation is **synchronous and instant** — no async, no fetching.
- No animations beyond the chip `all .15s` color transition. Keep it calm.

## State Management
Minimal. Three pieces of state drive everything:
```
recipeId   : string          // which recipe is selected
finishAt   : Date            // target "bread done" moment
overrides  : { [stepIndex:number]: minutes }  // per flexible-step duration override
```
Everything displayed is **derived** from these via `computeSchedule()` — do not
store computed times in state; recompute on render. Persist all three (e.g.
AsyncStorage / localStorage) so an in-progress plan survives app restart.

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| Cream background | `#F4EBDD` | app canvas |
| Card cream | `#FBF5EA` | cards, inputs-bg accents |
| Card border | `#EADCC4` | card borders |
| Brown primary | `#6B4426` | brand, selected chip, start banner |
| Brown dark | `#5a3820` | banner gradient bottom |
| Ink | `#2E2218` | primary text |
| Ink soft | `#3D2817` | input text |
| Muted brown | `#9A8156` | secondary text |
| Muted tan | `#A8946C` | section labels |
| Faint tan | `#C2B393` | footer note |
| Accent gold (prep) | `#C28A3D` | kind: Handarbeit |
| Accent olive (rise) | `#A8894E` | kind: Gärzeit |
| Accent slate (cold) | `#6E8597` | kind: Kühlschrank |
| Accent rust (bake) | `#B5532A` | kind: Backen, "fertig" |
| Overnight bg | `#EBEEF3` | sleep step card |
| Overnight border | `#D6DEE6` | sleep step card border |
| Overnight pill bg | `#3D3450` | "über Nacht" pill |
| Overnight pill text | `#EDE9F4` | pill text |
| Cream subtle (gold accents) | `#E7C9A0` | banner labels |

Kind pill background = kind color + `22` alpha hex; faint ring = kind color + `55`.

### Typography
- **Display / numerals / brand:** `Bitter` (serif), weights 700/800. Google Fonts.
- **Body / UI:** `Hanken Grotesk` (sans), weights 400/500/600/700. Google Fonts.
- Scale used: 24 (wordmark) / 21 (start time) / 18 (step time) / 17 (recipe name,
  fertig) / 15.5 (step title) / 15 (inputs) / 14.5 (chip name) / 12.5 (desc,
  buttons) / 11.5 (duration) / 11 (section labels) / 10.5 (day, micro-labels).

### Spacing / radius / shadow
- Radii: chips/inputs 11–16px, cards 16–20px, pills 999px, phone frame 46px.
- Card padding 18px; step card padding 13×15px.
- Section gaps ~18–24px; step row gap 12px.
- Dots use layered `box-shadow` halos (see timeline spec). No heavy drop shadows
  in content; the only large shadow is the phone frame in the prototype (drop in production).

## Assets
- **No bitmap/icon assets.** The "S" logo is a styled text glyph. The crescent
  moon on the overnight pill is a CSS `box-shadow` trick on a circle — reproduce
  with an icon (e.g. a moon glyph) on native if easier.
- **Fonts:** Bitter + Hanken Grotesk from Google Fonts (bundle them in the app).
- `recipe-source.pdf` — the original German sourdough recipe, for reference /
  verifying step descriptions and durations.

## Recipe data model (see `scheduler.js` for the full data + functions)
```
recipe = { id, name, totalShort, subtitle, steps: [step, ...] }
step   = {
  title, desc,
  dur,                       // default duration in MINUTES
  kind,                      // 'prep' | 'rise' | 'cold' | 'bake'
  sleep?: true,              // overnight → blue highlight + pill
  min?, max?, step?          // present → flexible (range-adjustable) step
}
```
`scheduler.js` exports: `RECIPES`, `KINDS`, `computeSchedule(recipe, finishAt,
overrides)`, `defaultFinishTime(recipe)`, `nudgeDuration(...)`, `rangeLabel(step)`,
`durationLabel(min)`, `effectiveDuration(step, override)`. **Reuse these verbatim.**

## Out of scope (suggested next features, not part of this handoff)
- **Local notifications** at each step's start time — the killer feature; wire
  each `step.start` to a scheduled OS notification.
- **Live / active-bake mode** — highlight the current/next step against the clock.
- **User-editable & custom recipes** — CRUD on the recipe model.
- **Room-temperature adjustment** — scale rise durations by ambient temp.

## Files in this bundle
| File | What it is |
|---|---|
| `scheduler.js` | ⭐ Recipe data + backward-scheduling engine. Drop-in, no deps. |
| `Schedoughler.dc.html` | The editable prototype source (markup + logic). |
| `Schedoughler.standalone.html` | Self-contained build — open in any browser to interact with the reference. |
| `recipe-source.pdf` | Original German sourdough recipe (Marcel Paa). |
| `README.md` | This document. |
