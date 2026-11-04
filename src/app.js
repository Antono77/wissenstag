// Gemeinsamer App-Zustand: Speicher und Hilfen zum Verbuchen von Antworten.
import { erstelleSpeicher } from './lib/speicher.js';
import { bewerte } from './lib/lernlogik.js';
import { XP_RICHTIG, XP_EINHEIT } from './lib/punkte.js';
import { heute } from './lib/zeit.js';

export const speicher = erstelleSpeicher();

function tagEintrag(z, tag) {
  z.tage[tag] ??= { einheiten: 0, fragen: 0, richtig: 0, sekunden: 0 };
  return z.tage[tag];
}

// Eine beantwortete Lernfrage verbuchen
export function verbucheAntwort(q, richtig) {
  const tag = heute();
  let xp = 0;
  speicher.aendern((z) => {
    z.fragen[q.id] = bewerte(z.fragen[q.id], richtig, tag);
    const t = tagEintrag(z, tag);
    t.fragen += 1;
    if (richtig) {
      t.richtig += 1;
      xp = XP_RICHTIG;
      z.xp += xp;
      z.klassenXp[q.klasse] = (z.klassenXp[q.klasse] ?? 0) + xp;
    }
  });
  return xp;
}

export function verbucheEinheit(sekunden) {
  const tag = heute();
  speicher.aendern((z) => {
    const t = tagEintrag(z, tag);
    t.einheiten += 1;
    t.sekunden += Math.round(sekunden);
    z.xp += XP_EINHEIT;
  });
  return XP_EINHEIT;
}

// Für Spiele ohne Lernwirkung (z. B. Der Dümmste fliegt) nur Zeit/Tag notieren
export function verbucheSpielzeit(sekunden) {
  const tag = heute();
  speicher.aendern((z) => { tagEintrag(z, tag).sekunden += Math.round(sekunden); });
}
