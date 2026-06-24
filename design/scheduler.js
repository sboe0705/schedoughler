/**
 * Schedoughler — scheduling engine (framework-agnostic, no UI dependencies)
 * --------------------------------------------------------------------------
 * Pure JavaScript. Copy this file straight into a React / React Native / Vue /
 * Node project. It contains the recipe data model and the backward
 * time-calculation that the whole app is built around.
 *
 * Core idea: the user fixes the moment the bread is FINISHED. Every step's
 * start/end time is computed by walking the step list backwards from that
 * finish time, subtracting each step's duration. Flexible steps (proofs with a
 * min/max range) can be nudged longer/shorter, which moves the START earlier or
 * later while the finish stays pinned.
 */

// ---------------------------------------------------------------------------
// Step "kinds" — drive the colour + label of each step in the UI.
// ---------------------------------------------------------------------------
export const KINDS = {
  prep: { color: '#C28A3D', label: 'Handarbeit' },   // active hands-on work
  rise: { color: '#A8894E', label: 'Gärzeit' },      // room-temp proof
  cold: { color: '#6E8597', label: 'Kühlschrank' },  // cold/retard proof
  bake: { color: '#B5532A', label: 'Backen' },       // in the oven
};

// ---------------------------------------------------------------------------
// Recipe data model.
//   recipe.source       optional { url, title }: link to the original recipe.
//                       When present, the UI shows a small link icon by the name.
//   step.dur            default duration in MINUTES
//   step.min/max/step   present => step is "flexible" (range adjustable in UI)
//   step.kind           key into KINDS
//   step.sleep          true => overnight step (blue highlight + "über Nacht")
//   step.ingredients    optional array of Ingredient objects — what to add/use at
//                       this step. Shown as a small list inside the step card.
//                       Only on steps where new ingredients are introduced.
//
// Ingredient object:
//   amount  number (omit for references like the preferment)
//   unit    string such as 'g' or 'ml' (omit when not applicable)
//   name    ingredient name
//   note    optional parenthetical, e.g. 'handwarm' or 'Weizenmehl Type 550'
// ---------------------------------------------------------------------------
export const RECIPES = [
  {
    id: 'sauerteig',
    name: 'Sauerteigbrot',
    totalShort: '~28 Std',
    subtitle: 'Knusprige Kruste, aromatische Krume · Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/sauerteig-brot/', title: 'Originalrezept auf marcelpaa.com' },
    steps: [
      { title: 'Vorteig ansetzen', dur: 15, kind: 'prep', ingredients: [{ amount: 30, unit: 'g', name: 'Sauerteig' }, { amount: 110, unit: 'g', name: 'Wasser', note: 'handwarm' }, { amount: 145, unit: 'g', name: 'Weissmehl', note: 'Weizenmehl Type 405/550' }], desc: 'Sauerteig, handwarmes Wasser und Weissmehl verkneten, zur Kugel formen und im Gefäss markieren.' },
      { title: 'Vorteig gären lassen', dur: 720, min: 480, max: 840, step: 30, kind: 'rise', sleep: true, desc: 'Bei Raumtemperatur gehen lassen, bis sich das Volumen verdreifacht hat.' },
      { title: 'Hauptteig kneten', dur: 15, kind: 'prep', ingredients: [{ name: 'Reifer Vorteig', note: 'komplett' }, { amount: 300, unit: 'g', name: 'Wasser', note: 'handwarm' }, { amount: 285, unit: 'g', name: 'Weissmehl', note: 'Weizenmehl Type 405/550' }, { amount: 140, unit: 'g', name: 'Roggenmehl hell', note: 'Type 610/815' }, { amount: 9, unit: 'g', name: 'Salz' }], desc: 'Alle Zutaten 10–12 Min. kneten, bis der Teig die Fensterprobe besteht.' },
      { title: 'Stockgare', dur: 120, min: 90, max: 180, step: 15, kind: 'rise', desc: 'Rund vorformen und zugedeckt bei Raumtemperatur aufgehen lassen.' },
      { title: 'Rund formen', dur: 15, kind: 'prep', desc: 'Teig schleifen, Spannung aufbauen und mit Verschluss nach oben in den bemehlten Gärkorb setzen.' },
      { title: 'Stückgare im Kühlschrank', dur: 720, min: 600, max: 960, step: 30, kind: 'cold', sleep: true, desc: 'Zugedeckt im Kühlschrank reifen lassen – entwickelt Aroma und Triebkraft.' },
      { title: 'Ofen vorheizen', dur: 45, kind: 'prep', desc: 'Mit Gusseisentopf auf 230 °C Ober-/Unterhitze vorheizen.' },
      { title: 'Einschneiden & backen', dur: 50, kind: 'bake', desc: 'Stürzen, übers Kreuz einschneiden, 40 Min. im Topf, dann 10 Min. offen ausbacken.' },
    ],
  },
  {
    id: 'weizen',
    name: 'Helles Weizenbrot',
    totalShort: '~3,5 Std',
    subtitle: 'Locker und schnell – ein Hefebrot für denselben Tag',
    steps: [
      { title: 'Teig kneten', dur: 15, kind: 'prep', ingredients: [{ amount: 500, unit: 'g', name: 'Weissmehl', note: 'Type 550' }, { amount: 320, unit: 'g', name: 'Wasser', note: 'handwarm' }, { amount: 7, unit: 'g', name: 'Trockenhefe' }, { amount: 10, unit: 'g', name: 'Salz' }], desc: 'Mehl, Wasser, Hefe und Salz glatt und geschmeidig auskneten.' },
      { title: 'Stockgare', dur: 90, min: 60, max: 150, step: 15, kind: 'rise', desc: 'Zugedeckt gehen lassen, bis sich das Volumen verdoppelt hat.' },
      { title: 'Formen', dur: 10, kind: 'prep', desc: 'Entgasen, straff zu einem Laib formen und in den Gärkorb legen.' },
      { title: 'Stückgare', dur: 45, min: 30, max: 75, step: 15, kind: 'rise', desc: 'Bei Raumtemperatur bis zur vollen Gare aufgehen lassen.' },
      { title: 'Ofen vorheizen', dur: 30, kind: 'prep', desc: 'Mit Backstein oder Blech auf 240 °C vorheizen, Schwaden vorbereiten.' },
      { title: 'Backen', dur: 40, kind: 'bake', desc: 'Einschneiden, mit Dampf anbacken, dann goldbraun ausbacken.' },
    ],
  },
  {
    id: 'roggen',
    name: 'Roggenmischbrot',
    totalShort: '~16 Std',
    subtitle: 'Kräftig & saftig – Sauerteig mit Roggen und Weizen',
    steps: [
      { title: 'Sauerteig auffrischen', dur: 10, kind: 'prep', ingredients: [{ amount: 50, unit: 'g', name: 'Anstellgut' }, { amount: 200, unit: 'g', name: 'Roggenmehl', note: 'Type 1150' }, { amount: 200, unit: 'g', name: 'Wasser', note: 'handwarm' }], desc: 'Anstellgut mit Roggenmehl und Wasser verrühren.' },
      { title: 'Sauerteig reifen', dur: 720, min: 600, max: 900, step: 30, kind: 'rise', sleep: true, desc: 'Über Nacht bei Raumtemperatur reifen lassen, bis er schön sauer duftet.' },
      { title: 'Hauptteig mischen', dur: 15, kind: 'prep', ingredients: [{ name: 'Reifer Sauerteig', note: 'komplett' }, { amount: 300, unit: 'g', name: 'Wasser', note: 'handwarm' }, { amount: 300, unit: 'g', name: 'Weizenmehl', note: 'Type 1050' }, { amount: 250, unit: 'g', name: 'Roggenmehl', note: 'Type 1150' }, { amount: 14, unit: 'g', name: 'Salz' }], desc: 'Sauerteig mit Roggen-, Weizenmehl, Wasser und Salz zu einem klebrigen Teig mischen.' },
      { title: 'Teigruhe', dur: 60, min: 30, max: 90, step: 15, kind: 'rise', desc: 'Abgedeckt entspannen lassen.' },
      { title: 'Formen', dur: 15, kind: 'prep', desc: 'Mit nassen Händen rund wirken und in den Gärkorb setzen.' },
      { title: 'Stückgare', dur: 90, min: 60, max: 120, step: 15, kind: 'rise', desc: 'Gehen lassen, bis sich feine Risse an der Oberfläche zeigen.' },
      { title: 'Ofen vorheizen', dur: 45, kind: 'prep', desc: 'Auf 250 °C vorheizen, fallend backen.' },
      { title: 'Backen', dur: 60, kind: 'bake', desc: 'Kräftig mit Schwaden anbacken und dunkel ausbacken.' },
    ],
  },
  {
    id: 'broetchen',
    name: 'Übernacht-Brötchen',
    totalShort: '~12 Std',
    subtitle: 'Knusprige Frühstücksbrötchen ohne Kneten',
    steps: [
      { title: 'Teig anrühren', dur: 10, kind: 'prep', ingredients: [{ amount: 500, unit: 'g', name: 'Weissmehl', note: 'Type 550' }, { amount: 350, unit: 'g', name: 'Wasser', note: 'kalt' }, { amount: 2, unit: 'g', name: 'Trockenhefe' }, { amount: 10, unit: 'g', name: 'Salz' }], desc: 'Alle Zutaten mit wenig Hefe nur kurz vermengen – nicht kneten.' },
      { title: 'Übernachtgare im Kühlschrank', dur: 600, min: 480, max: 840, step: 30, kind: 'cold', sleep: true, desc: 'Zugedeckt über Nacht im Kühlschrank reifen lassen.' },
      { title: 'Abstechen & formen', dur: 20, kind: 'prep', desc: 'Teig auf die bemehlte Fläche geben und Brötchen abstechen.' },
      { title: 'Stückgare', dur: 30, min: 20, max: 60, step: 10, kind: 'rise', desc: 'Kurz akklimatisieren und antreiben lassen.' },
      { title: 'Ofen vorheizen', dur: 30, kind: 'prep', desc: 'Auf 240 °C vorheizen, Schwaden vorbereiten.' },
      { title: 'Backen', dur: 20, kind: 'bake', desc: 'Mit Dampf knusprig goldbraun backen.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clamp an overridden duration for a flexible step into its [min,max] range. */
export function effectiveDuration(step, override) {
  if (step.min == null) return step.dur;            // fixed step
  const base = override != null ? override : step.dur;
  return Math.min(step.max, Math.max(step.min, base));
}

/**
 * THE CORE FUNCTION.
 * Compute absolute start/end timestamps for every step by walking backwards
 * from the finish time.
 *
 * @param {object} recipe   one entry from RECIPES
 * @param {Date}   finishAt the moment the bread should be done
 * @param {object} overrides map of "stepIndex" -> minutes, for flexible steps
 *                           e.g. { 1: 840 } makes step 1 last 14 h
 * @returns {{
 *   steps: Array<{...step, dur, start: Date, end: Date}>,
 *   startAt: Date,        // when the baker must begin
 *   finishAt: Date,
 *   totalMinutes: number
 * }}
 */
export function computeSchedule(recipe, finishAt, overrides = {}) {
  const steps = recipe.steps.map((s, i) => ({
    ...s,
    dur: effectiveDuration(s, overrides[i]),
  }));

  let cursor = finishAt.getTime();
  for (let i = steps.length - 1; i >= 0; i--) {
    steps[i].end = new Date(cursor);
    cursor -= steps[i].dur * 60000;
    steps[i].start = new Date(cursor);
  }

  const totalMinutes = steps.reduce((a, s) => a + s.dur, 0);
  return {
    steps,
    startAt: steps[0].start,
    finishAt,
    totalMinutes,
  };
}

/**
 * Suggest a sensible default finish time for a freshly-selected recipe:
 * now + total duration + ~1h slack, rounded up to the next whole hour.
 */
export function defaultFinishTime(recipe, now = new Date()) {
  const total = recipe.steps.reduce((a, s) => a + s.dur, 0);
  const t = new Date(now.getTime() + total * 60000 + 75 * 60000);
  t.setMinutes(0, 0, 0);
  t.setHours(t.getHours() + 1);
  return t;
}

/** Adjust a flexible step's override by ±step, clamped. dir=+1 longer, -1 shorter. */
export function nudgeDuration(recipe, overrides, stepIndex, dir) {
  const s = recipe.steps[stepIndex];
  if (s.min == null) return overrides;
  const cur = overrides[stepIndex] != null ? overrides[stepIndex] : s.dur;
  const next = Math.min(s.max, Math.max(s.min, cur + dir * s.step));
  return { ...overrides, [stepIndex]: next };
}

/** Human range label, e.g. "8–14 Std" or "20–60 Min". */
export function rangeLabel(step) {
  if (step.min == null) return '';
  const hrs = (m) => {
    const h = m / 60;
    return (Number.isInteger(h) ? h : h.toFixed(1).replace('.', ',')) + ' Std';
  };
  return step.min >= 60
    ? hrs(step.min) + '–' + hrs(step.max)
    : step.min + '–' + step.max + ' Min';
}

/** Human duration label, e.g. "12 Std 30 Min". */
export function durationLabel(minutes) {
  if (minutes < 60) return minutes + ' Min';
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m ? `${h} Std ${m} Min` : `${h} Std`;
}
