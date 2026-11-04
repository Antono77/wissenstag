import { describe, it, expect } from 'vitest';
import { bewerte, stelleZusammen, istFaellig, istSchwaeche, klassenStatistik } from '../src/lib/lernlogik.js';
import { levelInfo, serie, wochenleiste, klassenStufe } from '../src/lib/punkte.js';
import { passtFreitext, normalisiere, freitextTauglich } from '../src/lib/text.js';
import { plusTage, tageDazwischen } from '../src/lib/zeit.js';
import { erstelleSpeicher, bereinige } from '../src/lib/speicher.js';
import { zusammenfuehren, ausDlf, newsQuiz, tagesAuswahl, absaetzeAusDetails } from '../src/lib/nachrichten.js';

describe('Wiederholung in Abständen', () => {
  it('neue Frage richtig: Fach 2, in 3 Tagen wieder', () => {
    const e = bewerte(null, true, '2026-11-04');
    expect(e.f).toBe(2);
    expect(e.d).toBe('2026-11-07');
  });
  it('falsche Antwort setzt auf Fach 1 und morgen zurück', () => {
    const e = bewerte({ f: 4, d: '2026-11-04', r: 3, w: 0 }, false, '2026-11-04');
    expect(e.f).toBe(1);
    expect(e.d).toBe('2026-11-05');
    expect(e.w).toBe(1);
  });
  it('höchstes Fach ist 5 mit 30 Tagen', () => {
    const e = bewerte({ f: 5, d: null, r: 9, w: 0 }, true, '2026-11-04');
    expect(e.f).toBe(5);
    expect(tageDazwischen('2026-11-04', e.d)).toBe(30);
  });
  it('erkennt fällige Fragen und Schwächen', () => {
    expect(istFaellig({ f: 1, d: '2026-11-03' }, '2026-11-04')).toBe(true);
    expect(istFaellig({ f: 1, d: '2026-11-05' }, '2026-11-04')).toBe(false);
    expect(istSchwaeche({ f: 1, w: 1, z: 0 })).toBe(true);
    expect(istSchwaeche({ f: 4, w: 1, z: 1 })).toBe(false);
  });
  it('stellt fällige Wiederholungen vor neue Fragen', () => {
    const fragen = Array.from({ length: 50 }, (_, i) => ({ id: `q${i}`, schwierigkeit: 'leicht' }));
    const verlauf = { q3: { f: 1, d: '2026-11-01', r: 0, w: 1 }, q7: { f: 2, d: '2026-11-04', r: 1, w: 0 } };
    const liste = stelleZusammen(fragen, verlauf, { tag: '2026-11-04', anzahl: 10, rand: () => 0.3 });
    expect(liste).toHaveLength(10);
    expect(liste[0].art).toBe('wiederholung');
    expect(liste.filter((x) => x.art === 'wiederholung').map((x) => x.frage.id).sort()).toEqual(['q3', 'q7']);
    expect(new Set(liste.map((x) => x.frage.id)).size).toBe(10);
  });
  it('Schwächen üben liefert nur falsch beantwortete Fragen', () => {
    const fragen = [{ id: 'a', schwierigkeit: 'leicht' }, { id: 'b', schwierigkeit: 'leicht' }];
    const liste = stelleZusammen(fragen, { a: { f: 1, d: '2026-11-05', r: 0, w: 2, z: 0 } }, { tag: '2026-11-04', modus: 'schwaechen', anzahl: 10 });
    expect(liste.map((x) => x.frage.id)).toEqual(['a']);
  });
  it('Meister ab 90 Prozent gelernt', () => {
    const fragen = Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` }));
    const verlauf = Object.fromEntries(fragen.slice(0, 9).map((q) => [q.id, { f: 3, r: 2, w: 0 }]));
    const st = klassenStatistik(fragen, verlauf);
    expect(st.anteilGelernt).toBeCloseTo(0.9);
    expect(st.meister).toBe(true);
  });
});

describe('XP, Level und Serie', () => {
  it('ordnet Level richtig zu', () => {
    expect(levelInfo(0).name).toBe('Neugierig');
    expect(levelInfo(99).name).toBe('Neugierig');
    expect(levelInfo(100).name).toBe('Aufmerksam');
    expect(levelInfo(6000).name).toBe('Universalgenie');
    expect(levelInfo(150).fehlt).toBe(150);
  });
  it('zählt die Serie bis heute oder gestern', () => {
    const tage = { '2026-11-02': { einheiten: 1 }, '2026-11-03': { einheiten: 2 }, '2026-11-04': { einheiten: 0 } };
    expect(serie(tage, '2026-11-04')).toBe(2);
    tage['2026-11-04'].einheiten = 1;
    expect(serie(tage, '2026-11-04')).toBe(3);
    expect(serie(tage, '2026-11-06')).toBe(0);
  });
  it('Wochenleiste hat sieben Tage und markiert heute', () => {
    const w = wochenleiste({ '2026-11-04': { einheiten: 1 } }, '2026-11-04');
    expect(w).toHaveLength(7);
    expect(w.at(-1)).toEqual({ tag: '2026-11-04', erledigt: true, heute: true });
  });
  it('Klassenstufen steigen mit XP', () => {
    expect(klassenStufe(0)).toBe(1);
    expect(klassenStufe(50)).toBe(2);
    expect(klassenStufe(5000)).toBe(10);
  });
  it('rechnet Datumsabstände über Monatsgrenzen', () => {
    expect(plusTage('2026-11-29', 3)).toBe('2026-12-02');
    expect(plusTage('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('Tolerante Freitext-Prüfung', () => {
  it('ignoriert Groß- und Kleinschreibung und Umlaute', () => {
    expect(passtFreitext('münchen', 'München')).toBe(true);
    expect(passtFreitext('MUENCHEN', 'München')).toBe(true);
  });
  it('erlaubt kleine Tippfehler', () => {
    expect(passtFreitext('Kilimandjaro', 'Kilimandscharo')).toBe(true);
    expect(passtFreitext('Bern', 'Bern')).toBe(true);
    expect(passtFreitext('Ber', 'Bern')).toBe(true);
    expect(passtFreitext('Paris', 'Bern')).toBe(false);
  });
  it('Artikel sind egal, Alias zählt', () => {
    expect(passtFreitext('die Seine', 'Seine')).toBe(true);
    expect(passtFreitext('Kiew', 'Kyjiw', ['Kiew'])).toBe(true);
  });
  it('Zahlen müssen exakt stimmen', () => {
    expect(passtFreitext('12', '11')).toBe(false);
    expect(passtFreitext('11', '11')).toBe(true);
  });
  it('normalisiert Satzzeichen', () => {
    expect(normalisiere('„Faust“!')).toBe('faust');
  });
  it('lässt Auswahlfragen nicht als Freitext zu', () => {
    expect(freitextTauglich({ frage: 'Welches dieser Länder ist am größten?', richtig: 'Russland' })).toBe(false);
    expect(freitextTauglich({ frage: 'Zu welchem Land gehört diese Flagge?', richtig: 'Peru' })).toBe(true);
  });
});

describe('Speicher', () => {
  const fakeStorage = () => {
    const m = new Map();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  };
  it('exportiert und importiert den Fortschritt', () => {
    const a = erstelleSpeicher(fakeStorage());
    a.aendern((z) => { z.xp = 120; z.fragen.x = { f: 2, d: '2026-11-07', r: 1, w: 0 }; });
    const json = a.exportieren();
    const b = erstelleSpeicher(fakeStorage());
    b.importieren(json);
    expect(b.get().xp).toBe(120);
    expect(b.get().fragen.x.f).toBe(2);
  });
  it('lehnt fremde Dateien ab', () => {
    const a = erstelleSpeicher(fakeStorage());
    expect(() => a.importieren('{"hallo":1}')).toThrow();
    expect(() => a.importieren('kein json')).toThrow();
  });
  it('funktioniert auch, wenn der Browser das Speichern verbietet', () => {
    const kaputt = { getItem: () => { throw new Error('nein'); }, setItem: () => { throw new Error('voll'); } };
    const a = erstelleSpeicher(kaputt);
    let gemeldet = false;
    a.onFehler = () => { gemeldet = true; };
    a.aendern((z) => { z.xp = 5; });
    expect(a.get().xp).toBe(5);
    expect(gemeldet).toBe(true);
  });
  it('ergänzt fehlende Felder', () => {
    const z = bereinige({ xp: 50 });
    expect(z.einstellungen.ziel.art).toBe('zeit');
    expect(z.fragen).toEqual({});
  });
});

describe('Nachrichten', () => {
  it('liest Deutschlandfunk-RSS und trennt Thema vom Titel', () => {
    const xml = `<rss><channel><item><title>Wahlen in den USA - Historische Siege</title><link>https://www.deutschlandfunk.de/a-100.html</link><description><![CDATA[<img src="x"/>Bei den Wahlen &#252;berraschten die Demokraten.]]></description><pubDate>Wed, 04 Nov 2026 18:17:25 +0100</pubDate></item></channel></rss>`;
    const [m] = ausDlf(xml);
    expect(m.kontext).toBe('Wahlen in den USA');
    expect(m.titel).toBe('Historische Siege');
    expect(m.text).toBe('Bei den Wahlen überraschten die Demokraten.');
  });
  it('entfernt Dubletten und alte Meldungen', () => {
    const jetzt = Date.parse('2026-11-04T12:00:00Z');
    const a = { titel: 'A', link: 'x', datum: '2026-11-04T10:00:00Z', quelle: 'q' };
    const alt = { titel: 'B', link: 'y', datum: '2026-10-01T10:00:00Z', quelle: 'q' };
    const res = zusammenfuehren([[a, { ...a }], [alt]], { jetzt });
    expect(res).toHaveLength(1);
  });
  it('baut ein News-Quiz mit vier verschiedenen Antworten', () => {
    const meldungen = Array.from({ length: 10 }, (_, i) => ({ id: `m${i}`, titel: `Überschrift ${i}`, text: `Das ist ein ausreichend langer Anrisstext für Meldung Nummer ${i}, damit er passt.`, quelle: 'tagesschau' }));
    const q = newsQuiz(meldungen, 5, () => 0.5);
    expect(q.length).toBe(5);
    for (const f of q) expect(new Set([f.richtig, ...f.falsch]).size).toBe(4);
  });
});

