// Daten und Regeln für die drei Atlas-Klassen:
//   atlas-laender  Klasse 1: Länder und ihre Lage
//   atlas-staedte  Klasse 2: Hauptstädte und wichtige Städte
//   atlas-globus   Klasse 3: Länder und Städte auf Globus oder Karte antippen
// Jede Klasse hat einen Lernmodus (ansehen, einprägen) und einen Prüfungsmodus (Quiz).
const basis = import.meta.env?.BASE_URL ?? './';
const datenUrl = (pfad) => `${basis}${pfad}`.replace(/\/\.\//g, '/');

export const KONTINENTE = ['Europa', 'Asien', 'Afrika', 'Nordamerika', 'Südamerika', 'Ozeanien'];

// Wohin der Globus schaut, wenn ein Kontinent gezeigt wird: [Länge, Breite], Zoom
export const KONTINENT_BLICK = {
  Europa: { pos: [15, 50], zoom: 2.4 },
  Asien: { pos: [90, 32], zoom: 1.3 },
  Afrika: { pos: [20, 3], zoom: 1.4 },
  Nordamerika: { pos: [-90, 30], zoom: 1.3 },
  Südamerika: { pos: [-60, -18], zoom: 1.5 },
  Ozeanien: { pos: [155, -15], zoom: 1.4 },
};

// Schwierigkeitslevel. „max“ = höchste Länder-/Stadt-Stufe, die vorkommt.
// toleranzKm: wie weit ein Tipp auf eine Stadt (oder einen Kleinstaat) daneben liegen darf.
export const LEVEL = {
  anfaenger: { name: 'Anfänger', max: 1, hilfe: true, toleranzKm: 500, text: 'Bekannte Länder und Städte. Du bekommst Tipps: den Kontinent oder die Hauptstadt.' },
  fortgeschritten: { name: 'Fortgeschritten', max: 2, hilfe: false, toleranzKm: 300, text: 'Mehr Länder und Städte, keine Tipps.' },
  profi: { name: 'Profi', max: 3, hilfe: false, toleranzKm: 150, text: 'Alle 195 Staaten. Falsche Antworten liegen in der Nähe, Tipps müssen genauer sitzen.' },
};
export const levelVon = (z) => LEVEL[z.einstellungen.atlasLevel] ? z.einstellungen.atlasLevel : 'anfaenger';

// Städte, die auf dem Globus nicht von einer Nachbarstadt zu unterscheiden sind
const OHNE_STADTFRAGE = new Set(['hs-va']); // Vatikanstadt liegt mitten in Rom

const STUFE_ZU_SCHWIERIGKEIT = { 1: 'leicht', 2: 'mittel', 3: 'schwer' };
export const ERDRADIUS = 6371;

let cache = null;
export function ladeOrte() {
  cache ??= fetch(datenUrl('data/atlas/orte.json'))
    .then((r) => { if (!r.ok) throw new Error('Atlas-Daten nicht gefunden'); return r.json(); })
    .then((d) => {
      const nachCode = Object.fromEntries(d.laender.map((l) => [l.code, l]));
      const staedte = d.staedte.map((s) => ({ ...s, land: nachCode[s.code], kontinent: nachCode[s.code].kontinent }));
      return { ...d, staedte, nachCode, stadtNachId: Object.fromEntries(staedte.map((s) => [s.id, s])) };
    })
    .catch((e) => { cache = null; throw e; });
  return cache;
}

let weltCache = null;
export function ladeWelt() {
  weltCache ??= fetch(datenUrl('data/atlas/welt.json'))
    .then((r) => { if (!r.ok) throw new Error('Karte nicht gefunden'); return r.json(); })
    .catch((e) => { weltCache = null; throw e; });
  return weltCache;
}

// Ein „Ziel“ ist ein Land oder eine Stadt, das abgefragt wird.
const landZiel = (l) => ({ art: 'land', key: l.code, name: l.name, pos: l.pos, kontinent: l.kontinent, stufe: l.stufe, land: l });
const stadtZiel = (s) => ({ art: 'stadt', key: s.id, name: s.name, pos: s.pos, kontinent: s.kontinent, stufe: s.stufe, land: s.land, stadt: s });

// Alle Prüfungsfragen einer Atlas-Klasse im Fragenformat der App,
// damit Fortschritt, Wiederholung und Statistik wie bei den anderen Klassen funktionieren.
export function atlasFragen(klasseId, orte) {
  const laender = orte.laender;
  const staedte = orte.staedte.filter((s) => !OHNE_STADTFRAGE.has(s.id));
  const frage = (id, ziel, text) => ({
    id, klasse: klasseId, schwierigkeit: STUFE_ZU_SCHWIERIGKEIT[ziel.stufe], frage: text, richtig: ziel.name,
    begruendung: ziel.art === 'land' ? `${ziel.name} liegt in ${ziel.kontinent}.` : (ziel.stadt.merke ?? ''), ziel,
  });
  if (klasseId === 'atlas-laender') return laender.map((l) => frage(`atl-l-${l.code}`, landZiel(l), `Land erkennen: ${l.name}`));
  if (klasseId === 'atlas-staedte') return staedte.map((s) => frage(`atl-s-${s.id}`, stadtZiel(s), `Stadt erkennen: ${s.name}`));
  if (klasseId === 'atlas-globus') {
    return [
      ...laender.map((l) => frage(`atl-gl-${l.code}`, landZiel(l), `Auf dem Globus finden: ${l.name}`)),
      ...staedte.map((s) => frage(`atl-gs-${s.id}`, stadtZiel(s), `Auf dem Globus finden: ${s.name}`)),
    ];
  }
  return [];
}

export const imLevel = (q, level) => q.ziel.stufe <= LEVEL[level].max;

// Großkreis-Abstand in km zwischen zwei Punkten [Länge, Breite]
export function abstandKm(a, b) {
  const r = Math.PI / 180;
  const [l1, p1] = [a[0] * r, a[1] * r];
  const [l2, p2] = [b[0] * r, b[1] * r];
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2;
  return 2 * ERDRADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Drei falsche Antworten für ein Ziel. Je höher das Level, desto ähnlicher (näher) die falschen Antworten.
//   Anfänger: beliebige bekannte Orte (der Kontinent-Tipp hilft beim Ausschließen)
//   Fortgeschritten: derselbe Kontinent
//   Profi: die nächsten Nachbarn (mindestens 100 km entfernt, damit Punkte unterscheidbar bleiben)
export function falscheAntworten(ziel, kandidaten, level, rand = Math.random) {
  const andere = kandidaten.filter((k) => k.key !== ziel.key && k.name !== ziel.name);
  const mischen = (a) => a.map((x) => [rand(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  let auswahl;
  if (level === 'profi') {
    auswahl = andere
      .map((k) => ({ k, d: abstandKm(k.pos, ziel.pos) }))
      .filter((x) => x.d >= 100)
      .sort((a, b) => a.d - b.d)
      .slice(0, 6)
      .map((x) => x.k);
    auswahl = mischen(auswahl);
  } else if (level === 'fortgeschritten') {
    auswahl = mischen(andere.filter((k) => k.kontinent === ziel.kontinent && abstandKm(k.pos, ziel.pos) >= 100));
  } else {
    auswahl = mischen(andere);
  }
  // Reicht es nicht (z. B. wenige Länder im Kontinent), mit beliebigen anderen auffüllen
  const namen = new Set(auswahl.slice(0, 3).map((k) => k.name));
  for (const k of mischen(andere)) {
    if (namen.size >= 3) break;
    namen.add(k.name);
  }
  return [...namen].slice(0, 3);
}

// Tipp für Anfänger (Scaffolding)
export function tippText(ziel, klasseId) {
  if (klasseId === 'atlas-laender') {
    return ziel.land.hs ? `Die Hauptstadt dieses Landes heißt ${ziel.land.hs}.` : `Der Name beginnt mit „${ziel.name[0]}“.`;
  }
  return `Der gesuchte Ort liegt in ${ziel.kontinent}.`;
}
