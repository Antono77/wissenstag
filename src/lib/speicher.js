// Fortschritt im Browser speichern (localStorage) mit Export und Import als JSON-Datei.
import { heute } from './zeit.js';

export const SCHLUESSEL = 'wissenstag.v2';
export const VERSION = 2;

export function leererZustand() {
  return {
    version: VERSION,
    erstellt: heute(),
    einstellungen: {
      ziel: { art: 'zeit', wert: 10 }, // art: zeit | fragen | frei
      theme: 'auto', // auto | hell | dunkel
      kartenZeigen: true,
      atlasLevel: 'anfaenger', // anfaenger | fortgeschritten | profi
      ddf: { zeitlimit: 10, zeitAn: true, freitext: false, leben: 3, namen: ['', ''] },
    },
    xp: 0,
    klassenXp: {},
    fragen: {}, // id → { f, d, r, w, l, z }
    tage: {}, // 'YYYY-MM-DD' → { einheiten, fragen, richtig, sekunden }
    highscore: { ddf: 0 },
    newsQuiz: { beste: 0 },
    newsTag: { tag: null, meldungen: [] }, // die drei Meldungen des Tages
    kartenPos: {}, // Lernmodus: zuletzt angesehene Karte je Klasse
  };
}

// Speicher-Zugriff mit try/catch: Im privaten Modus oder bei vollem Speicher läuft die Seite trotzdem.
function lesen(speicher) {
  try {
    const roh = speicher?.getItem(SCHLUESSEL);
    return roh ? JSON.parse(roh) : null;
  } catch {
    return null;
  }
}

function schreiben(speicher, zustand) {
  try {
    speicher?.setItem(SCHLUESSEL, JSON.stringify(zustand));
    return true;
  } catch {
    return false;
  }
}

// Fehlende Felder ergänzen, falsche Typen verwerfen
export function bereinige(roh) {
  const basis = leererZustand();
  if (!roh || typeof roh !== 'object') return basis;
  const z = { ...basis, ...roh };
  z.version = VERSION;
  z.einstellungen = { ...basis.einstellungen, ...(roh.einstellungen ?? {}) };
  z.einstellungen.ddf = { ...basis.einstellungen.ddf, ...(roh.einstellungen?.ddf ?? {}) };
  z.einstellungen.ziel = { ...basis.einstellungen.ziel, ...(roh.einstellungen?.ziel ?? {}) };
  for (const feld of ['klassenXp', 'fragen', 'tage', 'highscore', 'newsQuiz', 'newsTag', 'kartenPos']) {
    z[feld] = roh[feld] && typeof roh[feld] === 'object' && !Array.isArray(roh[feld]) ? { ...basis[feld], ...roh[feld] } : basis[feld];
  }
  z.xp = Number.isFinite(roh.xp) && roh.xp >= 0 ? roh.xp : 0;
  return z;
}

export function erstelleSpeicher(speicher = globalThis.localStorage) {
  let zustand = bereinige(lesen(speicher));
  const hoerer = new Set();
  let speicherFehlerGemeldet = false;

  const api = {
    get: () => zustand,
    aendern(fn) {
      fn(zustand);
      const ok = schreiben(speicher, zustand);
      if (!ok && !speicherFehlerGemeldet) {
        speicherFehlerGemeldet = true;
        api.onFehler?.();
      }
      for (const h of hoerer) h(zustand);
    },
    abonnieren(fn) {
      hoerer.add(fn);
      return () => hoerer.delete(fn);
    },
    exportieren() {
      return JSON.stringify({ app: 'wissenstag', exportiert: new Date().toISOString(), daten: zustand }, null, 2);
    },
    importieren(text) {
      let obj;
      try { obj = JSON.parse(text); } catch { throw new Error('Die Datei ist kein gültiges JSON.'); }
      const daten = obj?.app === 'wissenstag' ? obj.daten : obj;
      if (!daten || typeof daten !== 'object' || !('fragen' in daten || 'xp' in daten)) {
        throw new Error('Die Datei enthält keinen Wissenstag-Fortschritt.');
      }
      zustand = bereinige(daten);
      schreiben(speicher, zustand);
      for (const h of hoerer) h(zustand);
      return zustand;
    },
    zuruecksetzen() {
      const theme = zustand.einstellungen.theme;
      zustand = leererZustand();
      zustand.einstellungen.theme = theme;
      schreiben(speicher, zustand);
      for (const h of hoerer) h(zustand);
    },
    onFehler: null,
  };
  return api;
}
