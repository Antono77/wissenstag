// Erzeugt public/data/flaggen.json und public/data/laender.json aus scripts/laender-basis.mjs.
// Aufruf: npm run laender
// Der Zufall ist fest „gesät“: Bei jedem Lauf entstehen dieselben Fragen mit denselben IDs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { laender, STAND } from './laender-basis.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'data');

// Kleiner Zufallsgenerator mit festem Startwert (mulberry32)
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
function pick(list, n, rand, exclude = []) {
  const pool = [...new Set(list)].filter((x) => !exclude.includes(x));
  const res = [];
  while (res.length < n && pool.length) res.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return res;
}

const stufeName = { 1: 'leicht', 2: 'mittel', 3: 'schwer' };
// Flaggen, die im 4:3-Format praktisch gleich aussehen: nie gemeinsam als Auswahl zeigen
const zwillinge = [['id', 'mc'], ['td', 'ro']];
const istZwilling = (a, b) => zwillinge.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
// Länder, deren Amtssprachen sich zuletzt geändert haben: keine Sprachfrage
const ohneSprachfrage = new Set(['ml', 'bf', 'ne']);

// Grammatik: Ländernamen mit Artikel (Nominativ, Dativ)
const artikel = {
  ch: ['die Schweiz', 'der Schweiz'], tr: ['die Türkei', 'der Türkei'], sk: ['die Slowakei', 'der Slowakei'],
  mn: ['die Mongolei', 'der Mongolei'], ua: ['die Ukraine', 'der Ukraine'], ci: ['die Elfenbeinküste', 'der Elfenbeinküste'],
  cf: ['die Zentralafrikanische Republik', 'der Zentralafrikanischen Republik'],
  cd: ['die Demokratische Republik Kongo', 'der Demokratischen Republik Kongo'],
  cg: ['die Republik Kongo', 'der Republik Kongo'], do: ['die Dominikanische Republik', 'der Dominikanischen Republik'],
  iq: ['der Irak', 'dem Irak'], ir: ['der Iran', 'dem Iran'], ye: ['der Jemen', 'dem Jemen'], lb: ['der Libanon', 'dem Libanon'],
  sd: ['der Sudan', 'dem Sudan'], ss: ['der Südsudan', 'dem Südsudan'], td: ['der Tschad', 'dem Tschad'],
  ne: ['der Niger', 'dem Niger'], sn: ['der Senegal', 'dem Senegal'], om: ['der Oman', 'dem Oman'],
  nl: ['die Niederlande', 'den Niederlanden'], us: ['die Vereinigten Staaten', 'den Vereinigten Staaten'],
  ae: ['die Vereinigten Arabischen Emirate', 'den Vereinigten Arabischen Emiraten'], ph: ['die Philippinen', 'den Philippinen'],
  mv: ['die Malediven', 'den Malediven'], sc: ['die Seychellen', 'den Seychellen'], bs: ['die Bahamas', 'den Bahamas'],
  km: ['die Komoren', 'den Komoren'], sb: ['die Salomonen', 'den Salomonen'], mh: ['die Marshallinseln', 'den Marshallinseln'],
  gb: ['das Vereinigte Königreich', 'dem Vereinigten Königreich'],
};
const nom = (l) => artikel[l.code]?.[0] ?? l.name;
const Nom = (l) => nom(l).charAt(0).toUpperCase() + nom(l).slice(1);
const dat = (l) => artikel[l.code]?.[1] ?? l.name;
const zu = (l) => dat(l).replace(/^der /, 'zur ').replace(/^dem /, 'zum ').replace(/^(?!zur |zum )/, 'zu ');
// Genitiv mit Artikel („der Schweiz“, „des Irak“), sonst „von Deutschland“
const von = (l) => {
  const d = artikel[l.code]?.[1];
  if (!d) return `von ${l.name}`;
  if (d.startsWith('dem ')) return d.replace(/^dem /, 'des ').replace(/Königreich$/, 'Königreichs');
  if (d.startsWith('den ')) return 'der ' + artikel[l.code][0].replace(/^die /, '');
  return d;
};
const satz = (t) => t.replace(/\.\.$/, '.');
const inL = (l) => dat(l).replace(/^dem /, 'im ').replace(/^(?!im )/, 'in ');

