// Holt die neuesten Meldungen von tagesschau, ZDFheute und Deutschlandfunk
// und schreibt sie nach public/news.json. Ältere Meldungen der letzten 7 Tage bleiben erhalten.
// Aufruf: npm run news  (läuft automatisch in der GitHub Action)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUELLEN, ausTagesschau, ausZdf, ausDlf, zusammenfuehren } from '../src/lib/nachrichten.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const datei = path.join(root, 'public', 'news.json');
const KOPF = { 'User-Agent': 'Wissenstag-Lernseite/2.0 (+https://github.com/)', Accept: 'application/json, application/rss+xml, application/xml, text/xml' };

async function holen(url, art) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { headers: KOPF, redirect: 'follow', signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return art === 'json' ? await res.json() : await res.text();
  } finally {
    clearTimeout(t);
  }
}

const quellenStatus = [];
const listen = [];
for (const [schluessel, art, umwandeln] of [['tagesschau', 'json', ausTagesschau], ['zdf', 'text', ausZdf], ['dlf', 'text', ausDlf]]) {
  const q = QUELLEN[schluessel];
  try {
    const roh = await holen(q.url, art);
    const meldungen = umwandeln(roh);
    listen.push(meldungen);
    quellenStatus.push({ name: q.name, seite: q.seite, ok: true, anzahl: meldungen.length });
    console.log(`${q.name.padEnd(16)} ${meldungen.length} Meldungen`);
  } catch (e) {
    quellenStatus.push({ name: q.name, seite: q.seite, ok: false, anzahl: 0 });
    console.warn(`${q.name.padEnd(16)} nicht erreichbar: ${e.message}`);
  }
}

let alt = { meldungen: [] };
try { alt = JSON.parse(fs.readFileSync(datei, 'utf8')); } catch { /* erste Ausführung */ }

if (!quellenStatus.some((q) => q.ok)) {
  console.warn('Keine Quelle erreichbar. news.json bleibt unverändert, damit das alte Stand-Datum sichtbar bleibt.');
  process.exit(0);
}

const meldungen = zusammenfuehren([...listen, alt.meldungen ?? []], { tage: 7, max: 160 });
const ausgabe = { stand: new Date().toISOString(), quellen: quellenStatus, meldungen };
fs.writeFileSync(datei, JSON.stringify(ausgabe, null, 1) + '\n');
console.log(`news.json geschrieben: ${meldungen.length} Meldungen`);
