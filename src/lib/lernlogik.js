// Wiederholung in Abständen (Leitner-System mit sechs Fächern).
// Fach 0 = neu, Fach 1 = gerade falsch, Fach 5 = sitzt sicher.
import { plusTage } from './zeit.js';

export const ABSTAENDE = [0, 1, 3, 7, 14, 30]; // Tage bis zur nächsten Wiederholung je Fach
export const GELERNT_AB_FACH = 3;
export const MEISTER_ANTEIL = 0.9;

export function neuerEintrag() {
  return { f: 0, d: null, r: 0, w: 0, l: null };
}

// Ergebnis einer Antwort einarbeiten. Gibt einen neuen Eintrag zurück (unveränderlich).
export function bewerte(eintrag, richtig, tag) {
  const e = { ...(eintrag ?? neuerEintrag()) };
  if (richtig) {
    // Wer eine neue Frage direkt richtig hat, springt in Fach 2
    e.f = e.f === 0 ? 2 : Math.min(5, e.f + 1);
    e.r += 1;
  } else {
    e.f = 1;
    e.w += 1;
  }
  e.d = plusTage(tag, ABSTAENDE[e.f]);
  e.l = tag;
  e.z = richtig ? 1 : 0; // letzte Antwort richtig?
  return e;
}

export const istFaellig = (e, tag) => !!e && e.f > 0 && e.d != null && e.d <= tag;
export const istGelernt = (e) => !!e && e.f >= GELERNT_AB_FACH;
export const istSchwaeche = (e) => !!e && e.w > 0 && (e.f <= 2 || e.z === 0);

// Stellt die Warteschlange für eine Einheit zusammen.
// fragen: Liste aller Fragen der gewählten Klassen, verlauf: { id: eintrag }
export function stelleZusammen(fragen, verlauf, { tag, modus = 'gemischt', anzahl = 20, rand = Math.random }) {
  const faellig = [];
  const neu = [];
  const schwach = [];
  for (const q of fragen) {
    const e = verlauf[q.id];
    if (!e || e.f === 0) neu.push(q);
    else if (istFaellig(e, tag)) faellig.push(q);
    if (istSchwaeche(e)) schwach.push(q);
  }
  const mischen = (a) => a.map((x) => [rand(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

  if (modus === 'schwaechen') {
    return mischen(schwach).slice(0, anzahl).map((q) => ({ frage: q, art: 'schwaeche' }));
  }

  // Fällige Wiederholungen zuerst, ältestes Fälligkeitsdatum vorn
  faellig.sort((a, b) => (verlauf[a.id].d < verlauf[b.id].d ? -1 : 1));
  const wiederholung = faellig.slice(0, Math.ceil(anzahl * 0.6)).map((q) => ({ frage: q, art: 'wiederholung' }));

  // Neue Fragen: leichte zuerst, innerhalb der Stufen zufällig, Klassen gemischt
  const rang = { leicht: 0, mittel: 1, schwer: 2 };
  const neuSortiert = mischen(neu).sort((a, b) => rang[a.schwierigkeit] - rang[b.schwierigkeit] + (rand() - 0.5) * 1.2);
  const rest = Math.max(0, anzahl - wiederholung.length);
  const neue = neuSortiert.slice(0, rest).map((q) => ({ frage: q, art: 'neu' }));

  // Reicht das nicht, kommen bekannte Fragen dazu, die bald fällig wären
  let auffuellen = [];
  if (wiederholung.length + neue.length < anzahl) {
    const gesehen = new Set([...wiederholung, ...neue].map((x) => x.frage.id));
    const bekannt = fragen.filter((q) => !gesehen.has(q.id) && verlauf[q.id]);
    bekannt.sort((a, b) => (verlauf[a.id].d < verlauf[b.id].d ? -1 : 1));
    auffuellen = bekannt.slice(0, anzahl - wiederholung.length - neue.length).map((q) => ({ frage: q, art: 'uebung' }));
  }
  // Wiederholungen und neue Fragen verzahnen, damit es abwechslungsreich bleibt
  const ergebnis = [];
  const a = [...wiederholung];
  const b = [...neue, ...auffuellen];
  while (a.length || b.length) {
    if (a.length) ergebnis.push(a.shift());
    if (b.length) ergebnis.push(b.shift());
    if (b.length && rand() < 0.5) ergebnis.push(b.shift());
  }
  return ergebnis.slice(0, anzahl);
}

// Statistik pro Klasse
export function klassenStatistik(fragen, verlauf) {
  let gesehen = 0, gelernt = 0, richtig = 0, falsch = 0;
  for (const q of fragen) {
    const e = verlauf[q.id];
    if (!e) continue;
    gesehen++;
    if (istGelernt(e)) gelernt++;
    richtig += e.r;
    falsch += e.w;
  }
  const gesamt = fragen.length;
  const antworten = richtig + falsch;
  return {
    gesamt, gesehen, gelernt, richtig, falsch, antworten,
    anteilGelernt: gesamt ? gelernt / gesamt : 0,
    quote: antworten ? richtig / antworten : null,
    meister: gesamt > 0 && gelernt / gesamt >= MEISTER_ANTEIL,
  };
}
