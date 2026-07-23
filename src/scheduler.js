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
//   recipe.source       optional { url, title } — shown as a link icon in SetupCard
//   recipe.idealFinish  optional { hour, minute } — local clock time-of-day that
//                       defaultFinishTime() targets, so long rises/cold-retards
//                       land overnight instead of the bake landing at 3am
//   step.dur            default duration in MINUTES
//   step.min/max/step   present => step is "flexible" (range adjustable in UI)
//   step.kind           key into KINDS
//   step.sleep          true => overnight step (blue highlight + "über Nacht")
//   step.ingredients    optional array of { amount?, unit?, name, note? }
// ---------------------------------------------------------------------------
export const RECIPES = [
  {
    id: 'alltags-roggenmischbrot-80-20',
    name: 'Alltags-Roggenmischbrot 80/20',
    totalShort: '~29 Std',
    subtitle: 'Schnelles No-Knead-Sauerteigbrot für den Alltag – Marcel Paa',
    source: {
      url: 'https://www.marcelpaa.com/rezepte/alltags-roggenmischbrot-80-20/',
      title: 'Alltags-Roggenmischbrot 80/20 – Marcel Paa'
    },
    idealFinish: { hour: 8, minute: 0 },
    steps: [
      {
        title: 'Teig mischen',
        dur: 10,
        kind: 'prep',
        desc: 'Sauerteig im warmen Wasser aufschlämmen, restliche Zutaten dazugeben und ohne Kneten gründlich mischen, bis keine trockenen Stellen mehr vorhanden sind (bei weichem Teig mit 370 g Wasser starten).',
        ingredients: [
          { amount: 450, unit: 'g', name: 'Wasser', note: 'ca. 35 °C warm' },
          { amount: 50, unit: 'g', name: 'Sauerteig' },
          { amount: 12, unit: 'g', name: 'Salz' },
          { amount: 100, unit: 'g', name: 'Weissmehl', note: 'Weizenmehl Type 550' },
          { amount: 400, unit: 'g', name: 'Roggenmehl dunkel', note: 'Type 1150' },
          { amount: 1, unit: 'TL', name: 'Brotgewürz', note: 'optional' }
        ]
      },
      {
        title: 'Anspringen lassen',
        dur: 210,
        min: 180,
        max: 240,
        step: 30,
        kind: 'rise',
        desc: 'Teig zugedeckt bei Raumtemperatur 3–4 Std. anspringen lassen, bis er sichtbar aktiv geworden ist.'
      },
      {
        title: 'Kalt lagern',
        dur: 1260,
        min: 720,
        max: 1440,
        step: 60,
        kind: 'cold',
        sleep: true,
        desc: 'Teig zugedeckt bis zu 24 Std. im Kühlschrank kalt lagern.'
      },
      {
        title: 'Formen',
        dur: 10,
        kind: 'prep',
        desc: 'Teig auf reichlich Roggenmehl kräftig rund schleifen, ohne zu kneten, und auf einen bemehlten Schiesser oder Backpapier setzen.'
      },
      {
        title: 'Kurze Stückgare',
        dur: 60,
        min: 30,
        max: 60,
        step: 15,
        kind: 'rise',
        desc: 'Teigling stehen lassen, bis sich erste Risse auf der Oberfläche bilden.'
      },
      {
        title: 'Backen',
        dur: 55,
        kind: 'bake',
        desc: 'Ofen mit Backstahl in der unteren Hälfte auf 250 °C O/U vorheizen, einschieben, kräftig bedampfen, auf 230 °C reduzieren und 50–55 Min. ausbacken; auf einem Gitter vollständig auskühlen lassen.'
      }
    ]
  },
  {
    id: 'dinkel-roggen-vollkornbrot',
    name: 'Dinkel-Roggen Vollkornbrot',
    totalShort: '~18 Std',
    subtitle: 'Saftiges Kastenbrot mit gerösteten Sonnenblumenkernen – Marcel Paa',
    source: {
      url: 'https://www.marcelpaa.com/rezepte/dinkel-roggen-vollkornbrot/',
      title: 'Dinkel-Roggen Vollkornbrot – Marcel Paa'
    },
    idealFinish: { hour: 10, minute: 15 },
    steps: [
      {
        title: 'Sauerteig-Vorteig ansetzen',
        dur: 5,
        kind: 'prep',
        desc: 'Sauerteig im warmen Wasser aufschlämmen und das Mehl gut untermischen.',
        ingredients: [
          { amount: 110, unit: 'g', name: 'Wasser', note: 'ca. 40 °C warm' },
          { amount: 20, unit: 'g', name: 'Sauerteig', note: '15–20 g' },
          { amount: 110, unit: 'g', name: 'Roggenvollkornmehl' }
        ]
      },
      {
        title: 'Brühstück ansetzen',
        dur: 10,
        kind: 'prep',
        desc: 'Sonnenblumenkerne, Mehl und Salz mischen, mit kochendem Wasser übergiessen und gründlich vermengen.',
        ingredients: [
          { amount: 170, unit: 'g', name: 'Wasser', note: 'aufgekocht' },
          { amount: 100, unit: 'g', name: 'Sonnenblumenkerne', note: 'geröstet' },
          { amount: 70, unit: 'g', name: 'Dinkelvollkornmehl' },
          { amount: 15, unit: 'g', name: 'Salz' }
        ]
      },
      {
        title: 'Vorteige reifen lassen',
        dur: 840,
        min: 720,
        max: 960,
        step: 30,
        kind: 'rise',
        sleep: true,
        desc: 'Vorteig und Brühstück zugedeckt 12–16 Std. bei Raumtemperatur reifen bzw. quellen lassen.'
      },
      {
        title: 'Hauptteig mischen',
        dur: 10,
        kind: 'prep',
        desc: 'Vorteig, Brühstück und alle übrigen Zutaten ca. 8 Min. auf niedriger Stufe mischen; bei zu festem Teig schluckweise Wasser zugeben.',
        ingredients: [
          { name: 'Sauerteig-Vorteig' },
          { name: 'Brühstück' },
          { amount: 130, unit: 'g', name: 'Wasser' },
          { amount: 300, unit: 'g', name: 'Dinkelvollkornmehl' },
          { amount: 130, unit: 'g', name: 'Dinkelmehl hell', note: 'Type 630' },
          { amount: 20, unit: 'g', name: 'Zuckerrübensirup', note: 'alternativ Honig' },
          { amount: 6, unit: 'g', name: 'Frischhefe' }
        ]
      },
      {
        title: 'Stockgare',
        dur: 75,
        min: 60,
        max: 90,
        step: 15,
        kind: 'rise',
        desc: 'Teig zugedeckt bei Raumtemperatur ruhen lassen.'
      },
      {
        title: 'Formen',
        dur: 10,
        kind: 'prep',
        desc: 'Teig auf die bemehlte Arbeitsfläche stürzen, von beiden Seiten zur Mitte falten, leicht entgasen, länglich aufrollen und in die gefettete Toastbrotform legen.'
      },
      {
        title: 'Stückgare',
        dur: 90,
        min: 60,
        max: 120,
        step: 15,
        kind: 'rise',
        desc: 'Teigling zugedeckt bei Raumtemperatur gären lassen, bis sich leichte Risse auf der Oberfläche bilden.'
      },
      {
        title: 'Backen',
        dur: 55,
        kind: 'bake',
        desc: 'Ofen auf 250 °C O/U vorheizen, einschieben und bedampfen, auf 230–240 °C reduzieren; nach 20 Min. Dampf ablassen, nach insgesamt 40–50 Min. ausformen und ca. 10 Min. knusprig ausbacken.'
      }
    ]
  },
  {
    id: 'express-semmel',
    name: 'Express-Semmel',
    totalShort: '~2 Std',
    subtitle: 'Knusprige Semmeln in rund 2 Stunden – Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/express-semmel/', title: 'Marcel Paa - Express Semmel' },
    idealFinish: { hour: 18, minute: 0 },
    steps: [
      {
        title: 'Teig kneten',
        dur: 18,
        kind: 'prep',
        desc: 'Alle Zutaten mit dem Wasser beginnend in die Küchenmaschine geben, 2–3 Minuten langsam ankneten, dann 12–13 Minuten schneller kneten bis zur Fensterprobe und zur Kugel formen.',
        ingredients: [
          { amount: 430, unit: 'g', name: 'Weissmehl', note: 'Weizenmehl Type 550' },
          { amount: 260, unit: 'g', name: 'Wasser', note: 'handwarm' },
          { amount: 8, unit: 'g', name: 'Salz' },
          { amount: 4, unit: 'g', name: 'Backmalz', note: 'aktiv, alternativ Honig' },
          { amount: 15, unit: 'g', name: 'Frischhefe' },
          { amount: 60, unit: 'g', name: 'Sauerteig', note: 'alternativ total 20 g Frischhefe' }
        ]
      },
      {
        title: 'Stockgare',
        dur: 30,
        min: 30,
        max: 60,
        step: 15,
        kind: 'rise',
        desc: 'Den Teig zugedeckt mit Gärfolie 30 Minuten bei Raumtemperatur ruhen lassen.'
      },
      {
        title: 'Formen',
        dur: 15,
        kind: 'prep',
        desc: 'Teig auf die bemehlte Fläche stürzen, in 10 gleiche Stücke (80–85 g) teilen, rund schleifen, leicht länglich rollen und auf ein gefettetes Blech setzen.'
      },
      {
        title: 'Stückgare',
        dur: 30,
        min: 30,
        max: 60,
        step: 15,
        kind: 'rise',
        desc: 'Semmeln zugedeckt 30 Minuten bei Raumtemperatur gehen lassen, die letzten 5 Minuten offen, damit die Oberfläche leicht verhautet.'
      },
      {
        title: 'Backen',
        dur: 18,
        kind: 'bake',
        desc: 'Ofen mit feuerfester Schüssel (Lavasteine) auf 220 °C Ober-/Unterhitze vorheizen, Semmeln längs im 45°-Winkel einschneiden, 10 Minuten mit Dampf (1–2 dl Wasser) bei 220 °C backen, dann Schüssel entfernen und bei 190 °C weitere 5–10 Minuten knusprig ausbacken.'
      }
    ]
  },
  {
    id: 'guinness-brot',
    name: 'Guinness Brot',
    totalShort: '~15 Std',
    subtitle: 'Würzig-malziges Sauerteigbrot mit Guinness – Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/guinness-brot/', title: 'Marcel Paa - Guinness Brot' },
    idealFinish: { hour: 10, minute: 30 },
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
        desc: 'Ofen mit Backstahl in der unteren Hälfte auf 250 °C Ober-/Unterhitze vorheizen, Oberfläche mit Guinness bestreichen, längs einschneiden, auf den heißen Backstahl einschießen; Ofen sofort auf 210 °C reduzieren, Dampf erzeugen und 20 Min. backen; Dampf ablassen, weitere 35 Min. fertig backen.',
        ingredients: [
          { name: 'Guinness', note: 'zum Bestreichen' },
        ],
      },
    ],
  },
  {
    id: 'lievito-madre-broetchen',
    name: 'Lievito Madre Brötchen',
    totalShort: '~13 Std',
    subtitle: 'Rustikale Lievito-Madre-Brötchen aus Roggen- und Weizenmehl, ganz ohne Hefe – Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/lievito-madre-broetchen-2/', title: 'Marcel Paa – Lievito Madre Brötchen' },
    idealFinish: { hour: 9, minute: 15 },
    steps: [
      {
        title: 'Kneten',
        dur: 10,
        kind: 'prep',
        desc: 'Alle Zutaten in die Küchenmaschine geben, 2–3 Minuten langsam und danach insgesamt rund 10 Minuten kneten.',
        ingredients: [
          { amount: 280, unit: 'g', name: 'Wasser', note: 'ca. 30 °C warm' },
          { amount: 70,  unit: 'g', name: 'Lievito Madre' },
          { amount: 20,  unit: 'g', name: 'Olivenöl' },
          { amount: 9,   unit: 'g', name: 'Salz' },
          { amount: 80,  unit: 'g', name: 'Roggenmehl', note: 'hell' },
          { amount: 380, unit: 'g', name: 'Weizenmehl', note: 'Type 550' },
        ],
      },
      {
        title: 'Stockgare',
        dur: 600,
        min: 480,
        max: 720,
        step: 60,
        kind: 'rise',
        sleep: true,
        desc: 'Teig abgedeckt 8–12 Stunden bei Raumtemperatur reifen lassen; dabei 2–3 Mal dehnen und falten.',
      },
      {
        title: 'Formen',
        dur: 20,
        kind: 'prep',
        desc: 'Teig in 10 Stücke à ca. 80 g teilen, rundwirken, kräftig bemehlen und mit leicht geöffneter Naht auf ein mit Roggenmehl bestäubtes Gärtuch setzen.',
      },
      {
        title: 'Stückgare',
        dur: 120,
        min: 90,
        max: 150,
        step: 15,
        kind: 'rise',
        desc: 'Brötchen zugedeckt rund 2 Stunden bei Raumtemperatur gehen lassen.',
      },
      {
        title: 'Backen',
        dur: 27,
        kind: 'bake',
        desc: 'Ofen mit feuerfester Schale im unteren Rost in der Zwischenzeit auf 230 °C Ober-/Unterhitze vorheizen; Brötchen mit der Naht nach oben auf ein geöltes Lochblech stürzen, bemehlen, einschießen, Wasser in die heisse Schale giessen und 15 Minuten schwaden, dann Schale entfernen und weitere 10–15 Minuten knusprig fertig backen.',
      },
    ],
  },
  {
    id: 'lievito-madre-joghurt-broetchen',
    name: 'Lievito Madre Joghurt Brötchen',
    totalShort: '~13 Std',
    subtitle: 'Knusprige Joghurt-Brötchen mit Lievito Madre, der ideale Start in den Tag – Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/lievito-madre-joghurt-broetchen/', title: 'Marcel Paa – Lievito Madre Joghurt Brötchen' },
    idealFinish: { hour: 9, minute: 0 },
    steps: [
      {
        title: 'Kneten',
        dur: 15,
        kind: 'prep',
        desc: 'Alle Zutaten in die Küchenmaschine geben, 2–3 Minuten langsam und danach insgesamt rund 15 Minuten kneten.',
        ingredients: [
          { amount: 80,  unit: 'g', name: 'Lievito Madre', note: 'Sauerteig' },
          { amount: 80,  unit: 'g', name: 'Naturjoghurt' },
          { amount: 80,  unit: 'g', name: 'Vollkornmehl' },
          { amount: 9,   unit: 'g', name: 'Salz' },
          { amount: 380, unit: 'g', name: 'Weizenmehl', note: 'Type 550' },
          { amount: 220, unit: 'g', name: 'Wasser', note: 'ca. 35 °C warm' },
        ],
      },
      {
        title: 'Stockgare',
        dur: 660,
        min: 600,
        max: 720,
        step: 60,
        kind: 'rise',
        sleep: true,
        desc: 'Teig in eine geölte Schüssel geben, abdecken und 10–12 Stunden bei Raumtemperatur reifen lassen; dabei 2–3 Mal dehnen und falten.',
      },
      {
        title: 'Formen',
        dur: 20,
        kind: 'prep',
        desc: 'Teig in 80-g-Stücke teilen, rund vorformen, leicht oval formen, die Naht mehlig eindrücken, längs zusammenfalten und mit der Naht nach unten in ein bemehltes Gärkörbchen-Tuch setzen.',
      },
      {
        title: 'Stückgare',
        dur: 60,
        min: 45,
        max: 90,
        step: 15,
        kind: 'rise',
        desc: 'Brötchen zugedeckt rund 1 Stunde bei Raumtemperatur gehen lassen.',
      },
      {
        title: 'Backen',
        dur: 22,
        kind: 'bake',
        desc: 'Ofen in der Zwischenzeit auf 230 °C vorheizen; Brötchen mit der Naht nach oben auf ein geöltes Lochblech setzen, mit Mehl bestäuben, einschießen, schwaden und bei 210 °C 20–25 Minuten knusprig backen.',
      },
    ],
  },
  {
    id: 'madre-roggen-mischbroetchen',
    name: 'Madre Roggen Mischbrötchen',
    totalShort: '~20 Std',
    subtitle: 'Knusprige, rustikale Roggenmischbrötchen mit Sauerteig – Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/madre-roggen-mischbroetchen/', title: 'Marcel Paa – Madre Roggen Mischbrötchen' },
    idealFinish: { hour: 7, minute: 15 },
    steps: [
      {
        title: 'Kneten',
        dur: 8,
        kind: 'prep',
        desc: 'Alle Zutaten in die Küchenmaschine geben und rund 8 Minuten schonend zu einem glatten Teig kneten.',
        ingredients: [
          { amount: 350, unit: 'g', name: 'Wasser', note: '30–35 °C warm' },
          { amount: 200, unit: 'g', name: 'Ruchmehl', note: 'Weizenmehl Type 1050' },
          { amount: 300, unit: 'g', name: 'Roggenmehl', note: 'hell oder dunkel, Type 610/815/997/1150' },
          { amount: 10,  unit: 'g', name: 'Salz' },
          { amount: 110, unit: 'g', name: 'Sauerteig', note: 'Lievito Madre' },
        ],
      },
      {
        title: 'Stockgare',
        dur: 75,
        min: 60,
        max: 90,
        step: 15,
        kind: 'rise',
        desc: 'Teig in eine geölte Schüssel geben, mit Folie abdecken und bei Raumtemperatur ruhen lassen.',
      },
      {
        title: 'Formen',
        dur: 20,
        kind: 'prep',
        desc: 'Teig in 9 Stücke à 110 g teilen, rundwirken, in Mehl wälzen und mit der Naht nach unten auf ein bemehltes Tuch setzen; Falten als Stütze formen und abdecken.',
      },
      {
        title: 'Kalte Gare im Kühlschrank',
        dur: 1440,
        min: 720,
        max: 1440,
        step: 60,
        kind: 'cold',
        sleep: true,
        desc: 'Brötchen zugedeckt 12–24 Stunden im Kühlschrank reifen lassen.',
      },
      {
        title: 'Backen',
        dur: 18,
        kind: 'bake',
        desc: 'Ofen mit Wasserschale in der unteren Hälfte auf 210 °C Ober-/Unterhitze vorheizen, Brötchen mit der Naht nach oben einschießen, rund 15 Minuten mit Schwaden backen, Schale entfernen und weitere 5–10 Minuten fertig backen.',
      },
    ],
  },
  {
    id: 'naan',
    name: 'Naan – Indisches Fladenbrot',
    totalShort: '~3 Std',
    subtitle: 'Fluffiges Fladenbrot mit Knoblauchbutter – Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/naan-indisches-fladenbrot/', title: 'Marcel Paa – Naan Indisches Fladenbrot' },
    idealFinish: { hour: 18, minute: 15 },
    steps: [
      { title: 'Teig kneten', dur: 25, kind: 'prep', desc: 'Alle Zutaten in die Küchenmaschine geben, 3–4 Min. auf niedriger Stufe mischen, dann rund 20 Min. auf mittlerer Stufe zu einem glatten, elastischen Teig kneten.', ingredients: [
        { amount: 125, unit: 'g', name: 'Wasser' },
        { amount: 300, unit: 'g', name: 'Weizenmehl', note: 'Type 550' },
        { amount: 100, unit: 'g', name: 'Naturjoghurt' },
        { amount: 15,  unit: 'g', name: 'Olivenöl' },
        { amount: 6,   unit: 'g', name: 'Salz' },
        { amount: 3,   unit: 'g', name: 'Zucker' },
        { amount: 6,   unit: 'g', name: 'Frischhefe' },
      ] },
      { title: 'Stockgare', dur: 105, min: 90, max: 120, step: 15, kind: 'rise', desc: 'Teig in eine geölte Schüssel geben, mit Frischhaltefolie abdecken und bei Raumtemperatur gehen lassen; dabei 2–3 Mal dehnen und falten.' },
      { title: 'Teiglinge formen', dur: 10, kind: 'prep', desc: 'Teig auf bemehlter Fläche vorsichtig entgasen, in 4 gleich große Stücke teilen und zu kleinen Fladen formen.' },
      { title: 'Stückgare', dur: 25, min: 20, max: 30, step: 5, kind: 'rise', desc: 'Fladen mit Abstand auf ein Blech legen, mit Folie abdecken und ruhen lassen; in der Zwischenzeit für die Knoblauchbutter die Butter mit gepresstem Knoblauch schmelzen und Koriander fein hacken.', ingredients: [
        { amount: 50, unit: 'g', name: 'Butter' },
        { amount: 2,  name: 'Knoblauchzehen' },
        { name: 'Koriander', note: 'ein paar Stängel, fein gehackt' },
      ] },
      { title: 'Backen', dur: 8, kind: 'bake', desc: 'Ofen mit Blech auf unterster Schiene auf 250 °C vorheizen, Fladen 4–5 Min. backen, wenden und weitere 2–3 Min. fertig backen, bis sie aufgehen und braune Stellen bekommen.' },
      { title: 'Mit Knoblauchbutter bestreichen', dur: 5, kind: 'prep', desc: 'Naans auf einem Gitter kurz abkühlen lassen, sofort mit der heißen Knoblauchbutter bestreichen und mit gehacktem Koriander bestreuen.' },
    ],
  },
  {
    id: 'pane-di-altamura',
    name: 'Pane di Altamura',
    totalShort: '~14 Std',
    subtitle: 'Hartweizenmehl-Sauerteigbrot mit langer Kaltgare – von Oliver',
    source: { url: 'https://cookin.eu/pane-di-altamura/', title: 'cookin.eu - Pane di Altamura' },
    idealFinish: { hour: 9, minute: 30 },
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
        desc: 'Ofen mit Backstahl oder Topf auf 250 °C Ober-/Unterhitze vorheizen, Teig ggf. einschneiden und mit kräftigen Schwaden einschießen; nach 10 Minuten Dampf ablassen und fallend auf 200 °C ca. 30 weitere Minuten fertig backen (Topf-Variante: 20 min mit Deckel bei 250 °C, dann 20–25 min ohne Deckel bei 230 °C).',
      },
    ],
  },
  {
    id: 'pizzateig-48h',
    name: 'Pizzateig mit 48 Std. Reifung',
    totalShort: '~50 Std',
    subtitle: 'Bekömmlicher Pizzateig mit langer kalter Gare – Marcel Paa',
    source: {
      url: 'https://www.marcelpaa.com/rezepte/pizza-teig/',
      title: 'Pizzateig mit 48 Stunden Reifung – Marcel Paa'
    },
    idealFinish: { hour: 19, minute: 0 },
    steps: [
      {
        title: 'Teig kneten',
        dur: 20,
        kind: 'prep',
        desc: 'Zutaten mit den Flüssigkeiten beginnend 5–6 Min. ankneten, dann 12–15 Min. auf mittlerer Stufe kneten, bis der Teig die Fensterprobe besteht.',
        ingredients: [
          { amount: 390, unit: 'g', name: 'Wasser', note: 'kalt' },
          { amount: 20, unit: 'g', name: 'Olivenöl' },
          { amount: 590, unit: 'g', name: 'Weissmehl', note: 'Weizenmehl Type 405/550' },
          { amount: 12, unit: 'g', name: 'Salz' },
          { amount: 3, unit: 'g', name: 'Frischhefe' }
        ]
      },
      {
        title: 'Teigruhe',
        dur: 60,
        kind: 'rise',
        desc: 'Teig zugedeckt bei Raumtemperatur ruhen lassen.'
      },
      {
        title: 'Portionieren & Kugeln formen',
        dur: 15,
        kind: 'prep',
        desc: 'Teig in Stücke à 250 g portionieren, zu straffen Kugeln schleifen und in eine geölte Kunststoffbox legen.',
        ingredients: [
          { name: 'Olivenöl', note: 'für die Gärbox' }
        ]
      },
      {
        title: 'Kalte Reifung',
        dur: 2880,
        min: 1440,
        max: 2880,
        step: 30,
        kind: 'cold',
        sleep: true,
        desc: 'Teigkugeln verschlossen bei 5–7 °C im Kühlschrank reifen lassen und in dieser Zeit 2–3 Mal dehnen, falten und neu rund formen.'
      },
      {
        title: 'Tomatensauce zubereiten',
        dur: 20,
        kind: 'prep',
        desc: 'Knoblauch mit Olivenöl und Tomatenmark anschwitzen, restliche Zutaten aufkochen, Basilikum unterrühren und die Sauce pürieren.',
        ingredients: [
          { amount: 15, unit: 'g', name: 'Olivenöl' },
          { amount: 2, name: 'Knoblauchzehen' },
          { amount: 5, name: 'Basilikumblätter' },
          { amount: 100, unit: 'g', name: 'Tomatenmark' },
          { amount: 400, unit: 'g', name: 'Tomaten', note: 'gehackt' },
          { amount: 3, unit: 'g', name: 'Oregano', note: 'getrocknet' },
          { amount: 3, unit: 'g', name: 'Zucker' },
          { name: 'Salz' },
          { name: 'Pfeffer' }
        ]
      },
      {
        title: 'Pizzen formen & belegen',
        dur: 30,
        kind: 'prep',
        desc: 'Teiglinge auf Hartweizengriess zu Kreisen mit Rand ausdrücken, mit Tomatensauce bestreichen und mit Mozzarella und Belag nach Wahl belegen.',
        ingredients: [
          { name: 'Hartweizengriess' },
          { name: 'Mozzarella' },
          { name: 'Belag nach Wahl' }
        ]
      },
      {
        title: 'Backen',
        dur: 5,
        kind: 'bake',
        desc: 'Grill mit Pizzastein auf 300 °C vorheizen, Pizzen abschieben und bei geschlossenem Deckel 4–5 Min. backen (alternativ im Backofen bei 230 °C O/U ca. 10–15 Min.).'
      }
    ]
  },
  {
    id: 'sauerteig-cracker',
    name: 'Sauerteig Cracker',
    totalShort: '~3 Std',
    subtitle: 'Knuspriges Knäckebrot aus Anstellgut – Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/knaeckebrot-aus-sauerteig/', title: 'Marcel Paa - Sauerteig Cracker' },
    idealFinish: { hour: 20, minute: 0 },
    steps: [
      {
        title: 'Teig mischen',
        dur: 15,
        kind: 'prep',
        desc: 'Anstellgut im Wasser aufschlämmen, Mehl einrühren, dann Salz, Olivenöl, Sesam, Lein und Haferflocken dazugeben und von Hand zu einem Teig mischen.',
        ingredients: [
          { amount: 60, unit: 'ml', name: 'Wasser', note: 'ca. 40 Grad' },
          { amount: 60, unit: 'g', name: 'Sauerteig (Anstellgut)', note: 'alternativ 1 g Frischhefe' },
          { amount: 90, unit: 'g', name: 'Dinkel Vollkornmehl' },
          { amount: 4, unit: 'g', name: 'Salz' },
          { amount: 20, unit: 'g', name: 'Olivenöl' },
          { amount: 10, unit: 'g', name: 'Sesamsamen' },
          { amount: 10, unit: 'g', name: 'Leinsamen' },
          { amount: 20, unit: 'g', name: 'Haferflocken' },
        ],
      },
      {
        title: 'Stockgare',
        dur: 150,
        min: 150,
        max: 180,
        step: 15,
        kind: 'rise',
        desc: 'Teig abgedeckt bei Raumtemperatur 2,5–3 Stunden aufgehen lassen.',
      },
      {
        title: 'Formen & schneiden',
        dur: 10,
        kind: 'prep',
        desc: 'Teig zwischen zwei Backpapieren auf ca. 1 mm ausrollen, oberes Papier entfernen, mit Sesam oder Leinsamen bestreuen und mit dem Teigschneider in 5×5 cm Stücke einteilen.',
      },
      {
        title: 'Backen',
        dur: 12,
        kind: 'bake',
        desc: 'Backofen auf 210 °C Ober-/Unterhitze vorheizen, Cracker auf dem Backpapier in der Ofenmitte goldbraun und knusprig ausbacken, dann vollständig auskühlen lassen.',
      },
    ],
  },
  {
    id: 'sauerteig',
    name: 'Sauerteigbrot - wie vom Bäcker',
    totalShort: '~28 Std',
    subtitle: 'Knusprige Kruste, aromatische Krume · Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/sauerteigbrot/', title: 'Marcel Paa – Sauerteig Brot' },
    idealFinish: { hour: 9, minute: 45 },
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
      { title: 'Einschneiden & backen', dur: 50, kind: 'bake', desc: 'Ofen mit Gusseisentopf auf 230 °C Ober-/Unterhitze vorheizen, Teigling stürzen, übers Kreuz einschneiden, 40 Min. im Topf, dann 10 Min. offen ausbacken.' },
    ],
  },
  {
    id: 'sonnenblumenkern-vollkornbrot',
    name: 'Sonnenblumenkern Vollkornbrot',
    totalShort: '~14 Std',
    subtitle: 'Saftiges Weizenvollkornbrot mit Kernen – Marcel Paa',
    source: {
      url: 'https://www.marcelpaa.com/rezepte/vollkornbrot-mit-sonnenblumenkernen/',
      title: 'Sonnenblumenkern Vollkornbrot – Marcel Paa'
    },
    idealFinish: { hour: 9, minute: 30 },
    steps: [
      {
        title: 'Sauerteig-Vorteig ansetzen',
        dur: 5,
        kind: 'prep',
        desc: 'Sauerteig im Wasser aufschlämmen, Mehl dazugeben und gut verkneten.',
        ingredients: [
          { amount: 100, unit: 'g', name: 'Weizenvollkornmehl' },
          { amount: 100, unit: 'g', name: 'Wasser' },
          { amount: 10, unit: 'g', name: 'Sauerteig', note: 'alternativ 2 g Frischhefe' }
        ]
      },
      {
        title: 'Quellstück ansetzen',
        dur: 5,
        kind: 'prep',
        desc: 'Wasser und Sonnenblumenkerne in einem hohen Gefäss mischen und zudecken.',
        ingredients: [
          { amount: 200, unit: 'g', name: 'Wasser' },
          { amount: 100, unit: 'g', name: 'Sonnenblumenkerne' }
        ]
      },
      {
        title: 'Brühstück ansetzen',
        dur: 5,
        kind: 'prep',
        desc: 'Wasser aufkochen, über das Mehl giessen und klumpenfrei mischen.',
        ingredients: [
          { amount: 100, unit: 'g', name: 'Weizenvollkornmehl' },
          { amount: 150, unit: 'g', name: 'Wasser', note: 'kochend' }
        ]
      },
      {
        title: 'Vorteige reifen lassen',
        dur: 600,
        min: 480,
        max: 720,
        step: 30,
        kind: 'rise',
        sleep: true,
        desc: 'Vorteig, Quellstück und Brühstück zugedeckt 8–12 Std. bei Raumtemperatur reifen lassen.'
      },
      {
        title: 'Hauptteig kneten',
        dur: 15,
        kind: 'prep',
        desc: 'Alle Zutaten ohne zusätzliche Flüssigkeit ca. 6 Min. mischen, dann 4–6 Min. bei mittlerer Geschwindigkeit kneten, bis der Teig die Fensterprobe besteht.',
        ingredients: [
          { name: 'Sauerteig-Vorteig' },
          { name: 'Quellstück' },
          { name: 'Brühstück' },
          { amount: 300, unit: 'g', name: 'Weizenvollkornmehl' },
          { amount: 10, unit: 'g', name: 'Frischhefe' },
          { amount: 13, unit: 'g', name: 'Salz' }
        ]
      },
      {
        title: 'Stockgare',
        dur: 105,
        min: 90,
        max: 120,
        step: 15,
        kind: 'rise',
        desc: 'Teig in einem leicht gefetteten Becken zugedeckt bei Raumtemperatur gären lassen.'
      },
      {
        title: 'Formen',
        dur: 15,
        kind: 'prep',
        desc: 'Teig halbieren, rund schleifen, straff länglich rollen, mit Wasser bepinseln, in Sonnenblumenkernen wenden und in die Kastenformen setzen.',
        ingredients: [
          { name: 'Sonnenblumenkerne', note: 'zum Wälzen' }
        ]
      },
      {
        title: 'Stückgare',
        dur: 45,
        min: 40,
        max: 50,
        step: 5,
        kind: 'rise',
        desc: 'Teiglinge in den Formen zugedeckt bei Raumtemperatur gären lassen.'
      },
      {
        title: 'Backen',
        dur: 45,
        kind: 'bake',
        desc: 'Ofen mit feuerfester Schüssel auf 250 °C O/U vorheizen, einschieben, mit 1–2 dl Wasser bedampfen und auf 230 °C reduzieren; nach 20 Min. Schüssel entfernen, Brote ausformen und 20–25 Min. knusprig ausbacken.'
      }
    ]
  },
  {
    id: 'walliser-roggenbrot',
    name: 'Walliser Roggenbrot',
    totalShort: '~34 Std',
    subtitle: 'Rustikales Roggenbrot mit langer Kühlschrankgare – Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/walliser-roggenbrot-mit-kuehlschrankgare/', title: 'Marcel Paa – Walliser Roggenbrot mit Kühlschrankgare' },
    idealFinish: { hour: 20, minute: 0 },
    steps: [
      {
        title: 'Hauptteig anmischen',
        dur: 10,
        kind: 'prep',
        desc: 'Roggen Vollkornschrot, warmes Wasser, Sauerteig und Salz in einer Schüssel gut verrühren.',
        ingredients: [
          { amount: 375, unit: 'g', name: 'Roggen Vollkornschrot' },
          { amount: 330, unit: 'g', name: 'Wasser', note: 'handwarm, ca. 30 °C' },
          { amount: 10,  unit: 'g', name: 'Salz' },
          { amount: 50,  unit: 'g', name: 'Sauerteig', note: 'alternativ 5 g frische Hefe' },
        ],
      },
      {
        title: 'Ruhe bei Raumtemperatur',
        dur: 240,
        kind: 'rise',
        desc: 'Teig zugedeckt bei Raumtemperatur ruhen lassen, damit er durchfeuchtet und die Gärung startet.',
      },
      {
        title: 'Dehnen und Falten',
        dur: 5,
        kind: 'prep',
        desc: 'Teig von allen Seiten zur Mitte ziehen, um ihn zu belüften und zu stärken.',
      },
      {
        title: 'Kühlschrankgare',
        dur: 1800,
        min: 1440,
        max: 1800,
        step: 60,
        kind: 'cold',
        sleep: true,
        desc: 'Teig zugedeckt im Kühlschrank ruhen lassen und dabei 5-6 weitere Male dehnen und falten.',
      },
      {
        title: 'Formen',
        dur: 10,
        kind: 'prep',
        desc: 'Teig auf mit Roggenmehl bestäubter Fläche falten, glattziehen, rundwirken und großzügig in Roggenmehl wälzen.',
      },
      {
        title: 'Stückgare',
        dur: 180,
        min: 60,
        max: 180,
        step: 30,
        kind: 'rise',
        desc: 'Teig ruhen lassen, bis an der Oberfläche Risse entstehen und der Teig leicht aufgeht.',
      },
      {
        title: 'Backen',
        dur: 50,
        kind: 'bake',
        desc: 'Ofen mit Gusseisentopf (24-28 cm) auf 230 °C Ober-/Unterhitze vorheizen, Teig in den heißen Topf geben, zugedeckt 40 Min. backen, dann Deckel entfernen und direkt auf dem Rost bei 215 °C weitere 10 Min. fertigbacken.',
      },
    ],
  },
    {
    id: 'weizen-krusties',
    name: 'Weizen Krusties',
    totalShort: '~16 Std',
    subtitle: 'Wattige Krume, zartsplitternde Kruste — nach Marcel Paa',
    source: {
      url: 'https://www.marcelpaa.com/rezepte/weizen-krusties/',
      title: 'Weizen Krusties — Marcel Paa'
    },
    idealFinish: { hour: 9, minute: 0 },
    steps: [
      {
        title: 'Vorteig ansetzen',
        dur: 10,
        kind: 'prep',
        desc: 'Sauerteig im Wasser aufschlämmen, Mehl zugeben und zu einem Teig mischen.',
        ingredients: [
          { amount: 100, unit: 'g', name: 'Wasser', note: 'ca. 30 °C' },
          { amount: 15, unit: 'g', name: 'Sauerteig' },
          { amount: 130, unit: 'g', name: 'Weissmehl', note: 'Weizenmehl Type 550' }
        ]
      },
      {
        title: 'Vorteig-Gare',
        dur: 720,
        kind: 'rise',
        sleep: true,
        desc: 'Den Vorteig zugedeckt bei Raumtemperatur 12 Std. gären lassen.'
      },
      {
        title: 'Hauptteig kneten',
        dur: 18,
        kind: 'prep',
        desc: 'Alle Zutaten 2–3 Min. mischen, dann ca. 15 Min. bei mittlerer Geschwindigkeit kneten.',
        ingredients: [
          { name: 'Vorteig' },
          { amount: 170, unit: 'g', name: 'Wasser' },
          { amount: 50, unit: 'g', name: 'Vollmilch' },
          { amount: 300, unit: 'g', name: 'Weissmehl', note: 'Weizenmehl Type 550' },
          { amount: 70, unit: 'g', name: 'Weizen Vollkornmehl' },
          { amount: 5, unit: 'g', name: 'Backmalz, aktiv', note: 'alternativ: Honig' },
          { amount: 10, unit: 'g', name: 'Salz' },
          { amount: 7, unit: 'g', name: 'Frischhefe' }
        ]
      },
      {
        title: 'Stockgare mit Dehnen & Falten',
        dur: 105,
        min: 90,
        max: 120,
        step: 15,
        kind: 'rise',
        desc: 'Teig abgedeckt bei Raumtemperatur gären lassen und zwischendurch von allen vier Seiten dehnen und falten.'
      },
      {
        title: 'Formen',
        dur: 20,
        kind: 'prep',
        desc: 'Stücke zu 80–100 g abstechen, mit Roggenmehl bestauben, mittig halbieren, aufeinanderlegen, länglich rollen und mit Verschluss nach unten ins Bäckerleinen setzen.'
      },
      {
        title: 'Stückgare',
        dur: 50,
        kind: 'rise',
        desc: 'Die Teiglinge zugedeckt 50 Min. bei Raumtemperatur ruhen lassen.'
      },
      {
        title: 'Backen',
        dur: 23,
        kind: 'bake',
        desc: 'Ofen auf 250 °C Ober-/Unterhitze vorheizen, Teiglinge mit Verschluss nach oben aufs gefettete Blech setzen, bedampfen, auf 230 °C reduzieren und ca. 20–25 Min. backen.'
      }
    ]
  },
    {
    id: 'weizen-spitz-broetchen',
    name: 'Weizen Spitz Brötchen',
    totalShort: '~14,5 Std',
    subtitle: 'Saftige Krume, knusprige Kruste, Poolish-getrieben — nach Marcel Paa',
    source: {
      url: 'https://www.marcelpaa.com/rezepte/weizen-spitz-broetchen/',
      title: 'Weizen Spitz Brötchen — Marcel Paa'
    },
    idealFinish: { hour: 8, minute: 0 },
    steps: [
      {
        title: 'Poolish ansetzen',
        dur: 5,
        kind: 'prep',
        desc: 'Alle Zutaten in einem hohen Gefäss gut vermischen.',
        ingredients: [
          { amount: 200, unit: 'g', name: 'Wasser', note: 'warm' },
          { amount: 200, unit: 'g', name: 'Weissmehl', note: 'Weizenmehl Type 550' },
          { amount: 40, unit: 'g', name: 'Sauerteig', note: 'alternativ 2 g Frischhefe' }
        ]
      },
      {
        title: 'Poolish-Gare',
        dur: 1440,
        min: 720,
        max: 1440,
        step: 30,
        kind: 'rise',
        sleep: true,
        desc: 'Den Poolish zugedeckt bei Raumtemperatur 12–24 Std. gären lassen.'
      },
      {
        title: 'Hauptteig kneten',
        dur: 13,
        kind: 'prep',
        desc: 'Zuerst das Wasser, dann die restlichen Zutaten 2–3 Min. mischen und anschliessend ca. 10 Min. bei mittlerer Geschwindigkeit bis zur Fensterprobe kneten.',
        ingredients: [
          { name: 'Vorteig' },
          { amount: 230, unit: 'g', name: 'Wasser', note: 'kalt' },
          { amount: 10, unit: 'g', name: 'Frischhefe' },
          { amount: 8, unit: 'g', name: 'Salz' },
          { amount: 430, unit: 'g', name: 'Weissmehl', note: 'Weizenmehl Type 550' }
        ]
      },
      {
        title: 'Stockgare',
        dur: 40,
        kind: 'rise',
        desc: 'Teig locker zur Kugel formen, mit Gärfolie zudecken und 40 Min. bei Raumtemperatur gehen lassen.'
      },
      {
        title: 'Rundwirken & Entspannen',
        dur: 15,
        kind: 'prep',
        desc: 'Stücke zu 100 g abwiegen, auf unbemehlter Fläche straff rundwirken und mit dem Verschluss nach unten ca. 5 Min. entspannen lassen.'
      },
      {
        title: 'Langformen',
        dur: 10,
        kind: 'prep',
        desc: 'Teiglinge leicht bemehlen und mit mehr Druck auf den kurzen Seiten zu spitzen Länglingen formen, dann auf ein mit Backpapier belegtes Blech legen.'
      },
      {
        title: 'Stückgare',
        dur: 30,
        kind: 'rise',
        desc: 'Zugedeckt 30 Min. ruhen lassen und die Abdeckung nach 20 Min. entfernen, damit sich eine leichte Haut bildet.'
      },
      {
        title: 'Einschneiden',
        dur: 5,
        kind: 'prep',
        desc: 'Teiglinge mit Mehl bestauben und in einem Zug längs schräg im 45-Grad-Winkel 3–4 mm tief einschneiden.'
      },
      {
        title: 'Backen',
        dur: 27,
        kind: 'bake',
        desc: 'Ofen mit einem leeren Blech in der unteren Hälfte auf 230 °C Ober-/Unterhitze vorheizen, Brötchen in die zweitunterste Schiene schieben, 1–2 dl Wasser aufs heisse Blech giessen, nach 20 Min. das Wasserblech entfernen und weitere 5–10 Min. knusprig ausbacken.'
      }
    ]
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
 * Suggest a sensible default finish time for a freshly-selected recipe.
 *
 * If the recipe declares `idealFinish` ({ hour, minute }), returns the
 * earliest date at that clock time that still leaves enough lead time (total
 * default duration + a small prep buffer) between `now` and the finish,
 * rolling forward day-by-day as needed for long recipes. Otherwise falls
 * back to the legacy heuristic: now + total duration + ~1h slack, rounded up
 * to the next whole hour.
 */
export function defaultFinishTime(recipe, now = new Date()) {
  const total = recipe.steps.reduce((a, s) => a + s.dur, 0);

  if (recipe.idealFinish) {
    const { hour, minute } = recipe.idealFinish;
    const bufferMin = 20; // walk into the kitchen and start
    const earliestAllowed = new Date(now.getTime() + (total + bufferMin) * 60000);
    const candidate = new Date(now);
    candidate.setHours(hour, minute, 0, 0);
    while (candidate.getTime() < earliestAllowed.getTime()) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate;
  }

  // Fallback for a recipe without a configured ideal finish time.
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

/**
 * Index of the step that is currently in progress, or the next one to come,
 * based on `now`. Returns the last step's index once the whole bake is past
 * its finish time.
 */
export function currentStepIndex(steps, now = new Date()) {
  const t = now instanceof Date ? now.getTime() : now;
  const idx = steps.findIndex(s => s.end.getTime() > t);
  return idx === -1 ? steps.length - 1 : idx;
}

/**
 * When the next actionable moment in the bake happens: the start of the
 * upcoming step if it hasn't begun yet, or the end of the in-progress step
 * (= the following step's start, or the finish time for the last step)
 * otherwise.
 */
export function nextStepTime(steps, now = new Date()) {
  const t = now instanceof Date ? now.getTime() : now;
  const step = steps[currentStepIndex(steps, t)];
  return step.start.getTime() > t ? step.start : step.end;
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

/**
 * Recipe search (selection view). Case-insensitive; the query is split on
 * whitespace and EVERY word must occur somewhere in the recipe's name or
 * subtitle. Empty query matches everything.
 */
export function matchesQuery(recipe, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;
  const hay = [recipe.name, recipe.subtitle].filter(Boolean).join(' ').toLowerCase();
  return q.split(/\s+/).filter(Boolean).every(w => hay.includes(w));
}

// ---------------------------------------------------------------------------
// Saved bakes
// ---------------------------------------------------------------------------
// A "saved bake" bookmarks a planned bake so the user can return to it.
// Long-pressing a recipe chip in the UI creates or removes the bookmark.
// A badge on the chip indicates a saved bake; tapping the chip restores it.
// Saved bakes auto-expire 2 hours after their finish time.
//
// Persisted shape (JSON under SAVED_KEY):
//   { [recipeId]: { target: <ms epoch>, overrides: { [stepIndex]: minutes } } }

export const SAVED_KEY = 'schedoughler.saved.v1';
export const SAVED_EXPIRY_MS = 2 * 60 * 60 * 1000;

/** Parse the saved-bakes map from localStorage. Safe on missing/corrupt data. */
export function loadSavedBakes(store) {
  try { const raw = store.getItem(SAVED_KEY); return raw ? JSON.parse(raw) : {}; }
  catch (e) { return {}; }
}

/** Persist the saved-bakes map to localStorage. */
export function persistSavedBakes(store, saved) {
  try { store.setItem(SAVED_KEY, JSON.stringify(saved)); } catch (e) {}
}

/**
 * Toggle a recipe's saved bake. If already saved, removes it.
 * If not saved and this is the active recipe, stores its live finish time +
 * overrides. Otherwise stores the recipe's default finish time.
 * Returns a NEW map (does not mutate the input).
 */
export function toggleSavedBake(saved, recipe, { isActive, finishAt, overrides } = {}) {
  const next = { ...saved };
  if (next[recipe.id]) {
    delete next[recipe.id];
  } else if (isActive && finishAt) {
    next[recipe.id] = { target: finishAt.getTime(), overrides: { ...(overrides || {}) } };
  } else {
    next[recipe.id] = { target: defaultFinishTime(recipe).getTime(), overrides: {} };
  }
  return next;
}

/**
 * Drop saved bakes whose finish time is more than SAVED_EXPIRY_MS in the past.
 * Returns { saved, changed } so the caller knows whether to re-persist.
 */
export function pruneSavedBakes(saved, now = Date.now()) {
  const cutoff = now - SAVED_EXPIRY_MS;
  const next = { ...saved }; let changed = false;
  Object.keys(next).forEach(k => {
    if (next[k].target < cutoff) { delete next[k]; changed = true; }
  });
  return { saved: next, changed };
}

// ---------------------------------------------------------------------------
// Starred recipes
// ---------------------------------------------------------------------------
// A "starred" recipe is one the user has tried and rated highly. Starring is
// a local-only, per-browser preference (no finish time/overrides attached)
// used solely to prioritize the recipe's position in the selection list.
// Starred recipes never expire.
//
// Persisted shape (JSON under STARRED_KEY): { [recipeId]: true }

export const STARRED_KEY = 'schedoughler.starred.v1';

/** Parse the starred-recipes map from localStorage. Safe on missing/corrupt data. */
export function loadStarredRecipes(store) {
  try { const raw = store.getItem(STARRED_KEY); return raw ? JSON.parse(raw) : {}; }
  catch (e) { return {}; }
}

/** Persist the starred-recipes map to localStorage. */
export function persistStarredRecipes(store, starred) {
  try { store.setItem(STARRED_KEY, JSON.stringify(starred)); } catch (e) {}
}

/** Toggle a recipe's starred state. Returns a NEW map (does not mutate the input). */
export function toggleStarredRecipe(starred, recipeId) {
  const next = { ...starred };
  if (next[recipeId]) delete next[recipeId];
  else next[recipeId] = true;
  return next;
}