const steckbrief = (l) => {
  const teile = [`${Nom(l)} ${artikel[l.code] && /^die (Vereinigten|Niederlande|Philippinen|Malediven|Seychellen|Bahamas|Komoren|Salomonen|Marshallinseln)/.test(nom(l)) ? 'liegen' : 'liegt'} in ${l.trans ? `${l.kontinent} und reicht über die Kontinentgrenze` : l.kontinent}.`];
  if (l.hs) teile.push(satz(`Die Hauptstadt ist ${l.hs}.`));
  if (l.sprachen?.length) teile.push(`Amtssprache${l.sprachen.length > 1 ? 'n' : ''}: ${l.sprachen.join(', ')}.`);
  if (l.waehrung) teile.push(`Währung: ${l.waehrung}.`);
  return teile.join(' ');
};

// ---------------- Flaggen ----------------
const flaggen = [];
for (const l of laender) {
  const rand = rng(hash('flagge' + l.code));
  const gleicherKontinent = laender.filter((x) => x.kontinent === l.kontinent && x.code !== l.code && !istZwilling(x.code, l.code));
  const andere = laender.filter((x) => x.code !== l.code && !istZwilling(x.code, l.code));
  // Bei schweren Ländern kommen die falschen Antworten aus demselben Kontinent
  const quelle = (l.stufe >= 2 && gleicherKontinent.length >= 3 ? gleicherKontinent : andere);
  const falsch = pick(quelle, 3, rand);
  const karte = {
    titel: `Flagge: ${l.name}`,
    text: steckbrief(l),
    merke: `Diese Flagge gehört ${zu(l)}.`,
  };
  flaggen.push({
    id: `flg-${l.code}-land`,
    schwierigkeit: stufeName[l.stufe],
    frage: 'Zu welchem Land gehört diese Flagge?',
    bild: { typ: 'flagge', code: l.code },
    richtig: l.name,
    falsch: falsch.map((x) => x.name),
    alias: l.alias ?? [],
    begruendung: `Die gezeigte Flagge gehört ${zu(l)} (${l.kontinent}).`,
    karte: { ...karte, bild: { typ: 'flagge', code: l.code } },
  });
  // Umgekehrt: Land genannt, Flagge wählen (andere falsche Antworten als oben)
  const rand2 = rng(hash('flagge2' + l.code));
  const falsch2 = pick(quelle, 3, rand2);
  flaggen.push({
    id: `flg-${l.code}-bild`,
    schwierigkeit: stufeName[Math.min(3, l.stufe)],
    frage: `Welche Flagge gehört ${zu(l)}?`,
    antwortTyp: 'flagge',
    richtig: l.code,
    falsch: falsch2.map((x) => x.code),
    namen: Object.fromEntries([l, ...falsch2].map((x) => [x.code, x.name])),
    begruendung: `So sieht die Flagge ${von(l)} aus.`,
    karte: { ...karte, bild: { typ: 'flagge', code: l.code } },
  });
}

// ---------------- Länder & Hauptstädte ----------------
const lnd = [];
const kontinente = ['Afrika', 'Asien', 'Europa', 'Nordamerika', 'Südamerika', 'Ozeanien'];
const alleWaehrungen = [...new Set(laender.map((l) => l.waehrung).filter(Boolean))];
const alleSprachen = [...new Set(laender.flatMap((l) => l.sprachen))];

