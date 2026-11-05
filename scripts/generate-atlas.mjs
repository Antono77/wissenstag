// Erzeugt die Daten für die Atlas-Klassen (Länder, Städte, Globus-Zuordnung):
//   public/data/atlas/welt.json   Ländergrenzen (TopoJSON aus „world-atlas“, Natural Earth 1:50 Mio.)
//   public/data/atlas/orte.json   Länder und Städte mit Lage, Kontinent und Stufe
// Prüft dabei jede Stadt: Sie muss in ihrem Land liegen (oder höchstens 30 km daneben).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { feature } from 'topojson-client';
import { geoArea, geoCentroid, geoContains, geoDistance } from 'd3-geo';
import { laender, STAND } from './laender-basis.mjs';
import { hauptstadtPos, staedte } from './atlas-orte.mjs';

const require = createRequire(import.meta.url);
const iso = require('i18n-iso-countries');
const welt = structuredClone(require('world-atlas/countries-50m.json'));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ziel = path.join(root, 'public', 'data', 'atlas');
fs.mkdirSync(ziel, { recursive: true });

const fehler = [];
const ERDRADIUS = 6371;

// 1. Ländergrenzen: ISO-Zahlencode → Kürzel wie bei den Flaggen (de, fr, …)
for (const g of welt.objects.countries.geometries) {
  const a2 = g.id ? iso.numericToAlpha2(g.id) : null;
  if (a2) g.id = a2.toLowerCase();
  else delete g.id; // umstrittene Gebiete (Kosovo, Nordzypern, Somaliland …) bleiben neutrale Landfläche
  delete g.properties;
}
fs.writeFileSync(path.join(ziel, 'welt.json'), JSON.stringify(welt));

const formen = new Map();
for (const f of feature(welt, welt.objects.countries).features) {
  if (!f.id) continue;
  const alt = formen.get(f.id);
  if (!alt) { formen.set(f.id, f); continue; }
  // Zwei Gebiete mit demselben Code (Australien und die Ashmore- und Cartierinseln): zusammenlegen
  const teile = (g) => (g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]);
  formen.set(f.id, { type: 'Feature', id: f.id, geometry: { type: 'MultiPolygon', coordinates: [...teile(alt.geometry), ...teile(f.geometry)] } });
}

// Größtes Teilstück eines Landes (Frankreich ohne Französisch-Guayana, USA ohne Alaska …)
function hauptteil(f) {
  if (f.geometry.type !== 'MultiPolygon') return f;
  let best = null;
  let bestA = -1;
  for (const coords of f.geometry.coordinates) {
    const teil = { type: 'Feature', geometry: { type: 'Polygon', coordinates: coords } };
    const a = geoArea(teil);
    if (a > bestA) { bestA = a; best = teil; }
  }
  return best;
}

const rund = (x) => Math.round(x * 100) / 100;
const lonLat = ([lat, lon]) => [lon, lat];

// Abstand in km vom Punkt zum nächsten Eckpunkt der Landesgrenze
function abstandZurGrenze(f, punkt) {
  let min = Infinity;
  const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
  for (const poly of polys) for (const ring of poly) for (const p of ring) min = Math.min(min, geoDistance(p, punkt) * ERDRADIUS);
  return min;
}

// Liegt der Punkt im Land oder höchstens `km` daneben (Küstenorte, Kleinstaaten auf der vereinfachten Karte)?
function liegtIn(f, punkt, km = 30) {
  return geoContains(f, punkt) || abstandZurGrenze(f, punkt) <= km;
}

