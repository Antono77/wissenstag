// Reiter „Aktuell“: Jeden Tag drei ausgewählte Meldungen, jede mit „Mehr lesen“.
// Weitere Meldungen erscheinen erst nach einem Klick auf „Mehr News“.
// Quellen: news.json (von der GitHub Action erzeugt) plus Live-Abruf der tagesschau-API im Browser.
import { h, ersetzen, datumLesbar } from '../lib/dom.js';
import { speicher } from '../app.js';
import { datenUrl } from '../lib/daten.js';
import { QUELLEN, ausTagesschau, zusammenfuehren, newsQuiz, tagesAuswahl, absaetzeAusDetails } from '../lib/nachrichten.js';
import { findeEinordnung } from '../lib/einordnung.js';
import { zeigeFrage } from '../lib/frage-ui.js';
import { heute } from '../lib/zeit.js';

const ALT_STUNDEN = 36;
const detailCache = new Map();

async function ladeDatei() {
  try {
    const res = await fetch(`${datenUrl('news.json')}?t=${Math.floor(Date.now() / 600000)}`, { cache: 'no-cache' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function ladeJson(url, ms = 7000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function ladeLive() {
  const json = await ladeJson(QUELLEN.tagesschau.url);
  return json ? ausTagesschau(json) : null;
}

function tagesUeberschrift(iso) {
  const d = new Date(iso);
  if (d.toDateString() === new Date().toDateString()) return 'Heute';
  if (d.toDateString() === new Date(Date.now() - 86400000).toDateString()) return 'Gestern';
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

const zeitText = (iso) => new Date(iso).toLocaleString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Eine Meldung als Karte mit „Mehr lesen“
function meldungKarte(m, { gross = false } = {}) {
  const einordnung = findeEinordnung(m);
  const mehrId = `mehr-${m.id}`;
  const mehrBereich = h('div', { id: mehrId, class: 'stapel mehr-bereich', hidden: true });
  let geladen = false;

  const knopf = h('button', {
    class: 'knopf leise mehr-knopf', type: 'button', 'aria-expanded': 'false', 'aria-controls': mehrId,
    onclick: async () => {
      const offen = knopf.getAttribute('aria-expanded') === 'true';
      knopf.setAttribute('aria-expanded', String(!offen));
      knopf.textContent = offen ? 'Mehr lesen' : 'Weniger anzeigen';
      mehrBereich.hidden = offen;
      if (!offen && !geladen) { geladen = true; await mehrLaden(); }
    },
  }, 'Mehr lesen');

  async function mehrLaden() {
    const teile = [];
    if (m.details) {
      ersetzen(mehrBereich, h('p', { class: 'gedaempft' }, 'Artikel wird geladen …'));
      if (!detailCache.has(m.details)) detailCache.set(m.details, ladeJson(m.details));
      const json = await detailCache.get(m.details);
      const absaetze = absaetzeAusDetails(json);
      // Der Anriss steht schon oben, deshalb doppelte erste Absätze überspringen
      for (const a of absaetze) {
        if (a.text === m.text) continue;
        teile.push(a.art === 'zwischen' ? h('h4', { class: 'zwischentitel' }, a.text) : h('p', {}, a.text));
      }
    }
    if (!teile.length) {
      teile.push(h('p', { class: 'gedaempft' }, `Den vollständigen Artikel gibt es direkt bei ${m.quelle}.`));
    }
    if (einordnung) teile.push(h('div', { class: 'einordnung' }, h('span', { class: 'label' }, 'Gut zu wissen'), einordnung));
    if (m.stichworte?.length) teile.push(h('div', { class: 'reihe' }, ...m.stichworte.map((s) => h('span', { class: 'chip' }, s))));
    teile.push(h('a', { class: 'knopf zweit', href: m.link, target: '_blank', rel: 'noopener noreferrer' }, `Ganzen Artikel bei ${m.quelle} lesen ↗`));
    ersetzen(mehrBereich, teile);
  }

  return h('article', { class: `karte meldung${gross ? ' meldung-gross' : ''}` },
    h('div', { class: 'reihe' }, h('span', { class: 'chip petrol' }, m.thema), m.kontext ? h('span', { class: 'label' }, m.kontext) : null),
    h('h3', {}, m.titel),
    m.text ? h('p', {}, m.text) : null,
    h('div', { class: 'meldung-fuss zwischen' },
      h('span', {}, h('time', { datetime: m.datum }, zeitText(m.datum)), ` · ${m.quelle}`),
      knopf),
    mehrBereich,
  );
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

  // Die drei Meldungen des Tages bleiben den ganzen Tag gleich und wechseln am nächsten Tag
  const tag = heute();
  let auswahl = speicher.get().newsTag?.tag === tag ? speicher.get().newsTag.meldungen : [];
  if (auswahl.length < 3 && meldungen.length) {
    auswahl = tagesAuswahl(meldungen);
    speicher.aendern((z) => { z.newsTag = { tag, meldungen: auswahl }; });
  }
  const auswahlIds = new Set(auswahl.map((m) => m.id));
  const weitere = meldungen.filter((m) => !auswahlIds.has(m.id));

  let quizAktiv = null;
  let thema = 'Alle';
  let sichtbar = 20;
  const mehrBereich = h('section', { class: 'stapel', id: 'mehr-news', hidden: true, 'aria-label': 'Weitere Meldungen' });
  const liste = h('div', { class: 'stapel' });
  const filterLeiste = h('div', { class: 'filter', role: 'group', 'aria-label': 'Nach Thema filtern' });
  const themen = ['Alle', ...new Set(weitere.map((m) => m.thema))];

  function zeichneFilter() {
    ersetzen(filterLeiste, themen.map((t) => h('button', {
      class: 'segment', type: 'button', 'aria-pressed': String(t === thema),
      onclick: () => { thema = t; sichtbar = 20; zeichneFilter(); zeichneListe(); },
    }, t)));
  }

  function zeichneListe() {
    const gefiltert = weitere.filter((m) => thema === 'Alle' || m.thema === thema);
    const teile = [];
    let letzterTag = null;
    for (const m of gefiltert.slice(0, sichtbar)) {
      const t = tagesUeberschrift(m.datum);
      if (t !== letzterTag) { teile.push(h('h3', { class: 'label', style: { marginTop: '8px' } }, t)); letzterTag = t; }
      teile.push(meldungKarte(m));
    }
    if (gefiltert.length > sichtbar) {
      teile.push(h('button', { class: 'knopf zweit', type: 'button', onclick: () => { sichtbar += 20; zeichneListe(); } }, `Noch mehr anzeigen (${gefiltert.length - sichtbar})`));
    }
    if (!gefiltert.length) teile.push(h('p', { class: 'gedaempft' }, 'Keine weiteren Meldungen zu diesem Thema.'));
    ersetzen(liste, teile);
  }

  // --- News-Quiz ---
  const quizBereich = h('section', { class: 'karte stapel', 'aria-labelledby': 'quiz-titel' });
  function quizStartansicht() {
    const fragen = newsQuiz(meldungen, 6);
    ersetzen(quizBereich,
      h('h2', { id: 'quiz-titel' }, 'Quiz zur Woche'),
      h('p', { class: 'gedaempft' }, `Welche Überschrift passt zur Meldung? Sechs Fragen aus den Nachrichten der letzten Tage. Dein bester Lauf: ${speicher.get().newsQuiz.beste} von 6.`),
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
          h('p', { class: 'gedaempft' }, richtig === fragen.length ? 'Du bist bestens informiert.' : 'Lies die Meldungen nach und versuch es noch einmal.'),
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

  const mehrKnopf = h('button', {
    class: 'knopf zweit gross', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'mehr-news',
    onclick: () => {
      const offen = mehrKnopf.getAttribute('aria-expanded') === 'true';
      mehrKnopf.setAttribute('aria-expanded', String(!offen));
      mehrBereich.hidden = offen;
      mehrKnopf.textContent = offen ? `Mehr News (${weitere.length})` : 'Weniger News';
      if (!offen && !liste.childElementCount) { zeichneFilter(); zeichneListe(); quizStartansicht(); }
    },
  }, `Mehr News (${weitere.length})`);

  ersetzen(mehrBereich, h('h2', {}, 'Weitere Meldungen'), filterLeiste, liste, quizBereich);

  const quellenText = live
    ? `tagesschau live, ZDFheute und Deutschlandfunk${datei?.stand ? ` (Stand ${datumLesbar(datei.stand, true)})` : ''}`
    : datei?.quellen?.filter((q) => q.ok).map((q) => q.name).join(', ') || 'keine';

  ersetzen(seite,
    h('section', { class: 'stapel' },
      h('span', { class: 'label' }, 'Nachrichten'),
      h('h1', {}, 'Aktuell'),
      h('p', { class: 'gedaempft' }, 'Drei Meldungen für heute. Morgen gibt es drei neue.'),
    ),
    veraltet ? h('div', { class: 'hinweis warn', role: 'status' },
      h('strong', {}, meldungen.length ? 'Keine aktuellen Meldungen. ' : 'Gerade keine Meldungen verfügbar. '),
      meldungen.length
        ? `Die neueste Meldung ist vom ${datumLesbar(meldungen[0].datum, true)}. Wahrscheinlich ist die automatische Aktualisierung ausgefallen.`
        : `Die Nachrichtenquellen sind nicht erreichbar${datei?.stand ? `, letzter erfolgreicher Abruf am ${datumLesbar(datei.stand, true)}` : ''}. Versuch es später noch einmal.`) : null,
    auswahl.length ? h('section', { class: 'stapel', 'aria-label': 'Die drei Meldungen des Tages' }, auswahl.map((m) => meldungKarte(m, { gross: true }))) : null,
    weitere.length ? mehrKnopf : null,
    mehrBereich,
    h('p', { class: 'gedaempft', style: { fontSize: '0.82rem' } },
      stand ? `Stand: ${datumLesbar(stand, true)}. Quellen: ${quellenText}. ` : '',
      'Überschriften, Anrisse und Artikel gehören den Redaktionen von tagesschau.de, ZDFheute und Deutschlandfunk. Die Einordnungen „Gut zu wissen“ schreibt Wissenstag selbst.'),
  );
  return () => quizAktiv?.zerstoeren();
}