for (const l of laender) {
  const rand = rng(hash('land' + l.code));
  const nachbarn = laender.filter((x) => x.kontinent === l.kontinent && x.code !== l.code);
  const basisKarte = { titel: l.name, text: steckbrief(l), bild: { typ: 'flagge', code: l.code } };

  if (l.hs) {
    const hsAusRegion = nachbarn.filter((x) => x.hs && x.hs !== l.hs).map((x) => x.hs);
    // Bekannte „Fallen“: die größte Stadt, die nicht Hauptstadt ist
    const fallen = {
      au: ['Sydney', 'Melbourne'], ca: ['Toronto', 'Montreal'], tr: ['Istanbul'], ch: ['Zürich', 'Genf'],
      br: ['Rio de Janeiro', 'São Paulo'], us: ['New York'], nz: ['Auckland'], ma: ['Casablanca'],
      ng: ['Lagos'], za: ['Kapstadt', 'Johannesburg'], vn: ['Ho-Chi-Minh-Stadt'], pk: ['Karatschi'],
      in: ['Mumbai'], bo: ['La Paz'], ci: ['Abidjan'], tz: ['Daressalam'], lk: ['Colombo'], mm: ['Rangun'],
      kz: ['Almaty'], bj: ['Cotonou'], cm: ['Douala'], bi: ['Bujumbura'], nl: ['Den Haag', 'Rotterdam'],
      ae: ['Dubai'], sa: ['Dschidda'], ec: ['Guayaquil'], ph: ['Cebu'], cn: ['Shanghai'], it: ['Mailand'],
      es: ['Barcelona'], de: ['München', 'Hamburg'], at: ['Salzburg'], ru: ['Sankt Petersburg'], jp: ['Osaka', 'Kyoto'],
    }[l.code] ?? [];
    const falsch = [...fallen.slice(0, 2), ...pick(hsAusRegion, 3, rand)].slice(0, 3);
    lnd.push({
      id: `lnd-${l.code}-hs`,
      schwierigkeit: stufeName[l.stufe],
      frage: `Wie heißt die Hauptstadt ${von(l)}?`,
      richtig: l.hs,
      falsch,
      alias: l.hsAlias ?? [],
      begruendung: l.hsHinweis ?? `${l.hs} ist die Hauptstadt ${von(l)}.`,
      karte: { ...basisKarte, merke: satz(`Hauptstadt ${von(l)}: ${l.hs}.`) },
      stand: STAND,
    });
    if (l.stufe <= 2 && l.hs !== l.name) {
      const landFalsch = pick(nachbarn.map((x) => x.name), 3, rand);
      lnd.push({
        id: `lnd-${l.code}-hs-rueck`,
        schwierigkeit: stufeName[l.stufe],
        frage: `${l.hs} ist die Hauptstadt von …`,
        richtig: l.name,
        falsch: landFalsch,
        alias: l.alias ?? [],
        begruendung: l.hsHinweis ?? `${l.hs} ist die Hauptstadt ${von(l)}.`,
        karte: { ...basisKarte, merke: `${l.hs} liegt ${inL(l)}.` },
        stand: STAND,
      });
    }
  }

  if (!l.trans && l.stufe <= 2) {
    lnd.push({
      id: `lnd-${l.code}-kontinent`,
      schwierigkeit: l.stufe === 1 ? 'leicht' : 'mittel',
      frage: `Auf welchem Kontinent ${/^die (Vereinigten|Niederlande|Philippinen|Malediven|Seychellen|Bahamas|Komoren|Salomonen|Marshallinseln)/.test(nom(l)) ? 'liegen' : 'liegt'} ${nom(l)}?`,
      richtig: l.kontinent,
      falsch: pick(kontinente, 3, rand, [l.kontinent]),
      begruendung: `${Nom(l)} ${/^die (Vereinigten|Niederlande|Philippinen|Malediven|Seychellen|Bahamas|Komoren|Salomonen|Marshallinseln)/.test(nom(l)) ? 'gehören' : 'gehört'} zu ${l.kontinent}${l.kontinent === 'Nordamerika' && !['us', 'ca', 'mx'].includes(l.code) ? ' (Mittelamerika und die Karibik zählen dazu)' : ''}.`,
      karte: { ...basisKarte, merke: `${Nom(l)} ${/^die (Vereinigten|Niederlande|Philippinen|Malediven|Seychellen|Bahamas|Komoren|Salomonen|Marshallinseln)/.test(nom(l)) ? 'liegen' : 'liegt'} in ${l.kontinent}.` },
    });
  }

  if (l.waehrung && l.stufe <= 2) {
    const andereWaehrungen = laender.filter((x) => x.kontinent === l.kontinent && x.waehrung && x.waehrung !== l.waehrung).map((x) => x.waehrung);
    const falsch = pick(andereWaehrungen.length >= 3 ? andereWaehrungen : alleWaehrungen, 3, rand, [l.waehrung]);
    lnd.push({
      id: `lnd-${l.code}-waehrung`,
      schwierigkeit: l.stufe === 1 ? 'mittel' : 'schwer',
      frage: `Mit welcher Währung bezahlt man ${inL(l)}?`,
      richtig: l.waehrung,
      falsch,
      begruendung: l.waehrungHinweis ?? `Die Währung ${inL(l)} heißt ${l.waehrung}.`,
      karte: { ...basisKarte, merke: `Währung ${inL(l)}: ${l.waehrung}.` },
      stand: STAND,
    });
  }

  if (l.stufe <= 2 && !ohneSprachfrage.has(l.code) && l.sprachen.length) {
    const regional = [...new Set(nachbarn.flatMap((x) => x.sprachen))].filter((s) => !l.sprachen.includes(s));
    const falsch = pick(regional.length >= 3 ? regional : alleSprachen, 3, rand, l.sprachen);
    lnd.push({
      id: `lnd-${l.code}-sprache`,
      schwierigkeit: l.stufe === 1 ? 'leicht' : 'mittel',
      frage: `Welche Sprache ist Amtssprache ${inL(l)}?`,
      richtig: l.sprachen[0],
      falsch,
      begruendung: `${inL(l).charAt(0).toUpperCase() + inL(l).slice(1)} ${l.sprachen.length > 1 ? `sind ${l.sprachen.slice(0, -1).join(', ')} und ${l.sprachen.at(-1)} Amtssprachen` : `ist ${l.sprachen[0]} Amtssprache`}.`,
      karte: { ...basisKarte, merke: `Amtssprache${l.sprachen.length > 1 ? 'n' : ''} ${inL(l)}: ${l.sprachen.join(', ')}.` },
    });
  }
}

