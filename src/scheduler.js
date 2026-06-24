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
//   step.dur            default duration in MINUTES
//   step.min/max/step   present => step is "flexible" (range adjustable in UI)
//   step.kind           key into KINDS
//   step.sleep          true => overnight step (blue highlight + "über Nacht")
//   step.ingredients    optional array of { amount?, unit?, name, note? }
// ---------------------------------------------------------------------------
export const RECIPES = [
  {
    id: 'sauerteig',
    name: 'Sauerteigbrot',
    totalShort: '~28 Std',
    subtitle: 'Knusprige Kruste, aromatische Krume · Marcel Paa',
    steps: [
      { title: 'Vorteig ansetzen', dur: 15, kind: 'prep', desc: 'Sauerteig, handwarmes Wasser und Weissmehl verkneten, zur Kugel formen und im Gefäss markieren.', ingredients: [
        { amount: 30,  unit: 'g', name: 'Sauerteig' },
        { amount: 110, unit: 'g', name: 'Wasser',    note: 'handwarm' },
        { amount: 145, unit: 'g', name: 'Weissmehl', note: 'Weizenmehl Type 405/550' },
      ] },
      { title: 'Vorteig gären lassen', dur: 720, min: 480, max: 840, step: 30, kind: 'rise', sleep: true, desc: 'Bei Raumtemperatur gehen lassen, bis sich das Volumen verdreifacht hat.' },
      { title: 'Hauptteig kneten', dur: 15, kind: 'prep', desc: 'Alle Zutaten 10–12 Min. kneten, bis der Teig die Fensterprobe besteht.', ingredients: [
        {                         name: 'Vorteig' },
        { amount: 300, unit: 'g', name: 'Wasser',          note: 'handwarm' },
        { amount: 140, unit: 'g', name: 'Roggenmehl hell', note: 'Roggenmehl Type 610 oder 815' },
        { amount: 285, unit: 'g', name: 'Weissmehl',       note: 'Weizenmehl Type 405/550' },
        { amount: 9,   unit: 'g', name: 'Salz' },
      ] },
      { title: 'Stockgare', dur: 120, min: 90, max: 180, step: 15, kind: 'rise', desc: 'Rund vorformen und zugedeckt bei Raumtemperatur aufgehen lassen.' },
      { title: 'Rund formen', dur: 15, kind: 'prep', desc: 'Teig schleifen, Spannung aufbauen und mit Verschluss nach oben in den bemehlten Gärkorb setzen.' },
      { title: 'Stückgare im Kühlschrank', dur: 720, min: 600, max: 960, step: 30, kind: 'cold', sleep: true, desc: 'Zugedeckt im Kühlschrank reifen lassen – entwickelt Aroma und Triebkraft.' },
      { title: 'Ofen vorheizen', dur: 45, kind: 'prep', desc: 'Mit Gusseisentopf auf 230 °C Ober-/Unterhitze vorheizen.' },
      { title: 'Einschneiden & backen', dur: 50, kind: 'bake', desc: 'Stürzen, übers Kreuz einschneiden, 40 Min. im Topf, dann 10 Min. offen ausbacken.' },
    ],
  },
  {
    id: "sauerteig-cracker",
    name: "Sauerteig Cracker",
    totalShort: "~3,5 Std",
    subtitle: "Knuspriges Knäckebrot aus Anstellgut – Marcel Paa",
    steps: [
      {
        title: "Teig mischen",
        dur: 15,
        kind: "prep",
        desc: "Anstellgut im Wasser aufschlämmen, Mehl einrühren, dann Salz, Olivenöl, Sesam, Lein und Haferflocken dazugeben und von Hand zu einem Teig mischen.",
        ingredients: [
          { amount: 60, unit: "ml", name: "Wasser", note: "ca. 40 Grad" },
          { amount: 60, unit: "g", name: "Sauerteig (Anstellgut)", note: "alternativ 1 g Frischhefe" },
          { amount: 90, unit: "g", name: "Dinkel Vollkornmehl" },
          { amount: 4, unit: "g", name: "Salz" },
          { amount: 20, unit: "g", name: "Olivenöl" },
          { amount: 10, unit: "g", name: "Sesamsamen" },
          { amount: 10, unit: "g", name: "Leinsamen" },
          { amount: 20, unit: "g", name: "Haferflocken" },
        ],
      },
      {
        title: "Stockgare",
        dur: 150,
        min: 150,
        max: 180,
        step: 15,
        kind: "rise",
        desc: "Teig abgedeckt bei Raumtemperatur 2,5–3 Stunden aufgehen lassen.",
      },
      {
        title: "Ofen vorheizen",
        dur: 15,
        kind: "prep",
        desc: "Backofen auf 210 °C Ober-/Unterhitze vorheizen.",
      },
      {
        title: "Formen & schneiden",
        dur: 10,
        kind: "prep",
        desc: "Teig zwischen zwei Backpapieren auf ca. 1 mm ausrollen, oberes Papier entfernen, mit Sesam oder Leinsamen bestreuen und mit dem Teigschneider in 5×5 cm Stücke einteilen.",
      },
      {
        title: "Backen",
        dur: 12,
        min: 10,
        max: 15,
        step: 1,
        kind: "bake",
        desc: "Cracker auf dem Backpapier in der Ofenmitte bei 210 °C Ober-/Unterhitze goldbraun und knusprig ausbacken, dann vollständig auskühlen lassen.",
      },
    ],
  },
  {
    id: 'guinness-brot',
    name: 'Guinness Brot',
    totalShort: '~15 Std',
    subtitle: 'Würzig-malziges Sauerteigbrot mit Guinness – von Marcel Paa',
    steps: [
      {
        title: 'Teig kneten',
        dur: 17,
        kind: 'prep',
        desc: 'Alle Zutaten in der Küchenmaschine 2–3 Min. auf kleiner Stufe, dann weitere 12–15 Min. auf höherer Stufe zu einem glatten Teig kneten.',
        ingredients: [
          { amount: 400, unit: 'g', name: 'Ruchmehl', note: 'Weizenmehl Type 1050' },
          { amount: 100, unit: 'g', name: 'Weizen Vollkornmehl' },
          { amount: 100, unit: 'g', name: 'Sauerteig' },
          { amount: 5,   unit: 'g', name: 'Frischhefe' },
          { amount: 10,  unit: 'g', name: 'Salz' },
          { amount: 4,   unit: 'g', name: 'Röstmalz' },
          { amount: 30,  unit: 'g', name: 'Honig' },
          { amount: 400, unit: 'g', name: 'Guinness' },
        ],
      },
      {
        title: 'Stockgare',
        dur: 60,
        kind: 'rise',
        desc: 'Teig in ein leicht gefettetes Becken legen, abdecken und 60 Min. bei Raumtemperatur ruhen lassen.',
      },
      {
        title: 'Dehnen & Falten',
        dur: 5,
        kind: 'prep',
        desc: 'Teig mit nassen Händen von allen vier Seiten dehnen und zur Mitte falten.',
      },
      {
        title: 'Kaltgare',
        dur: 840,
        min: 720,
        max: 960,
        step: 30,
        kind: 'cold',
        sleep: true,
        desc: 'Teig abgedeckt 12–16 Std. im Kühlschrank ruhen lassen.',
      },
      {
        title: 'Akklimatisieren',
        dur: 60,
        kind: 'rise',
        desc: 'Teig 1 Stunde vor der Weiterverarbeitung bei Raumtemperatur akklimatisieren lassen.',
      },
      {
        title: 'Formen',
        dur: 10,
        kind: 'prep',
        desc: 'Teig auf bemehlter Fläche rund vorformen, dann straff länglich formen und auf Backpapier absetzen.',
      },
      {
        title: 'Ofen vorheizen',
        dur: 45,
        kind: 'prep',
        desc: 'Ofen mit Backstahl in der unteren Hälfte auf 250 °C Ober-/Unterhitze vorheizen.',
      },
      {
        title: 'Stückgare',
        dur: 45,
        min: 40,
        max: 50,
        step: 5,
        kind: 'rise',
        desc: 'Teigling abgedeckt 40–50 Min. bei Raumtemperatur aufgehen lassen.',
      },
      {
        title: 'Einschießen & Backen',
        dur: 55,
        kind: 'bake',
        desc: 'Oberfläche mit Guinness bestreichen, längs einschneiden, auf den heißen Backstahl einschießen; Ofen sofort auf 210 °C reduzieren, Dampf erzeugen und 20 Min. backen; Dampf ablassen, weitere 35 Min. fertig backen.',
        ingredients: [
          { name: 'Guinness', note: 'zum Bestreichen' },
        ],
      },
    ],
  },
  {
    id: 'pane-di-altamura',
    name: 'Pane di Altamura',
    totalShort: '~14 Std',
    subtitle: 'Hartweizenmehl-Sauerteigbrot mit langer Kaltgare – von Oliver',
    steps: [
      {
        title: 'Autolyse',
        dur: 60,
        kind: 'rise',
        desc: 'Mehl und Wasser grob mischen und 1 Stunde zur Autolyse stehen lassen.',
        ingredients: [
          { amount: 440, unit: 'g', name: 'Hartweizenmehl', note: 'Semola rimacinata' },
          { amount: 300, unit: 'g', name: 'Wasser' },
        ],
      },
      {
        title: 'LM & Salz einarbeiten',
        dur: 5,
        kind: 'prep',
        desc: 'Lievito Madre und Salz zum Autolyseteig geben und kurz einmischen.',
        ingredients: [
          { amount: 150, unit: 'g', name: 'Lievito Madre', note: 'TA 150' },
          { amount: 12, unit: 'g', name: 'Salz' },
        ],
      },
      {
        title: 'Kneten',
        dur: 10,
        kind: 'prep',
        desc: 'Teig auf mittlerer Stufe kneten, bis er sich vom Schüsselrand löst und den Fenstertest besteht (Thermomix: Rückwärtslauf Stufe 5, 2 min).',
      },
      {
        title: 'Anspringen lassen',
        dur: 30,
        kind: 'rise',
        desc: 'Teig abgedeckt bei Raumtemperatur 30 Minuten ruhen lassen.',
      },
      {
        title: 'Kaltgare',
        dur: 600,
        min: 480,
        max: 720,
        step: 30,
        kind: 'cold',
        sleep: true,
        desc: 'Teig für ca. 10 Stunden im 0-Grad-Fach oder im kältesten Teil des Kühlschranks kalt führen.',
      },
      {
        title: 'Akklimatisieren',
        dur: 30,
        kind: 'rise',
        desc: 'Teig am Backtag 30 Minuten bei Raumtemperatur akklimatisieren lassen.',
      },
      {
        title: 'Ofen vorheizen',
        dur: 45,
        kind: 'prep',
        desc: 'Ofen mit Backstahl oder Topf auf 250 °C Ober-/Unterhitze vorheizen.',
      },
      {
        title: 'Wirken & Stückgare',
        dur: 60,
        min: 30,
        max: 120,
        step: 15,
        kind: 'rise',
        desc: 'Teig rund wirken, in ein bemehltes Gärkörbchen legen und bis zur knappen Gare bei Raumtemperatur stehen lassen.',
      },
      {
        title: 'Einschießen & Backen',
        dur: 40,
        kind: 'bake',
        desc: 'Teig ggf. einschneiden und bei 250 °C mit kräftigen Schwaden einschießen; nach 10 Minuten Dampf ablassen und fallend auf 200 °C ca. 30 weitere Minuten fertig backen (Topf-Variante: 20 min mit Deckel bei 250 °C, dann 20–25 min ohne Deckel bei 230 °C).',
      },
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