describe('Meldungen des Tages', () => {
  const jetzt = Date.parse('2026-11-04T12:00:00Z');
  const m = (id, thema, stunden, details = null) => ({ id, thema, titel: id, text: 'x'.repeat(90), datum: new Date(jetzt - stunden * 3600000).toISOString(), details });
  it('wählt genau drei Meldungen aus verschiedenen Themen', () => {
    const liste = [m('a', 'Inland', 1, 'u'), m('b', 'Inland', 2, 'u'), m('c', 'Ausland', 3, 'u'), m('d', 'Wirtschaft', 4), m('e', 'Wissen', 5, 'u')];
    const auswahl = tagesAuswahl(liste, { jetzt });
    expect(auswahl).toHaveLength(3);
    expect(new Set(auswahl.map((x) => x.thema)).size).toBe(3);
    expect(auswahl.every((x) => x.details)).toBe(true);
  });
  it('liest Absätze aus dem tagesschau-Artikel', () => {
    const a = absaetzeAusDetails({ content: [{ type: 'text', value: '<strong>Erster</strong> Absatz' }, { type: 'box', value: '' }, { type: 'headline', value: '<h2>Zwischen</h2>' }] });
    expect(a).toEqual([{ art: 'text', text: 'Erster Absatz' }, { art: 'zwischen', text: 'Zwischen' }]);
  });
});