// Einwohner-Vergleiche: nur wenn das größte Land mindestens 1,5-mal so viele Einwohner hat
// wie das zweitgrößte der Auswahl. So bleibt die Antwort auch bei ungenauen Schätzungen richtig.
const mitZahl = laender.filter((l) => l.mio);
const rv = rng(4242);
let n = 0;
for (let versuch = 0; versuch < 4000 && n < 30; versuch++) {
  const auswahl = pick(mitZahl, 4, rv).sort((a, b) => b.mio - a.mio);
  if (auswahl[0].mio < auswahl[1].mio * 1.5) continue;
  const id = `lnd-einw-${auswahl.map((x) => x.code).sort().join('-')}`;
  if (lnd.some((q) => q.id === id)) continue;
  const fmt = (m) => (m >= 1000 ? `${(m / 1000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mrd.` : `${m.toLocaleString('de-DE')} Mio.`);
  lnd.push({
    id,
    schwierigkeit: auswahl[0].mio > 300 ? 'leicht' : 'mittel',
    frage: 'Welches dieser Länder hat die meisten Einwohner?',
    richtig: auswahl[0].name,
    falsch: auswahl.slice(1).map((x) => x.name),
    begruendung: `Ungefähre Einwohnerzahlen: ${auswahl.map((x) => `${x.name} ${fmt(x.mio)}`).join(', ')}`,
    karte: { titel: 'Einwohnerzahlen', text: auswahl.map((x) => `${x.name}: etwa ${fmt(x.mio)}`).join('. ') + '.', merke: `${auswahl[0].name} hat mit etwa ${fmt(auswahl[0].mio)} die meisten Einwohner dieser vier.` },
    stand: '2025',
  });
  n++;
}

fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(path.join(out, 'generiert'), { recursive: true });
fs.writeFileSync(path.join(out, 'generiert', 'flaggen.json'), JSON.stringify({ klasse: 'flaggen', erzeugt: 'scripts/generate-laender.mjs', fragen: flaggen }, null, 1));
fs.writeFileSync(path.join(out, 'generiert', 'laender.json'), JSON.stringify({ klasse: 'laender', erzeugt: 'scripts/generate-laender.mjs', fragen: lnd }, null, 1));
console.log(`Flaggen: ${flaggen.length} Fragen, Länder & Hauptstädte: ${lnd.length} Fragen`);
