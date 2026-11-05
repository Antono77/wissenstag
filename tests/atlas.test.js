import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { abstandKm, atlasFragen, falscheAntworten, imLevel, tippText, LEVEL, levelVon } from '../src/lib/atlas-daten.js';
import { bereinige } from '../src/lib/speicher.js';

// Gleiche Aufbereitung wie ladeOrte() im Browser
const roh = JSON.parse(fs.readFileSync(new URL('../public/data/atlas/orte.json', import.meta.url), 'utf8'));
const nachCode = Object.fromEntries(roh.laender.map((l) => [l.code, l]));
const staedte = roh.staedte.map((s) => ({ ...s, land: nachCode[s.code], kontinent: nachCode[s.code].kontinent }));
const orte = { ...roh, staedte, nachCode };

describe('Atlas: Daten', () => {
  it('enthält alle 195 Staaten und jede Stadt gehört zu einem Land', () => {
    expect(orte.laender).toHaveLength(195);
    for (const s of orte.staedte) expect(nachCode[s.code]).toBeDefined();
  });

  it('Abstand Berlin–Paris stimmt auf etwa 10 km', () => {
    expect(Math.abs(abstandKm([13.40, 52.52], [2.35, 48.86]) - 878)).toBeLessThan(10);
  });
});

describe('Atlas: Fragen je Klasse', () => {
  it('Klasse 1 fragt Länder, Klasse 2 Städte, Klasse 3 beides', () => {
    const k1 = atlasFragen('atlas-laender', orte);
    const k2 = atlasFragen('atlas-staedte', orte);
    const k3 = atlasFragen('atlas-globus', orte);
    expect(k1.every((q) => q.ziel.art === 'land')).toBe(true);
    expect(k2.every((q) => q.ziel.art === 'stadt')).toBe(true);
    expect(k3.length).toBe(k1.length + k2.length);
    const ids = [...k1, ...k2, ...k3].map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('Vatikanstadt wird nicht als Stadt abgefragt (liegt mitten in Rom)', () => {
    expect(atlasFragen('atlas-staedte', orte).some((q) => q.ziel.key === 'hs-va')).toBe(false);
  });

  it('Anfänger bekommen nur bekannte Orte, Profis alle', () => {
    const alle = atlasFragen('atlas-laender', orte);
    expect(alle.filter((q) => imLevel(q, 'anfaenger')).every((q) => q.ziel.stufe === 1)).toBe(true);
    expect(alle.filter((q) => imLevel(q, 'profi'))).toHaveLength(195);
  });
});

describe('Atlas: falsche Antworten', () => {
  const ziele = atlasFragen('atlas-laender', orte).map((q) => q.ziel);
  const kenia = ziele.find((z) => z.key === 'ke');

  it('liefert immer drei verschiedene falsche Namen ohne die richtige Antwort', () => {
    for (const level of Object.keys(LEVEL)) {
      const f = falscheAntworten(kenia, ziele, level);
      expect(f).toHaveLength(3);
      expect(new Set(f).size).toBe(3);
      expect(f).not.toContain('Kenia');
    }
  });

  it('Fortgeschritten: falsche Antworten aus demselben Kontinent', () => {
    const f = falscheAntworten(kenia, ziele, 'fortgeschritten');
    for (const name of f) expect(ziele.find((z) => z.name === name).kontinent).toBe('Afrika');
  });

  it('Profi: falsche Antworten sind Nachbarn (unter 1.500 km)', () => {
    const f = falscheAntworten(kenia, ziele, 'profi');
    for (const name of f) expect(abstandKm(ziele.find((z) => z.name === name).pos, kenia.pos)).toBeLessThan(1500);
  });
});

describe('Atlas: Tipps für Anfänger', () => {
  it('Klasse 3 nennt den Kontinent, Klasse 1 die Hauptstadt', () => {
    const k3 = atlasFragen('atlas-globus', orte).find((q) => q.ziel.key === 'hs-ke');
    expect(tippText(k3.ziel, 'atlas-globus')).toBe('Der gesuchte Ort liegt in Afrika.');
    const k1 = atlasFragen('atlas-laender', orte).find((q) => q.ziel.key === 'ke');
    expect(tippText(k1.ziel, 'atlas-laender')).toContain('Nairobi');
  });

  it('nur das Level Anfänger zeigt Tipps', () => {
    expect(LEVEL.anfaenger.hilfe).toBe(true);
    expect(LEVEL.fortgeschritten.hilfe).toBe(false);
    expect(LEVEL.profi.hilfe).toBe(false);
  });

  it('unbekanntes Level im Speicher fällt auf Anfänger zurück', () => {
    const z = bereinige({ einstellungen: { atlasLevel: 'quatsch' } });
    expect(levelVon(z)).toBe('anfaenger');
    expect(levelVon(bereinige({ einstellungen: { atlasLevel: 'profi' } }))).toBe('profi');
  });
});
