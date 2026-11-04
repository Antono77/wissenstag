// Prüft alle Fragen-Dateien. Aufruf: npm run pruefen
// Bricht mit Fehlercode ab, wenn etwas nicht stimmt.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'public', 'data');
const flagDir = path.join(root, 'node_modules', 'flag-icons', 'flags', '4x3');
const MINDEST = 100;

const fehler = [];
const warnungen = [];
const ids = new Map();
const norm = (s) => String(s).trim().toLowerCase();

const { klassen } = JSON.parse(fs.readFileSync(path.join(dataDir, 'klassen.json'), 'utf8'));
const zeilen = [];
let gesamt = 0;

for (const k of klassen) {
  let anzahl = 0;
  const stufen = { leicht: 0, mittel: 0, schwer: 0 };
  for (const datei of k.dateien) {
    const p = path.join(dataDir, datei);
    if (!fs.existsSync(p)) { fehler.push(`${k.id}: Datei fehlt: ${datei}`); continue; }
    let daten;
    try { daten = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { fehler.push(`${datei}: kein gültiges JSON (${e.message})`); continue; }
    if (!Array.isArray(daten.fragen)) { fehler.push(`${datei}: Feld „fragen“ fehlt`); continue; }
    for (const q of daten.fragen) {
      const wo = `${datei} → ${q.id ?? '(ohne id)'}`;
      if (!q.id) fehler.push(`${wo}: id fehlt`);
      else if (ids.has(q.id)) fehler.push(`${wo}: id doppelt (auch in ${ids.get(q.id)})`);
      else ids.set(q.id, datei);
      if (!['leicht', 'mittel', 'schwer'].includes(q.schwierigkeit)) fehler.push(`${wo}: schwierigkeit muss leicht, mittel oder schwer sein`);
      else stufen[q.schwierigkeit]++;
      for (const feld of ['frage', 'richtig', 'begruendung']) if (!q[feld] || !String(q[feld]).trim()) fehler.push(`${wo}: ${feld} fehlt`);
      if (!Array.isArray(q.falsch) || q.falsch.length !== 3) fehler.push(`${wo}: genau drei falsche Antworten nötig`);
      else {
        const alle = [q.richtig, ...q.falsch].map(norm);
        if (new Set(alle).size !== 4) fehler.push(`${wo}: Antworten nicht verschieden: ${[q.richtig, ...q.falsch].join(' | ')}`);
        if (q.falsch.some((f) => !String(f).trim())) fehler.push(`${wo}: leere falsche Antwort`);
      }
      if (!q.karte || !q.karte.titel || !q.karte.text || !q.karte.merke) fehler.push(`${wo}: karte braucht titel, text und merke`);
      if (q.antwortTyp === 'flagge') {
        for (const c of [q.richtig, ...(q.falsch ?? [])]) if (!fs.existsSync(path.join(flagDir, `${c}.svg`))) fehler.push(`${wo}: Flagge ${c} fehlt`);
      }
      if (q.bild?.typ === 'flagge' && !fs.existsSync(path.join(flagDir, `${q.bild.code}.svg`))) fehler.push(`${wo}: Flagge ${q.bild.code} fehlt`);
      if (/[–—]/.test(JSON.stringify([q.frage, q.begruendung, q.karte]))) warnungen.push(`${wo}: enthält einen Gedankenstrich`);
      anzahl++;
    }
  }
  if (anzahl < MINDEST) fehler.push(`${k.id}: nur ${anzahl} Fragen, mindestens ${MINDEST} nötig`);
  zeilen.push([k.name, anzahl, stufen.leicht, stufen.mittel, stufen.schwer]);
  gesamt += anzahl;
}

console.log('Klasse'.padEnd(26) + 'Fragen  leicht  mittel  schwer');
for (const [n, a, l, m, s] of zeilen) console.log(n.padEnd(26) + String(a).padStart(6) + String(l).padStart(8) + String(m).padStart(8) + String(s).padStart(8));
console.log('Gesamt'.padEnd(26) + String(gesamt).padStart(6));
if (warnungen.length) console.log(`\n${warnungen.length} Hinweise, z. B.:\n  ` + warnungen.slice(0, 5).join('\n  '));
if (fehler.length) {
  console.error(`\n${fehler.length} Fehler:\n  ` + fehler.slice(0, 40).join('\n  '));
  process.exit(1);
}
console.log('\nAlle Fragen sind gültig.');
