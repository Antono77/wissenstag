// XP, Level, Serie
import { heute, plusTage, letzteTage } from './zeit.js';

export const XP_RICHTIG = 10;
export const XP_EINHEIT = 20;

export const LEVEL = [
  { name: 'Neugierig', ab: 0 },
  { name: 'Aufmerksam', ab: 100 },
  { name: 'Wissbegierig', ab: 300 },
  { name: 'Kenner', ab: 700 },
  { name: 'Allrounder', ab: 1500 },
  { name: 'Fachmann', ab: 3000 },
  { name: 'Universalgenie', ab: 6000 },
];

export function levelInfo(xp) {
  let i = 0;
  while (i + 1 < LEVEL.length && xp >= LEVEL[i + 1].ab) i++;
  const aktuell = LEVEL[i];
  const naechstes = LEVEL[i + 1] ?? null;
  const anteil = naechstes ? (xp - aktuell.ab) / (naechstes.ab - aktuell.ab) : 1;
  return { stufe: i + 1, name: aktuell.name, naechstes, anteil, fehlt: naechstes ? naechstes.ab - xp : 0 };
}

// Stufen pro Klasse (1 bis 10)
const KLASSEN_STUFEN = [0, 50, 120, 220, 350, 520, 750, 1000, 1350, 1800];
export function klassenStufe(xp = 0) {
  let i = 0;
  while (i + 1 < KLASSEN_STUFEN.length && xp >= KLASSEN_STUFEN[i + 1]) i++;
  return i + 1;
}

// Serie: aufeinanderfolgende Tage mit mindestens einer abgeschlossenen Einheit.
// Zählt bis heute, oder bis gestern, wenn heute noch nichts erledigt ist.
export function serie(tage, tag = heute()) {
  const erledigt = (t) => (tage[t]?.einheiten ?? 0) > 0;
  let start = erledigt(tag) ? tag : plusTage(tag, -1);
  let n = 0;
  while (erledigt(start)) {
    n++;
    start = plusTage(start, -1);
  }
  return n;
}

export function wochenleiste(tage, tag = heute()) {
  return letzteTage(7, tag).map((t) => ({ tag: t, erledigt: (tage[t]?.einheiten ?? 0) > 0, heute: t === tag }));
}
