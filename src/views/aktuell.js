// Reiter „Aktuell“: Meldungen aus news.json (von der GitHub Action erzeugt)
// plus Live-Abruf der tagesschau-API direkt im Browser, falls erreichbar.
import { h, ersetzen, datumLesbar } from '../lib/dom.js';
import { speicher } from '../app.js';
import { datenUrl } from '../lib/daten.js';
import { QUELLEN, ausTagesschau, zusammenfuehren, newsQuiz } from '../lib/nachrichten.js';
import { findeEinordnung } from '../lib/einordnung.js';
import { zeigeFrage } from '../lib/frage-ui.js';

const ALT_STUNDEN = 36;

async function ladeDatei() {
  try {
    const res = await fetch(`${datenUrl('news.json')}?t=${Math.floor(Date.now() / 600000)}`, { cache: 'no-cache' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function ladeLive() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(QUELLEN.tagesschau.url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return ausTagesschau(await res.json());
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function tagesUeberschrift(iso) {
  const d = new Date(iso);
  const heute = new Date();
  const gestern = new Date(Date.now() - 86400000);
  if (d.toDateString() === heute.toDateString()) return 'Heute';
  if (d.toDateString() === gestern.toDateString()) return 'Gestern';
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

export async function render(main) {
  const seite = h('div', { class: 'seite' });
  main.append(seite);
  seite.append(
    h('section', { class: 'stapel' }, h('span', { class: 'label' }, 'Nachrichten'), h('h1', {}, 'Aktuell')),
    h('div', { class: 'lade', role: 'status' }, h('div', { class: 'lade-punkt' }), h('span', { class: 'visuell-versteckt' }, 'Meldungen werden geladen')),
  );

  const [datei, live] = await Promise.all([ladeDatei(), ladeLive()]);
  const meldungen = zusammenfuehren([live ?? [], datei?.meldungen ?? []], { tage: 7, max: 200, proQuelle: 70 });
  const stand = live ? new Date().toISOString() : datei?.stand ?? null;
  const neueste = meldungen[0] ? Date.parse(meldungen[0].datum) : 0;
  const veraltet = !meldungen.length || Date.now() - neueste > ALT_STUNDEN * 3600000;

  let thema = 'Alle';
  let sichtbar = 30;
  let quizAktiv = null;

  const liste = h('div', { class: 'stapel' });
  const filterLeiste = h('div', { class: 'filter', role: 'group', 'aria-label': 'Nach Thema filtern' });
  const themen = ['Alle', ...new Set(meldungen.map((m) => m.thema))];

  function zeichneFilter() {
    ersetzen(filterLeiste, ...themen.map((t) => h('button', {
      class: 'segment', type: 'button', 'aria-pressed': String(t === thema),
      onclick: () => { thema = t; sichtbar = 30; zeichneFilter(); zeichneListe(); },
    }, t)));
  }

  function zeichneListe() {
    const gefiltert = meldungen.filter((m) => thema === 'Alle' || m.thema === thema);
    const teile = [];
    let letzterTag = null;
    for (const m of gefiltert.slice(0, sichtbar)) {
      const tag = tagesUeberschrift(m.datum);
      if (tag !== letzterTag) { teile.push(h('h2', { style: { marginTop: '8px' } }, tag)); letzterTag = tag; }
      const einordnung = findeEinordnung(m);
      teile.push(h('article', { class: 'karte meldung' },
        h('div', { class: 'reihe' }, h('span', { class: 'chip petrol' }, m.thema), m.kontext ? h('span', { class: 'label' }, m.kontext) : null),
        h('h3', {}, m.titel),
        m.text ? h('p', {}, m.text) : null,
        einordnung ? h('div', { class: 'einordnung' }, h('span', { class: 'label' }, 'Gut zu wissen'), einordnung) : null,
        h('div', { class: 'meldung-fuss' },
          h('time', { datetime: m.datum }, new Date(m.datum).toLocaleString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })),
          h('span', { 'aria-hidden': 'true' }, '·'),
          h('a', { href: m.link, target: '_blank', rel: 'noopener noreferrer' }, `Bei ${m.quelle} lesen`)),
      ));
    }
    if (gefiltert.length > sichtbar) {
      teile.push(h('button', { class: 'knopf zweit', type: 'button', onclick: () => { sichtbar += 30; zeichneListe(); } }, `Mehr anzeigen (${gefiltert.length - sichtbar} weitere)`));
    }
    if (!gefiltert.length) teile.push(h('p', { class: 'gedaempft' }, 'Keine Meldungen zu diesem Thema.'));
    ersetzen(liste, ...teile);
  }

  // --- News-Quiz ---
  const quizBereich = h('section', { class: 'karte stapel', 'aria-labelledby': 'quiz-titel' });
  function quizStartansicht() {
    const fragen = newsQuiz(meldungen, 6);
    ersetzen(quizBereich, 
      h('h2', { id: 'quiz-titel' }, 'Quiz zur Woche'),
      h('p', { class: 'gedaempft' }, `Passt die Überschrift zur Meldung? Sechs Fragen aus den Nachrichten der letzten Tage. Dein bester Lauf: ${speicher.get().newsQuiz.beste} von 6.`),
      h('button', { class: 'knopf gelb', type: 'button', disabled: fragen.length < 3, onclick: () => quizSpielen(fragen) }, fragen.length < 3 ? 'Zu wenige Meldungen für ein Quiz' : 'Quiz starten'));
  }
  function quizSpielen(fragen) {
    let i = 0;
    let richtig = 0;
    const naechste = () => {
      quizAktiv?.zerstoeren();
      ersetzen(quizBereich);
      if (i >= fragen.length) {
        speicher.aendern((z) => { z.newsQuiz.beste = Math.max(z.newsQuiz.beste ?? 0, richtig); });
        quizBereich.append(h('h2', {}, `${richtig} von ${fragen.length} richtig`),
          h('p', { class: 'gedaempft' }, richtig === fragen.length ? 'Du bist bestens informiert.' : 'Lies die Meldungen oben nach und versuch es noch einmal.'),
          h('button', { class: 'knopf zweit', type: 'button', onclick: quizStartansicht }, 'Zurück'));
        return;
      }
      const q = fragen[i++];
      quizAktiv = zeigeFrage(quizBereich, q, {
        kopf: h('span', { class: 'label' }, `Frage ${i} von ${fragen.length}`),
        onAntwort: (ok) => { if (ok) richtig++; },
        onWeiter: naechste,
      });
    };
    naechste();
    quizBereich.scrollIntoView({ block: 'start' });
  }

  // --- Kopf mit Stand-Angabe ---
  const quellenText = live
    ? `tagesschau live, ZDFheute und Deutschlandfunk${datei?.stand ? ` (Stand ${datumLesbar(datei.stand, true)})` : ''}`
    : datei?.quellen?.filter((q) => q.ok).map((q) => q.name).join(', ') || 'keine';

  ersetzen(seite, 
    h('section', { class: 'stapel' },
      h('span', { class: 'label' }, 'Nachrichten'),
      h('h1', {}, 'Aktuell'),
      h('p', { class: 'gedaempft' }, stand ? `Stand: ${datumLesbar(stand, true)}. Quellen: ${quellenText}.` : 'Kein Stand verfügbar.'),
    ),
    veraltet ? h('div', { class: 'hinweis warn', role: 'status' },
      h('strong', {}, meldungen.length ? 'Keine aktuellen Meldungen. ' : 'Gerade keine Meldungen verfügbar. '),
      meldungen.length
        ? `Die neueste Meldung ist vom ${datumLesbar(meldungen[0].datum, true)}. Wahrscheinlich ist die automatische Aktualisierung ausgefallen.`
        : `Die Nachrichtenquellen sind nicht erreichbar${datei?.stand ? `, letzter erfolgreicher Abruf am ${datumLesbar(datei.stand, true)}` : ''}. Versuch es später noch einmal.`) : null,
    meldungen.length ? filterLeiste : null,
    liste,
    meldungen.length ? quizBereich : null,
    h('p', { class: 'gedaempft', style: { fontSize: '0.82rem' } }, 'Die Meldungen stammen aus den öffentlichen Angeboten von tagesschau.de, ZDFheute und Deutschlandfunk. Überschriften und Anrisse gehören den jeweiligen Redaktionen, die vollständigen Texte findest du über die Links. Die Einordnungen „Gut zu wissen“ schreibt Wissenstag selbst.'),
  );
  zeichneFilter();
  zeichneListe();
  if (meldungen.length) quizStartansicht();
  return () => quizAktiv?.zerstoeren();
}
