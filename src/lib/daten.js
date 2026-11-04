// Lädt Klassenliste und Fragen-Dateien (mit Zwischenspeicher).
const basis = import.meta.env?.BASE_URL ?? './';
const url = (pfad) => `${basis}${pfad}`.replace(/\/\.\//g, '/');

let klassenCache = null;
const fragenCache = new Map();

export async function ladeKlassen() {
  if (klassenCache) return klassenCache;
  const res = await fetch(url('data/klassen.json'));
  if (!res.ok) throw new Error('Klassenliste nicht gefunden');
  const json = await res.json();
  klassenCache = json.klassen;
  return klassenCache;
}

export async function ladeKlasse(klasse) {
  if (fragenCache.has(klasse.id)) return fragenCache.get(klasse.id);
  const promise = Promise.all(
    klasse.dateien.map(async (d) => {
      try {
        const res = await fetch(url(`data/${d}`));
        if (!res.ok) return [];
        const json = await res.json();
        return json.fragen ?? [];
      } catch {
        return [];
      }
    }),
  ).then((teile) => teile.flat().map((q) => ({ ...q, klasse: klasse.id })));
  fragenCache.set(klasse.id, promise);
  return promise;
}

export async function ladeAlle(klassen) {
  const listen = await Promise.all(klassen.map((k) => ladeKlasse(k)));
  return listen.flat();
}

export const flaggeUrl = (code) => url(`flags/${code}.svg`);
export const datenUrl = url;
