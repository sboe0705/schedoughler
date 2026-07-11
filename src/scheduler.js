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
//   step.dur            default duration in MINUTES
//   step.min/max/step   present => step is "flexible" (range adjustable in UI)
//   step.kind           key into KINDS
//   step.sleep          true => overnight step (blue highlight + "über Nacht")
//   step.ingredients    optional array of { amount?, unit?, name, note? }
// ---------------------------------------------------------------------------
export const RECIPES = [
  {
    id: 'sauerteig',
    name: 'Sauerteigbrot - wie vom Bäcker',
    totalShort: '~28 Std',
    subtitle: 'Knusprige Kruste, aromatische Krume · Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/sauerteigbrot/', title: 'Marcel Paa – Sauerteig Brot' },
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
    id: "sauerteig-cracker",
    name: "Sauerteig Cracker",
    totalShort: "~3 Std",
    subtitle: "Knuspriges Knäckebrot aus Anstellgut – Marcel Paa",
    source: { url: 'https://www.marcelpaa.com/rezepte/knaeckebrot-aus-sauerteig/', title: 'Marcel Paa - Sauerteig Cracker' },
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
        title: "Formen & schneiden",
        dur: 10,
        kind: "prep",
        desc: "Teig zwischen zwei Backpapieren auf ca. 1 mm ausrollen, oberes Papier entfernen, mit Sesam oder Leinsamen bestreuen und mit dem Teigschneider in 5×5 cm Stücke einteilen.",
      },
      {
        title: "Backen",
        dur: 12,
        kind: "bake",
        desc: "Backofen auf 210 °C Ober-/Unterhitze vorheizen, Cracker auf dem Backpapier in der Ofenmitte goldbraun und knusprig ausbacken, dann vollständig auskühlen lassen.",
      },
    ],
  },
  {
    id: 'guinness-brot',
    name: 'Guinness Brot',
    totalShort: '~15 Std',
    subtitle: 'Würzig-malziges Sauerteigbrot mit Guinness – von Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/guinness-brot/', title: 'Marcel Paa - Guinness Brot' },
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
    id: 'pane-di-altamura',
    name: 'Pane di Altamura',
    totalShort: '~14 Std',
    subtitle: 'Hartweizenmehl-Sauerteigbrot mit langer Kaltgare – von Oliver',
    source: { url: 'https://cookin.eu/pane-di-altamura/', title: 'cookin.eu - Pane di Altamura' },
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
    id: 'madre-roggen-mischbroetchen',
    name: 'Madre Roggen Mischbrötchen',
    totalShort: '~20 Std',
    subtitle: 'Knusprige, rustikale Roggenmischbrötchen mit Sauerteig – von Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/madre-roggen-mischbroetchen/', title: 'Marcel Paa – Madre Roggen Mischbrötchen' },
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
        dur: 1080,
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
    id: 'lievito-madre-joghurt-broetchen',
    name: 'Lievito Madre Joghurt Brötchen',
    totalShort: '~13 Std',
    subtitle: 'Knusprige Joghurt-Brötchen mit Lievito Madre, der ideale Start in den Tag – von Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/lievito-madre-joghurt-broetchen/', title: 'Marcel Paa – Lievito Madre Joghurt Brötchen' },
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
    id: 'lievito-madre-broetchen',
    name: 'Lievito Madre Brötchen',
    totalShort: '~13 Std',
    subtitle: 'Rustikale Lievito-Madre-Brötchen aus Roggen- und Weizenmehl, ganz ohne Hefe – von Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/lievito-madre-broetchen-2/', title: 'Marcel Paa – Lievito Madre Brötchen' },
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
    id: 'walliser-roggenbrot',
    name: 'Walliser Roggenbrot',
    totalShort: '~34 Std',
    subtitle: 'Rustikales Roggenbrot mit langer Kühlschrankgare – von Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/walliser-roggenbrot-mit-kuehlschrankgare/', title: 'Marcel Paa – Walliser Roggenbrot mit Kühlschrankgare' },
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
        dur: 1620,
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
        dur: 120,
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
    id: 'naan',
    name: 'Naan – Indisches Fladenbrot',
    totalShort: '~3 Std',
    subtitle: 'Fluffiges Fladenbrot mit Knoblauchbutter – von Marcel Paa',
    source: { url: 'https://www.marcelpaa.com/rezepte/naan-indisches-fladenbrot/', title: 'Marcel Paa – Naan Indisches Fladenbrot' },
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
 * whitespace and EVERY word must occur somewhere in the recipe's title or its
 * step titles/descriptions. Empty query matches everything.
 */
export function matchesQuery(recipe, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;
  const hay = [recipe.name, ...recipe.steps.map(s => s.title + ' ' + s.desc)].join(' ').toLowerCase();
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
