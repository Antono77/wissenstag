// Erzeugt Fragen aus Faktentabellen (scripts/fakten/<klasse>.mjs)
// und schreibt sie nach public/data/generiert/<klasse>.json.
// Aufruf: npm run fakten
//
// Eine Tabelle besteht aus Zeilen (je ein geprüfter Fakt) und Fragevorlagen.
// Die falschen Antworten kommen aus anderen Zeilen derselben Tabelle.
// So sind sie plausibel und trotzdem sicher falsch.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const faktenDir = path.join(root, 'scripts', 'fakten');
const outDir = path.join(root, 'public', 'data', 'generiert');

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
export const slug = (s) =>
  String(s).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const stufen = { 1: 'leicht', 2: 'mittel', 3: 'schwer' };

function ziehe(pool, n, rand) {
  const p = [...pool];
  const res = [];
  while (res.length < n && p.length) res.push(p.splice(Math.floor(rand() * p.length), 1)[0]);
  return res;
}

// Falsche Jahreszahlen: bevorzugt Jahre anderer Zeilen in der Nähe, sonst kleine Abstände
function falscheJahre(jahr, andere, rand) {
  const j = Number(jahr);
  const nah = [...new Set(andere.map(Number))].filter((x) => x !== j && Math.abs(x - j) <= 40);
  const res = ziehe(nah, 3, rand);
  const schritte = Math.abs(j) > 1000 ? [1, 2, 3, 4, 5, 7, 10, 12, 15, 20] : [10, 20, 30, 50, 100];
  let i = 0;
  while (res.length < 3 && i < 200) {
    const d = schritte[Math.floor(rand() * schritte.length)] * (rand() < 0.5 ? -1 : 1);
    const k = j + d;
    if (k !== j && !res.includes(k) && (j < 0 || k > 0) && k <= 2026) res.push(k);
    i++;
  }
  return res.map(String);
}

export function erzeuge(def) {
  const fragen = [];
  for (const t of def.tabellen) {
    const zeilen = t.zeilen.map((z) => {
      const r = Array.isArray(z) ? Object.fromEntries(t.spalten.map((s, i) => [s, z[i]])) : { ...z };
      return r;
    });
    const keys = new Set();
    for (const r of zeilen) {
      const k = slug(r[t.spalten[0]]);
      if (keys.has(k)) throw new Error(`${def.klasse}/${t.prefix}: doppelter Schlüssel ${k}`);
      keys.add(k);
    }
    t.fragen.forEach((v, vi) => {
      const geeignet = zeilen.filter((r) => (v.wenn ? v.wenn(r) : true) && v.richtig(r) != null && v.richtig(r) !== '');
      for (const r of geeignet) {
        const fmt = v.format ?? ((x) => String(x));
        const richtig = fmt(v.richtig(r));
        const id = `${t.prefix}-${slug(r[t.spalten[0]])}${t.fragen.length > 1 ? '-' + (vi + 1) : ''}`;
        const rand = rng(hash(id));
        // Werte, die für diese Zeile ebenfalls richtig wären, nie als falsche Antwort anbieten
        const verboten = new Set([richtig, ...(v.auchRichtig ? v.auchRichtig(r) : [])].map(String));
        let falsch;
        if (v.falsch) {
          falsch = [...new Set(v.falsch(r, rand).map(String))].filter((x) => !verboten.has(x)).slice(0, 3);
        } else if (v.typ === 'jahr') {
          falsch = falscheJahre(v.richtig(r), zeilen.map((x) => v.richtig(x)).filter((x) => x != null), rand)
            .map((x) => fmt(Number(x))).filter((x) => !verboten.has(x));
        } else {
          const pool = [...new Set([
            ...zeilen.filter((x) => x !== r && (v.gleicheGruppe ? v.gleicheGruppe(x, r) : true)).map((x) => v.richtig(x)),
            ...(v.extraFalsch ?? []),
          ].filter((x) => x != null).map(String))].filter((x) => !verboten.has(x));
          falsch = ziehe(pool, 3, rand);
          if (falsch.length < 3) {
            const rest = [...new Set(zeilen.map((x) => v.richtig(x)).filter((x) => x != null).map(String))]
              .filter((x) => !verboten.has(x) && !falsch.includes(x));
            falsch.push(...ziehe(rest, 3 - falsch.length, rand));
          }
        }
        if (falsch.length < 3) throw new Error(`${id}: zu wenige falsche Antworten`);
        const s = r.s ?? (typeof t.schwierigkeit === 'function' ? t.schwierigkeit(r) : t.schwierigkeit ?? 2);
        const merke = v.merke(r);
        const q = {
          id,
          schwierigkeit: typeof s === 'number' ? stufen[s] : s,
          frage: v.frage(r),
          richtig,
          falsch,
          begruendung: v.begruendung ? v.begruendung(r) : merke,
          karte: {
            titel: v.titel ? v.titel(r) : String(r[t.spalten[0]]),
            text: (v.text ? v.text(r) : null) || r.info || merke,
            merke,
          },
        };
        if (v.alias) q.alias = v.alias(r).filter(Boolean);
        if (v.ddf?.(r) || r.ddf) q.ddf = true;
        if (t.stand) q.stand = t.stand;
        if (v.bild) q.bild = v.bild(r);
        fragen.push(q);
      }
    });
  }
  return { klasse: def.klasse, erzeugt: 'scripts/generate-fakten.mjs', fragen };
}

// Direkt aufgerufen: alle Tabellen verarbeiten
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fs.mkdirSync(outDir, { recursive: true });
  const dateien = fs.readdirSync(faktenDir).filter((f) => f.endsWith('.mjs')).sort();
  for (const f of dateien) {
    const def = (await import(pathToFileURL(path.join(faktenDir, f)).href)).default;
    const daten = erzeuge(def);
    fs.writeFileSync(path.join(outDir, `${def.klasse}.json`), JSON.stringify(daten, null, 1) + '\n');
    console.log(`${def.klasse.padEnd(14)} ${String(daten.fragen.length).padStart(4)} Fragen aus Tabellen`);
  }
}
