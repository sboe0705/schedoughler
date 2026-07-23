#!/usr/bin/env bash
#
# check-critical-times.sh
# -----------------------
# Reads every recipe from src/scheduler.js and simulates its schedule, using
# each recipe's `idealFinish` clock time as the moment the bread is done
# (bake time). Each step's start/end is derived by walking backwards from that
# finish, exactly like the app does. If a step's actionable moment (its start)
# falls inside a "critical" time period — a window when the baker is asleep or
# away — a warning is printed.
#
# Usage:  ./check-critical-times.sh [-w | --only-warnings]
#
#   -w, --only-warnings   Print only recipes that have at least one step
#                         starting in a critical window (hide the clean ones).
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
usage() {
  cat <<'USAGE'
Usage: check-critical-times.sh [-w | --only-warnings]

Simulates every recipe in src/scheduler.js using its idealFinish clock time as
the "bread done" moment, then warns when a step's start falls inside a critical
time window (asleep / away). Edit CRITICAL_PERIODS in this script to configure.

Options:
  -w, --only-warnings   Print only recipes with at least one critical step.
  -h, --help            Show this help and exit.
USAGE
}

ONLY_WARNINGS=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    -w|--only-warnings) ONLY_WARNINGS=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "error: unknown argument '$1' (try --help)" >&2
      exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
# Critical time periods, as "HH:MM-HH:MM" on a 24-hour clock. A period may wrap
# past midnight (start later than end), e.g. "22:00-05:00". Edit / add freely.
CRITICAL_PERIODS=(
  "22:00-05:00"   # night  — asleep
  "09:00-16:00"   # daytime — at work / away
)

# Reference calendar day the simulation is anchored to (the finish lands on this
# date at the recipe's idealFinish time). Only the weekday/time layout matters,
# not the absolute date. "today" or an ISO date like "2026-07-23".
REFERENCE_DAY="today"
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEDULER="$SCRIPT_DIR/src/scheduler.js"

if [[ ! -f "$SCHEDULER" ]]; then
  echo "error: cannot find $SCHEDULER" >&2
  exit 1
fi

# Join the periods array into a comma-separated string for the Node process.
PERIODS_JOINED=$(IFS=,; echo "${CRITICAL_PERIODS[*]}")

REF_MS=$(date -d "$REFERENCE_DAY 00:00:00" +%s%3N)

CRITICAL_PERIODS="$PERIODS_JOINED" REFERENCE_MS="$REF_MS" SCHEDULER_PATH="$SCHEDULER" \
ONLY_WARNINGS="$ONLY_WARNINGS" \
node --input-type=module <<'NODE'
import { pathToFileURL } from 'node:url';

const { RECIPES, computeSchedule } = await import(
  pathToFileURL(process.env.SCHEDULER_PATH).href
);

// --- Parse critical periods into minute-of-day ranges ----------------------
const periods = (process.env.CRITICAL_PERIODS || '')
  .split(',').map(s => s.trim()).filter(Boolean)
  .map(p => {
    const [a, b] = p.split('-');
    const [sh, sm] = a.split(':').map(Number);
    const [eh, em] = b.split(':').map(Number);
    return { label: p, start: sh * 60 + sm, end: eh * 60 + em };
  });

/** Return the matching critical period for a Date, or null. Handles wrap. */
function inCritical(date) {
  const m = date.getHours() * 60 + date.getMinutes();
  for (const p of periods) {
    const hit = p.start <= p.end
      ? (m >= p.start && m < p.end)
      : (m >= p.start || m < p.end);
    if (hit) return p;
  }
  return null;
}

const refBase = new Date(Number(process.env.REFERENCE_MS));
const onlyWarnings = process.env.ONLY_WARNINGS === '1';

const hhmm = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Count steps whose START lands in a critical window, for a given finish
 *  time-of-day (minutes since midnight). Everything shifts rigidly with the
 *  finish, so this is just the schedule rotated around the clock. */
function countCriticalStarts(recipe, finishMin) {
  const f = new Date(refBase);
  f.setHours(0, finishMin, 0, 0);
  let n = 0;
  for (const s of computeSchedule(recipe, f).steps) if (inCritical(s.start)) n++;
  return n;
}

