// Lernmodus einer Klasse: alle Wissenskarten in Ruhe durchblättern. Keine Fragen, keine Punkte.
// Route: #/karten/<klasse>. Tastatur: Pfeil links/rechts blättert.
import { h, ersetzen } from '../lib/dom.js';
import { speicher } from '../app.js';
import { ladeKlassen, ladeKlasse, flaggeUrl } from '../lib/daten.js';
import { standLesbar } from '../lib/frage-ui.js';

const RANG = { leicht: 0, mittel: 1, schwer: 2 };

export async function render(main, { gruppen }) {
  const seite = h('div', { class: 'seite' });
  main.append(seite);
  seite.append(h('div', { class: 'lade', role: 'status' }, h('div', { class: 'lade-punkt' })));
  const klassen = await ladeKlassen();
  const k = klassen.find((x) => x.id === gruppen[0]);
  if (!k) { location.hash = '#/lernen'; return; }
  if (k.typ === 'atlas') { location.hash = `#/atlas/${k.id}/lernen`; return; }

  // Karten sammeln: Gleiche Karten (z. B. Hin- und Rückfrage zu einem Land) nur einmal zeigen
  const fragen = await ladeKlasse(k);
  const gesehen = new Set();
  const alleKarten = [];
  for (const q of [...fragen].sort((a, b) => RANG[a.schwierigkeit] - RANG[b.schwierigkeit])) {
    if (!q.karte) continue;
    const schluessel = `${q.karte.titel}|${q.karte.text}`;
    if (gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);
    alleKarten.push(q);
  }

  let filter = 'alle';
  const liste = () => (filter === 'alle' ? alleKarten : alleKarten.filter((q) => q.schwierigkeit === filter));
  let index = Math.min(speicher.get().kartenPos[k.id] ?? 0, Math.max(0, alleKarten.length - 1));

  const zaehler = h('span', { class: 'label', 'aria-live': 'polite' });
  const kartenBereich = h('div');
  const zurueck = h('button', { class: 'knopf zweit', type: 'button', style: { flex: '1' }, onclick: () => blaettern(-1) }, '← Zurück');
  const vor = h('button', { class: 'knopf gelb', type: 'button', style: { flex: '1' }, onclick: () => blaettern(1) }, 'Nächste Karte →');
  const filterGruppe = h('div', { class: 'reihe atlas-chips', role: 'group', 'aria-label': 'Schwierigkeit' });

  ersetzen(seite,
    h('a', { class: 'knopf leise', href: `#/lernen/${k.id}`, style: { justifySelf: 'start' } }, `← ${k.name}`),
    h('section', { class: 'stapel', style: { gap: '6px' } },
      h('div', { class: 'reihe' }, h('span', { class: 'chip petrol' }, 'Lernmodus'), zaehler),
      h('h1', {}, k.name),
      h('p', { class: 'gedaempft' }, 'Lies jede Karte und präge dir den Merksatz ein. Abgefragt wird erst im Prüfungsmodus.')),
    filterGruppe,
    kartenBereich,
    h('div', { class: 'reihe' }, zurueck, vor),
    h('p', { class: 'tastenhinweis' }, 'Pfeiltasten links und rechts blättern'),
    h('a', { class: 'knopf zweit', href: `#/lernen/${k.id}` }, 'Fertig: zur Prüfung'),
  );

  function filterZeichnen() {
    const namen = { alle: 'Alle', leicht: 'Leicht', mittel: 'Mittel', schwer: 'Schwer' };
    ersetzen(filterGruppe, ...Object.entries(namen).map(([id, name]) => h('button', {
      class: `chip-knopf${filter === id ? ' aktiv' : ''}`, type: 'button', 'aria-pressed': String(filter === id),
      onclick: () => { filter = id; index = 0; filterZeichnen(); zeigen(); },
    }, name)));
  }

  function zeigen() {
    const l = liste();
    if (!l.length) { ersetzen(kartenBereich, h('p', {}, 'Keine Karten in dieser Auswahl.')); zaehler.textContent = ''; return; }
    index = (index + l.length) % l.length;
    const q = l[index];
    zaehler.textContent = `Karte ${index + 1} von ${l.length}`;
    ersetzen(kartenBereich, h('article', { class: 'karte wissenskarte ansicht-rein', 'aria-labelledby': 'lernkarte-titel' },
      h('div', { class: 'zwischen' }, h('span', { class: 'label' }, k.name), h('span', { class: 'chip' }, q.schwierigkeit)),
      q.karte.bild?.typ === 'flagge' ? h('img', { class: 'flagge-gross', style: { width: '140px' }, src: flaggeUrl(q.karte.bild.code), alt: `Flagge: ${q.karte.titel}` }) : null,
      h('h2', { id: 'lernkarte-titel' }, q.karte.titel),
      h('p', {}, q.karte.text),
      h('div', { class: 'merke' }, h('span', { class: 'label' }, 'Merke'), q.karte.merke),
      q.stand ? h('p', { class: 'label' }, `Stand: ${standLesbar(q.stand)}`) : null));
    if (filter === 'alle') speicher.aendern((z) => { z.kartenPos[k.id] = index; });
  }

  function blaettern(r) { index += r; zeigen(); }

  const tasten = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); blaettern(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); blaettern(-1); }
  };
  document.addEventListener('keydown', tasten);

  filterZeichnen();
  zeigen();
  return () => document.removeEventListener('keydown', tasten);
}