// 2. Länder
const ausgabeLaender = [];
for (const l of laender) {
  const f = formen.get(l.code);
  const hsPos = l.hs ? hauptstadtPos[l.code] : null;
  if (l.hs && !hsPos) fehler.push(`${l.code} (${l.name}): Koordinaten der Hauptstadt ${l.hs} fehlen in atlas-orte.mjs`);
  let pos;
  let flaeche = 0;
  if (f) {
    const teil = hauptteil(f);
    pos = geoCentroid(teil);
    flaeche = geoArea(teil) * ERDRADIUS * ERDRADIUS; // km²
    // Bei sehr verwinkelten Ländern kann der Mittelpunkt außerhalb liegen: dann die Hauptstadt nehmen
    if (!geoContains(teil, pos) && hsPos) pos = lonLat(hsPos);
  } else if (hsPos) {
    pos = lonLat(hsPos); // auf der Karte zu klein (Tuvalu): als Punkt zeigen
  } else {
    fehler.push(`${l.code} (${l.name}): weder Grenzen noch Hauptstadt-Koordinaten`);
    continue;
  }
  if (f && hsPos && !liegtIn(f, lonLat(hsPos))) {
    fehler.push(`${l.code}: Hauptstadt ${l.hs} (${hsPos.join(', ')}) liegt nicht in ${l.name}`);
  }
  ausgabeLaender.push({
    code: l.code,
    name: l.name,
    kontinent: l.kontinent,
    stufe: l.stufe,
    hs: l.hs ?? null,
    hsPos: hsPos ? lonLat(hsPos) : null,
    pos: pos.map(rund),
    form: !!f,
    klein: !f || flaeche < 2500, // kleiner als etwa das Saarland: auf der Karte als Ring markieren
  });
}

// 3. Städte: alle Hauptstädte und wichtige weitere Städte
const nachCode = Object.fromEntries(ausgabeLaender.map((l) => [l.code, l]));
const ausgabeStaedte = [];
const ids = new Set();
for (const l of ausgabeLaender) {
  if (!l.hs) continue;
  ausgabeStaedte.push({ id: `hs-${l.code}`, name: l.hs, code: l.code, pos: l.hsPos, stufe: l.stufe, hauptstadt: true, merke: `Hauptstadt von ${l.name}.` });
}
for (const [id, name, code, pos, stufe, merke] of staedte) {
  if (ids.has(id)) fehler.push(`Stadt-id doppelt: ${id}`);
  ids.add(id);
  const land = nachCode[code];
  if (!land) { fehler.push(`${name}: unbekanntes Land ${code}`); continue; }
  const f = formen.get(code);
  if (f && !liegtIn(f, lonLat(pos))) fehler.push(`${name} (${pos.join(', ')}) liegt nicht in ${land.name}`);
  ausgabeStaedte.push({ id, name, code, pos: lonLat(pos), stufe, hauptstadt: false, merke });
}

// Doppelte Städtenamen würden Antworten mehrdeutig machen
const namen = new Map();
for (const s of ausgabeStaedte) {
  if (namen.has(s.name)) fehler.push(`Städtename doppelt: ${s.name} (${namen.get(s.name)} und ${s.code})`);
  namen.set(s.name, s.code);
}

// Zwei Städte, die näher als 40 km beieinander liegen, sind auf dem Globus nicht unterscheidbar
for (let i = 0; i < ausgabeStaedte.length; i++) {
  for (let j = i + 1; j < ausgabeStaedte.length; j++) {
    const d = geoDistance(ausgabeStaedte[i].pos, ausgabeStaedte[j].pos) * ERDRADIUS;
    if (d < 40) console.log(`Hinweis: ${ausgabeStaedte[i].name} und ${ausgabeStaedte[j].name} liegen nur ${Math.round(d)} km auseinander.`);
  }
}

if (fehler.length) {
  console.error(`Atlas: ${fehler.length} Fehler`);
  for (const f of fehler) console.error(`  ${f}`);
  process.exit(1);
}

fs.writeFileSync(path.join(ziel, 'orte.json'), JSON.stringify({
  hinweis: 'Erzeugt von scripts/generate-atlas.mjs. Nicht von Hand ändern: Koordinaten stehen in scripts/atlas-orte.mjs.',
  stand: STAND,
  quelle: 'Grenzen: Natural Earth über das Paket „world-atlas“ (gemeinfrei).',
  laender: ausgabeLaender,
  staedte: ausgabeStaedte,
}, null, 1));

console.log(`Atlas: ${ausgabeLaender.length} Länder, ${ausgabeStaedte.length} Städte, Grenzen von ${formen.size} Gebieten.`);