/** Circular distance between two minute-of-day values (max 720). */
const clockDist = (a, b) => { const d = Math.abs(a - b); return Math.min(d, 1440 - d); };

/** Scan the 24 h clock (15-min grid) for the finish time with the fewest
 *  critical step-starts; ties broken by staying closest to the current ideal. */
function suggestFinish(recipe, currentMin) {
  let best = null;
  for (let m = 0; m < 1440; m += 15) {
    const n = countCriticalStarts(recipe, m);
    const dist = clockDist(m, currentMin);
    if (!best || n < best.n || (n === best.n && dist < best.dist)) best = { m, n, dist };
  }
  return best;
}

const fmtDay = new Intl.DateTimeFormat('de-DE', { weekday: 'short' });
const fmtTime = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
const stamp = d => `${fmtDay.format(d)} ${fmtTime.format(d)}`;

const C = process.stdout.isTTY
  ? { red: s => `\x1b[31m${s}\x1b[0m`, yellow: s => `\x1b[33m${s}\x1b[0m`,
      green: s => `\x1b[32m${s}\x1b[0m`, dim: s => `\x1b[2m${s}\x1b[0m`,
      bold: s => `\x1b[1m${s}\x1b[0m` }
  : { red: s => s, yellow: s => s, green: s => s, dim: s => s, bold: s => s };

console.log(C.bold('Kritische Zeitfenster:'), periods.map(p => p.label).join('  '));
console.log(C.dim(`Simulierte Fertigstellung am ${fmtDay.format(refBase)}, ${fmtTime.format(refBase)}-Basis · Startzeit jedes Schritts geprüft\n`));

let recipesWithWarnings = 0;
let totalWarnings = 0;

for (const recipe of RECIPES) {
  if (!recipe.idealFinish) {
    if (!onlyWarnings) console.log(C.yellow(`⏭  ${recipe.name} — kein idealFinish, übersprungen\n`));
    continue;
  }

  const finishAt = new Date(refBase);
  finishAt.setHours(recipe.idealFinish.hour, recipe.idealFinish.minute, 0, 0);

  const { steps, startAt } = computeSchedule(recipe, finishAt);

  const warnings = [];
  const lines = steps.map((s, i) => {
    const hit = inCritical(s.start);
    if (hit) warnings.push({ i, step: s, period: hit });
    const marker = hit ? C.red('⚠') : ' ';
    const range = `${stamp(s.start)} → ${stamp(s.end)}`;
    const label = hit
      ? C.red(`${s.title}  [Start in ${hit.label}]`)
      : s.title;
    return `   ${marker} ${range}  ${label}`;
  });

  if (warnings.length) {
    recipesWithWarnings++;
    totalWarnings += warnings.length;
  }

  // With --only-warnings, suppress recipes that have no critical steps.
  if (onlyWarnings && !warnings.length) continue;

  const header = warnings.length
    ? C.red(`✗ ${recipe.name}`)
    : C.green(`✓ ${recipe.name}`);
  console.log(`${header}  ${C.dim(`(Start ${stamp(startAt)} · Fertig ${stamp(finishAt)})`)}`);
  lines.forEach(l => console.log(l));

  if (warnings.length) {
    console.log(C.red(`   → ${warnings.length} Schritt(e) in kritischem Zeitfenster.`));

    const curMin = recipe.idealFinish.hour * 60 + recipe.idealFinish.minute;
    const best = suggestFinish(recipe, curMin);
    if (best.n < warnings.length && best.m !== curMin) {
      const detail = best.n === 0
        ? 'keine kritischen Schritte mehr'
        : `nur noch ${best.n} kritische(r) Schritt(e)`;
      console.log(C.green(`   💡 Bessere Fertigzeit: ${hhmm(best.m)} — ${detail} (statt ${warnings.length}).`));
    } else {
      console.log(C.dim(`   (keine bessere Fertigzeit im 24-h-Raster gefunden — ${warnings.length} bleibt das Minimum.)`));
    }
  }
  console.log();
}

console.log(C.bold('Zusammenfassung:'),
  totalWarnings === 0
    ? C.green('keine kritischen Schritte 🎉')
    : C.red(`${totalWarnings} kritische Schritt-Starts in ${recipesWithWarnings} Rezept(en).`));
NODE
