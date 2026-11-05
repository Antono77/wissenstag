// Ansicht für die drei Atlas-Klassen. Route: #/atlas/<klasse>/<lernen|pruefen>
//   Lernmodus:   Globus ansehen, Länder/Städte auswählen, Namen einprägen. Keine Punkte.
//   Prüfungsmodus: 10 Fragen mit XP und Wiederholung in Abständen.
import { h, ersetzen, toast } from '../lib/dom.js';
import { speicher, verbucheAntwort, verbucheEinheit } from '../app.js';
import { ladeKlassen, flaggeUrl } from '../lib/daten.js';
import { stelleZusammen } from '../lib/lernlogik.js';
import { heute } from '../lib/zeit.js';
import { XP_RICHTIG } from '../lib/punkte.js';
import { mischen } from '../lib/zufall.js';
import { erstelleGlobus } from '../lib/globus.js';
import {
  KONTINENTE, KONTINENT_BLICK, LEVEL, levelVon, ladeOrte, ladeWelt, atlasFragen, imLevel,
  abstandKm, falscheAntworten, tippText,
} from '../lib/atlas-daten.js';

const RUNDE = 10;
const sortiert = (liste) => [...liste].sort((a, b) => a.name.localeCompare(b.name, 'de'));
const kmText = (km) => `${Math.round(km).toLocaleString('de-DE')} km`;

export async function render(main, { gruppen }) {
  const [klasseId, modus] = gruppen;
  const seite = h('div', { class: 'seite breit' });
  main.append(seite);
  seite.append(h('div', { class: 'lade', role: 'status' }, h('div', { class: 'lade-punkt' }), h('span', { class: 'visuell-versteckt' }, 'Globus lädt …')));

  const klassen = await ladeKlassen();
  const k = klassen.find((x) => x.id === klasseId && x.typ === 'atlas');
  if (!k) { location.hash = '#/lernen'; return; }

  let orte, welt;
  try {
    [orte, welt] = await Promise.all([ladeOrte(), ladeWelt()]);
  } catch {
    ersetzen(seite, h('section', { class: 'karte stapel' },
      h('h1', {}, 'Karte nicht geladen'),
      h('p', {}, 'Die Kartendaten konnten nicht geladen werden. Prüfe deine Internetverbindung und versuche es noch einmal.'),
      h('a', { class: 'knopf', href: `#/lernen/${k.id}` }, 'Zurück zur Klasse')));
    return;
  }

  const level = levelVon(speicher.get());
  const kopf = h('section', { class: 'stapel', style: { gap: '6px' } },
    h('a', { class: 'knopf leise', href: `#/lernen/${k.id}`, style: { justifySelf: 'start' } }, `← ${k.name}`),
    h('div', { class: 'reihe' },
      h('span', { class: `chip ${modus === 'pruefen' ? 'gelb' : 'petrol'}` }, modus === 'pruefen' ? 'Prüfungsmodus' : 'Lernmodus'),
      h('span', { class: 'chip' }, `Level: ${LEVEL[level].name}`)),
    h('h1', {}, k.name),
  );
  const globusBereich = h('div', { class: 'atlas-globus' });
  const panel = h('div', { class: 'atlas-panel stapel' });
  ersetzen(seite, kopf, h('div', { class: 'atlas-layout' }, globusBereich, panel));

  const ctx = { k, orte, welt, level, seite, globusBereich, panel };
  return modus === 'pruefen' ? pruefen(ctx) : k.id === 'atlas-globus' ? entdecken(ctx) : lernen(ctx);
}

// ---------------------------------------------------------------------------
// Lernmodus für Klasse 1 (Länder) und Klasse 2 (Städte)
// ---------------------------------------------------------------------------
function lernen({ k, orte, welt, level, globusBereich, panel }) {
  const istStadt = k.id === 'atlas-staedte';
  const max = LEVEL[level].max;
  const alle = istStadt ? orte.staedte : orte.laender;
  let kontinent = 'Alle';
  let namenAn = true;
  let aktuell = null;

  const globus = erstelleGlobus(globusBereich, {
    welt,
    beschreibung: istStadt ? 'Globus mit Städten. Ziehen zum Drehen, antippen zum Auswählen.' : 'Globus mit Ländern. Ziehen zum Drehen, antippen zum Auswählen.',
    onKlick: ({ pos, code }) => {
      if (istStadt) {
        // Nächste Stadt in der Nähe des Tipps (Abstand passt sich dem Zoom an)
        const grenze = 900 / globus.zoom();
        let best = null, bestD = Infinity;
        for (const s of liste()) {
          const d = abstandKm(s.pos, pos);
          if (d < bestD) { bestD = d; best = s; }
        }
        if (best && bestD <= grenze) waehle(best, false);
      } else if (code && orte.nachCode[code]) {
        waehle(orte.nachCode[code], false);
      }
    },
  });

  const liste = () => sortiert(alle.filter((x) => x.stufe <= max && (kontinent === 'Alle' || (istStadt ? x.kontinent : x.kontinent) === kontinent)));

  const chips = h('div', { class: 'reihe atlas-chips', role: 'group', 'aria-label': 'Kontinent wählen' });
  const info = h('div', { class: 'karte atlas-info', 'aria-live': 'polite' });
  const listeEl = h('ul', { class: 'atlas-liste', 'aria-label': istStadt ? 'Städte' : 'Länder' });
  const zurueck = h('button', { class: 'knopf zweit', type: 'button', onclick: () => blaettern(-1) }, '← Vorheriges');
  const vor = h('button', { class: 'knopf zweit', type: 'button', onclick: () => blaettern(1) }, 'Nächstes →');
  const namenSchalter = h('label', { class: 'schalter' },
    h('input', { type: 'checkbox', checked: true, onchange: (e) => { namenAn = e.target.checked; zeigeAufGlobus(); } }),
    h('span', {}, 'Namen auf dem Globus zeigen'));
  ersetzen(panel,
    h('p', { class: 'gedaempft' }, istStadt
      ? 'Wähle eine Stadt aus der Liste oder tippe einen Punkt auf dem Globus an. Präge dir ein, wo sie liegt.'
      : 'Wähle ein Land aus der Liste oder tippe es auf dem Globus an. Präge dir Lage und Nachbarn ein.'),
    chips, info, h('div', { class: 'reihe' }, zurueck, vor), namenSchalter, listeEl);

  function chipsZeichnen() {
    ersetzen(chips, ...['Alle', ...KONTINENTE].map((name) => h('button', {
      class: `chip-knopf${kontinent === name ? ' aktiv' : ''}`, type: 'button', 'aria-pressed': String(kontinent === name),
      onclick: () => {
        kontinent = name;
        chipsZeichnen();
        listeZeichnen();
        const l = liste();
        if (name !== 'Alle') globus.fliegeZu(KONTINENT_BLICK[name].pos, KONTINENT_BLICK[name].zoom);
        if (aktuell && !l.includes(aktuell)) { aktuell = null; infoZeichnen(); }
        zeigeAufGlobus();
      },
    }, name)));
  }

  function listeZeichnen() {
    const l = liste();
    ersetzen(listeEl, ...l.map((x) => h('li', {}, h('button', {
      class: `atlas-eintrag${x === aktuell ? ' aktiv' : ''}`, type: 'button', 'aria-current': x === aktuell ? 'true' : false,
      onclick: () => waehle(x, true),
    }, istStadt ? null : h('img', { src: flaggeUrl(x.code), alt: '', width: 24, height: 18, loading: 'lazy' }),
      h('span', {}, x.name),
      istStadt ? h('span', { class: 'gedaempft' }, x.land.name) : null))));
    zurueck.disabled = vor.disabled = !l.length;
  }

  function infoZeichnen() {
    if (!aktuell) {
      ersetzen(info, h('p', { class: 'gedaempft' }, istStadt ? 'Noch keine Stadt gewählt.' : 'Noch kein Land gewählt.'));
      return;
    }
    if (istStadt) {
      const s = aktuell;
      ersetzen(info,
        h('div', { class: 'reihe' }, h('img', { class: 'atlas-flagge', src: flaggeUrl(s.code), alt: `Flagge von ${s.land.name}` }),
          s.hauptstadt ? h('span', { class: 'chip gelb' }, 'Hauptstadt') : h('span', { class: 'chip' }, 'Großstadt')),
        h('h2', {}, s.name),
        h('p', {}, `Land: ${s.land.name} · Kontinent: ${s.kontinent}`),
        h('div', { class: 'merke' }, h('span', { class: 'label' }, 'Merke'), s.merke));
    } else {
      const l = aktuell;
      const stadt = l.hs ? `Hauptstadt: ${l.hs}` : 'Keine eindeutige Hauptstadt';
      ersetzen(info,
        h('img', { class: 'atlas-flagge', src: flaggeUrl(l.code), alt: `Flagge von ${l.name}` }),
        h('h2', {}, l.name),
        h('p', {}, `Kontinent: ${l.kontinent} · ${stadt}`),
        h('div', { class: 'merke' }, h('span', { class: 'label' }, 'Merke'), `${l.name} liegt in ${l.kontinent}.${l.klein ? ' Es ist so klein, dass es auf dem Globus mit einem Ring markiert ist.' : ''}`));
    }
  }

  function zeigeAufGlobus() {
    const l = liste();
    if (istStadt) {
      const punkte = l.filter((s) => s !== aktuell).map((s) => ({ pos: s.pos, farbe: 'petrol', r: 3.5 }));
      if (aktuell) punkte.push({ pos: aktuell.pos, farbe: 'markiert', r: 7 });
      const beschriftungen = [];
      if (aktuell) beschriftungen.push({ pos: aktuell.pos, text: aktuell.name, versatz: -15 });
      if (namenAn) for (const s of l) if (s !== aktuell) beschriftungen.push({ pos: s.pos, text: s.name, versatz: -12 });
      globus.setze({ punkte, beschriftungen, kontinentCodes: aktuell ? [aktuell.code] : null });
    } else {
      const punkte = aktuell?.klein ? [{ art: 'ring', pos: aktuell.pos, farbe: 'markiert', r: 12 }] : [];
      const beschriftungen = [];
      if (aktuell) beschriftungen.push({ pos: aktuell.pos, text: aktuell.name, versatz: aktuell.klein ? -20 : 0 });
      if (namenAn) for (const x of l) if (x !== aktuell) beschriftungen.push({ pos: x.pos, text: x.name });
      globus.setze({
        laender: aktuell ? { [aktuell.code]: 'markiert' } : {},
        punkte, beschriftungen,
        kontinentCodes: kontinent === 'Alle' ? null : l.map((x) => x.code),
      });
    }
  }

  function waehle(x, fliegen) {
    aktuell = x;
    infoZeichnen();
    listeZeichnen();
    zeigeAufGlobus();
    if (fliegen) {
      const z = istStadt ? 4 : globus.zoomFuerLand(x.code, 6);
      globus.fliegeZu(x.pos, z);
    }
    globus.beschreibe(`Globus. Ausgewählt: ${x.name}.`);
  }

  function blaettern(richtung) {
    const l = liste();
    if (!l.length) return;
    const i = aktuell ? l.indexOf(aktuell) : -1;
    const neu = l[(i + richtung + l.length) % l.length];
    waehle(neu, true);
    listeEl.querySelector('.aktiv')?.scrollIntoView({ block: 'nearest' });
  }

  const tasten = (e) => {
    if (e.target instanceof HTMLInputElement || e.target === globus.canvas || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); blaettern(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); blaettern(-1); }
  };
  document.addEventListener('keydown', tasten);

  chipsZeichnen();
  listeZeichnen();
  infoZeichnen();
  zeigeAufGlobus();
  globus.fliegeZu(KONTINENT_BLICK.Europa.pos, 1, 0);

  return () => { document.removeEventListener('keydown', tasten); globus.zerstoeren(); };
}

// ---------------------------------------------------------------------------
// Lernmodus für Klasse 3 (Globus-Zuordnung): frei entdecken
// ---------------------------------------------------------------------------
function entdecken({ orte, welt, level, globusBereich, panel }) {
  const max = LEVEL[level].max;
  let laenderNamen = true;
  let hauptstaedte = true;
  let aktuell = null;

  const globus = erstelleGlobus(globusBereich, {
    welt,
    beschreibung: 'Globus zum Entdecken. Ziehen zum Drehen, ein Land antippen zeigt seinen Namen.',
    onKlick: ({ code }) => { if (code && orte.nachCode[code]) waehle(orte.nachCode[code], false); },
  });

  const info = h('div', { class: 'karte atlas-info', 'aria-live': 'polite' });
  const schalter = (text, an, fn) => h('label', { class: 'schalter' }, h('input', { type: 'checkbox', checked: an, onchange: (e) => fn(e.target.checked) }), h('span', {}, text));
  const zufall = () => {
    const pool = orte.laender.filter((l) => l.stufe <= max);
    waehle(pool[Math.floor(Math.random() * pool.length)], true);
  };
  ersetzen(panel,
    h('p', { class: 'gedaempft' }, 'Dreh den Globus und tippe Länder an. So prägst du dir ein, wo was liegt, bevor du im Prüfungsmodus selbst tippen musst.'),
    h('div', { class: 'reihe atlas-chips', role: 'group', 'aria-label': 'Zu einem Kontinent springen' },
      ...KONTINENTE.map((name) => h('button', { class: 'chip-knopf', type: 'button', onclick: () => globus.fliegeZu(KONTINENT_BLICK[name].pos, KONTINENT_BLICK[name].zoom) }, name))),
    info,
    h('button', { class: 'knopf gelb', type: 'button', onclick: zufall }, 'Zufälliges Land zeigen'),
    schalter('Ländernamen zeigen', true, (an) => { laenderNamen = an; zeigeAufGlobus(); }),
    schalter('Hauptstädte zeigen', true, (an) => { hauptstaedte = an; zeigeAufGlobus(); }),
    h('p', { class: 'label' }, 'Tastatur: Globus anwählen, Pfeiltasten drehen, + und − zoomen, Enter wählt das Land unter dem Fadenkreuz.'),
  );

  function infoZeichnen() {
    if (!aktuell) { ersetzen(info, h('p', { class: 'gedaempft' }, 'Tippe ein Land auf dem Globus an.')); return; }
    const l = aktuell;
    const weitere = orte.staedte.filter((s) => s.code === l.code && !s.hauptstadt).map((s) => s.name);
    ersetzen(info,
      h('img', { class: 'atlas-flagge', src: flaggeUrl(l.code), alt: `Flagge von ${l.name}` }),
      h('h2', {}, l.name),
      h('p', {}, `Kontinent: ${l.kontinent}${l.hs ? ` · Hauptstadt: ${l.hs}` : ''}`),
      weitere.length ? h('p', { class: 'gedaempft' }, `Weitere wichtige Städte: ${weitere.join(', ')}`) : null);
  }

  function zeigeAufGlobus() {
    const laender = orte.laender.filter((l) => l.stufe <= max);
    const beschriftungen = [];
    const punkte = [];
    if (aktuell) {
      beschriftungen.push({ pos: aktuell.pos, text: aktuell.name, versatz: aktuell.klein ? -20 : 0 });
      if (aktuell.klein) punkte.push({ art: 'ring', pos: aktuell.pos, farbe: 'markiert', r: 12 });
    }
    if (hauptstaedte) {
      for (const s of orte.staedte) {
        if (!s.hauptstadt || s.stufe > max) continue;
        punkte.push({ pos: s.pos, farbe: 'petrol', r: 3 });
        if (!laenderNamen || s.code === aktuell?.code) beschriftungen.push({ pos: s.pos, text: s.name, versatz: -11 });
      }
    }
    if (laenderNamen) for (const l of laender) if (l !== aktuell) beschriftungen.push({ pos: l.pos, text: l.name });
    globus.setze({ laender: aktuell ? { [aktuell.code]: 'markiert' } : {}, punkte, beschriftungen });
  }

  function waehle(l, fliegen) {
    aktuell = l;
    infoZeichnen();
    zeigeAufGlobus();
    if (fliegen) globus.fliegeZu(l.pos, globus.zoomFuerLand(l.code, 6));
    globus.beschreibe(`Globus. Ausgewählt: ${l.name}.`);
  }

  infoZeichnen();
  zeigeAufGlobus();
  globus.fliegeZu(KONTINENT_BLICK.Europa.pos, 1.2, 0);
  return () => globus.zerstoeren();
}

// ---------------------------------------------------------------------------
// Prüfungsmodus für alle drei Klassen
// ---------------------------------------------------------------------------
function pruefen({ k, orte, welt, level, seite, globusBereich, panel }) {
  const lv = LEVEL[level];
  const alleFragen = atlasFragen(k.id, orte);
  const pool = alleFragen.filter((q) => imLevel(q, level));
  const tag = heute();
  const runde = stelleZusammen(pool, speicher.get().fragen, { tag, anzahl: RUNDE });
  const istAntippen = k.id === 'atlas-globus';

  // Kandidaten für falsche Antworten (gleiches Level, gleiche Art)
  const kandidaten = pool.map((q) => q.ziel);

  const protokoll = [];
  let index = -1;
  let sekunden = 0;
  let letzterTick = performance.now();
  let beendet = false;
  let frageAktiv = null; // { q, beantwortet, optionen }

  const uhr = setInterval(() => {
    const jetzt = performance.now();
    if (!document.hidden && !beendet) sekunden += (jetzt - letzterTick) / 1000;
    letzterTick = jetzt;
  }, 500);

  let globus = null;
  globus = erstelleGlobus(globusBereich, {
    welt,
    beschreibung: istAntippen ? 'Globus. Tippe auf den gesuchten Ort. Mit der Tastatur: Pfeiltasten drehen, Enter tippt auf die Mitte.' : 'Globus mit einer Markierung.',
    onKlick: istAntippen ? (treffer) => antippen(treffer) : null,
  });

  const zaehler = h('span', { class: 'label' });
  const linie = h('div', { class: 'fortschritt-linie', 'aria-hidden': 'true' }, h('span', { style: { width: '0%' } }));
  const inhalt = h('div', { class: 'stapel' });
  const beendenKnopf = h('button', { class: 'knopf leise', type: 'button', onclick: () => beenden() }, 'Runde beenden');
  ersetzen(panel, h('div', { class: 'zwischen' }, zaehler, beendenKnopf), linie, inhalt);

  if (!runde.length) {
    ersetzen(panel, h('p', {}, 'Für dieses Level gibt es keine Fragen.'));
    return () => { clearInterval(uhr); globus.zerstoeren(); };
  }

  function kopf() {
    zaehler.textContent = `Frage ${Math.min(index + 1, runde.length)} von ${runde.length} · ${protokoll.filter((p) => p.richtig).length} richtig`;
    linie.firstChild.style.width = `${Math.round((protokoll.length / runde.length) * 100)}%`;
  }

  function hilfeBox(ziel) {
    if (!lv.hilfe) return null;
    return h('div', { class: 'hinweis atlas-tipp' }, h('span', { class: 'label' }, 'Tipp für Anfänger'), h('p', {}, tippText(ziel, k.id)));
  }

  function naechste() {
    index++;
    if (index >= runde.length) return beenden();
    const q = runde[index].frage;
    const ziel = q.ziel;
    kopf();

    if (istAntippen) {
      frageAktiv = { q, beantwortet: false };
      // Anfänger: Globus dreht zum Kontinent, der Kontinent ist eingefärbt
      if (lv.hilfe) {
        const codes = orte.laender.filter((l) => l.kontinent === ziel.kontinent).map((l) => l.code);
        globus.setze({ kontinentCodes: codes });
        globus.fliegeZu(KONTINENT_BLICK[ziel.kontinent].pos, KONTINENT_BLICK[ziel.kontinent].zoom);
      } else {
        globus.setze({});
        globus.fliegeZu([Math.round(Math.random() * 360 - 180), 20], 1);
      }
      const art = ziel.art === 'land' ? 'das Land' : 'die Stadt';
      ersetzen(inhalt,
        h('span', { class: 'label' }, ziel.art === 'land' ? 'Land finden' : 'Stadt finden'),
        h('h2', { class: 'frage-text', tabindex: '-1' }, `Tippe auf ${art} ${ziel.name}.`),
        hilfeBox(ziel),
        h('p', { class: 'gedaempft' }, ziel.art === 'stadt' || ziel.land.klein
          ? `Du darfst bis zu ${kmText(lv.toleranzKm)} daneben liegen.`
          : 'Tippe irgendwo in das Land.'),
        h('div', { class: 'reihe' }, h('button', { class: 'knopf zweit', type: 'button', onclick: () => antippen(null) }, 'Weiß ich nicht')),
        h('div', { class: 'atlas-feedback', 'aria-live': 'polite' }));
      inhalt.querySelector('h2').focus({ preventScroll: true });
      globus.beschreibe(`Globus. Gesucht: ${ziel.name}. Pfeiltasten drehen, Enter tippt auf die Mitte.`);
      return;
    }

    // Klasse 1 und 2: markierter Ort, vier Antworten
    const optionen = mischen([ziel.name, ...falscheAntworten(ziel, kandidaten, level)]);
    frageAktiv = { q, beantwortet: false, optionen };
    zeigeZiel(ziel, 'markiert');
    const z = ziel.art === 'land' ? globus.zoomFuerLand(ziel.key, 5) * 0.55 : 3;
    globus.fliegeZu(ziel.pos, Math.max(1.1, z));
    const knoepfe = optionen.map((opt, i) => h('button', {
      class: 'antwort', type: 'button', onclick: () => waehle(i),
    }, h('span', { class: 'taste', 'aria-hidden': 'true' }, 'ABCD'[i]), h('span', {}, opt), h('span', { class: 'zeichen', 'aria-hidden': 'true' })));
    frageAktiv.knoepfe = knoepfe;
    ersetzen(inhalt,
      h('span', { class: 'label' }, ziel.art === 'land' ? 'Land erkennen' : 'Stadt erkennen'),
      h('h2', { class: 'frage-text', tabindex: '-1' }, ziel.art === 'land' ? 'Welches Land ist gelb markiert?' : 'Welche Stadt ist gelb markiert?'),
      hilfeBox(ziel),
      h('div', { class: 'antworten', role: 'group', 'aria-label': 'Antworten' }, ...knoepfe),
      h('p', { class: 'tastenhinweis' }, 'Tasten 1 bis 4 oder A bis D wählen eine Antwort'),
      h('div', { class: 'atlas-feedback', 'aria-live': 'polite' }));
    inhalt.querySelector('h2').focus({ preventScroll: true });
    globus.beschreibe(ziel.art === 'land' ? 'Globus mit einem gelb markierten Land.' : 'Globus mit einer gelb markierten Stadt.');
  }

  // Ziel auf dem Globus zeigen (Land einfärben oder Stadtpunkt), optional mit Tipp-Einfärbung
  function zeigeZiel(ziel, farbe, extra = {}) {
    const punkte = [...(extra.punkte ?? [])];
    const laender = { ...(extra.laender ?? {}) };
    const kontinentCodes = null;
    if (ziel.art === 'land') {
      laender[ziel.key] = farbe;
      if (ziel.land.klein) punkte.push({ art: 'ring', pos: ziel.pos, farbe, r: 12 });
    } else {
      punkte.push({ pos: ziel.pos, farbe, r: 7 }, { art: 'ring', pos: ziel.pos, farbe, r: 13 });
    }
    globus.setze({ laender, punkte, kontinentCodes, linien: extra.linien ?? [], beschriftungen: extra.beschriftungen ?? [] });
  }

  function waehle(i) {
    const f = frageAktiv;
    if (!f || f.beantwortet) return;
    f.beantwortet = true;
    const ziel = f.q.ziel;
    const gewaehlt = f.optionen[i];
    const richtig = gewaehlt === ziel.name;
    f.knoepfe.forEach((knopf, j) => {
      knopf.disabled = true;
      if (f.optionen[j] === ziel.name) { knopf.classList.add('richtig'); knopf.querySelector('.zeichen').textContent = '✓'; }
      else if (j === i) { knopf.classList.add('falsch'); knopf.querySelector('.zeichen').textContent = '✗'; }
      else knopf.classList.add('gedimmt');
    });
    inhalt.querySelector('.tastenhinweis')?.remove();
    // Bei falscher Antwort zeigen, wo das gewählte Land / die gewählte Stadt wirklich liegt
    const falsch = richtig ? null : kandidaten.find((x) => x.name === gewaehlt);
    const extra = { beschriftungen: [{ pos: ziel.pos, text: ziel.name, versatz: ziel.art === 'stadt' ? -18 : 0 }] };
    if (falsch) {
      extra.beschriftungen.push({ pos: falsch.pos, text: falsch.name, versatz: falsch.art === 'stadt' ? -16 : 0 });
      if (falsch.art === 'land') extra.laender = { [falsch.key]: 'falsch' };
      else extra.punkte = [{ pos: falsch.pos, farbe: 'falsch', r: 6 }];
    }
    zeigeZiel(ziel, 'richtig', extra);
    if (falsch) zeigeBeide(ziel.pos, falsch.pos);
    let text = richtig ? `Genau, das ist ${ziel.name}.` : `Das war ${ziel.name}.`;
    if (falsch) text += ` ${falsch.name} liegt ${kmText(abstandKm(ziel.pos, falsch.pos))} entfernt (rot markiert).`;
    abschluss(f.q, richtig, text);
  }

  function antippen(treffer) {
    const f = frageAktiv;
    if (!f || f.beantwortet) return;
    f.beantwortet = true;
    const ziel = f.q.ziel;
    let richtig = false;
    let text;
    const extra = { beschriftungen: [{ pos: ziel.pos, text: ziel.name, versatz: ziel.art === 'stadt' ? -18 : 0 }], punkte: [], linien: [] };
    if (!treffer) {
      text = `Kein Problem. ${ziel.name} ist jetzt grün markiert.`;
    } else {
      const d = abstandKm(treffer.pos, ziel.pos);
      if (ziel.art === 'land') {
        const kleinNah = (ziel.land.klein || !ziel.land.form) && d <= lv.toleranzKm;
        richtig = treffer.code === ziel.key || kleinNah;
        const getippt = treffer.code ? orte.nachCode[treffer.code]?.name : null;
        if (richtig) text = treffer.code === ziel.key ? `Richtig, das ist ${ziel.name}.` : `Richtig, ${ziel.name} ist so klein, dass ${kmText(d)} Abstand zählen.`;
        else text = `${getippt ? `Das war ${getippt}. ` : 'Da ist kein Land. '}${ziel.name} liegt ${kmText(d)} von deinem Tipp entfernt (gemessen zur Landesmitte).`;
        if (!richtig && treffer.code) extra.laender = { [treffer.code]: 'falsch' };
      } else {
        richtig = d <= lv.toleranzKm;
        text = richtig ? `Richtig! Nur ${kmText(d)} daneben.` : `Leider ${kmText(d)} daneben. Erlaubt sind ${kmText(lv.toleranzKm)}.`;
      }
      extra.punkte.push({ art: 'kreuz', pos: treffer.pos, farbe: richtig ? 'richtig' : 'falsch' });
      if (!richtig) extra.linien.push({ von: treffer.pos, nach: ziel.pos });
    }
    zeigeZiel(ziel, 'richtig', extra);
    if (treffer) zeigeBeide(ziel.pos, treffer.pos);
    else globus.fliegeZu(ziel.pos, ziel.art === 'land' ? globus.zoomFuerLand(ziel.key, 5) * 0.7 : 3);
    inhalt.querySelector('.reihe')?.remove();
    abschluss(f.q, richtig, text);
  }

  function zeigeBeide(a, b) {
    const d = abstandKm(a, b) / 111; // Grad
    const mitte = [(a[0] + b[0]) / 2 + (Math.abs(a[0] - b[0]) > 180 ? 180 : 0), (a[1] + b[1]) / 2];
    globus.fliegeZu(mitte, Math.max(1, Math.min(5, 70 / (d + 12))));
  }

  function abschluss(q, richtig, text) {
    const xp = verbucheAntwort(q, richtig);
    protokoll.push({ q, richtig });
    kopf();
    const ziel = q.ziel;
    const merke = ziel.art === 'land'
      ? `${ziel.name} liegt in ${ziel.kontinent}${ziel.land.hs ? `, Hauptstadt ${ziel.land.hs}` : ''}.`
      : `${ziel.name} liegt in ${ziel.land.name} (${ziel.kontinent}). ${ziel.stadt.merke}`;
    const weiter = h('button', { class: 'knopf gross', type: 'button', onclick: () => naechste() }, index + 1 >= runde.length ? 'Ergebnis zeigen' : 'Weiter');
    const fb = inhalt.querySelector('.atlas-feedback');
    ersetzen(fb,
      h('div', { class: `feedback ${richtig ? 'ok' : 'nein'}` },
        h('p', { class: 'feedback-titel' }, richtig ? `Richtig! +${xp} XP` : 'Leider falsch'),
        h('p', {}, text),
        h('div', { class: 'merke' }, h('span', { class: 'label' }, 'Merke'), merke)),
      h('div', { class: 'weiter-zeile' }, weiter));
    weiter.focus({ preventScroll: true });
    frageAktiv.weiter = weiter;
  }

  const tasten = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || !frageAktiv) return;
    if (!frageAktiv.beantwortet && frageAktiv.optionen) {
      const t = e.key.toLowerCase();
      const i = ['1', '2', '3', '4'].includes(t) ? Number(t) - 1 : ['a', 'b', 'c', 'd'].indexOf(t);
      if (i >= 0) { e.preventDefault(); waehle(i); }
    }
  };
  document.addEventListener('keydown', tasten);

  function aufraeumen() {
    clearInterval(uhr);
    document.removeEventListener('keydown', tasten);
    globus?.zerstoeren();
  }

  function beenden() {
    if (beendet) return;
    beendet = true;
    aufraeumen();
    if (!protokoll.length) { location.hash = `#/lernen/${k.id}`; return; }
    const bonus = verbucheEinheit(sekunden);
    const richtig = protokoll.filter((p) => p.richtig).length;
    const xp = richtig * XP_RICHTIG + bonus;
    const falsche = protokoll.filter((p) => !p.richtig).map((p) => p.q.ziel);
    const quote = Math.round((richtig / protokoll.length) * 100);
    const lob = quote >= 90 ? 'Hervorragend.' : quote >= 70 ? 'Starke Runde.' : quote >= 50 ? 'Solide.' : 'Dranbleiben lohnt sich.';
    ersetzen(seite,
      h('section', { class: 'karte stapel ansicht-rein', 'aria-labelledby': 'atlas-ergebnis' },
        h('span', { class: 'label' }, `${k.name} · Prüfungsmodus · ${lv.name}`),
        h('h1', { id: 'atlas-ergebnis', tabindex: '-1' }, lob),
        h('div', { class: 'serie-zeile' },
          h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'ergebnis-zahl' }, `${richtig}/${protokoll.length}`), h('span', { class: 'label' }, 'Punkte')),
          h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'ergebnis-zahl' }, `${quote} %`), h('span', { class: 'label' }, 'richtig'))),
        h('p', {}, `+${xp} XP`)),
      falsche.length ? h('section', { class: 'stapel' },
        h('h2', {}, 'Das schaust du dir noch einmal an'),
        h('ul', { class: 'mitnehmen' }, ...falsche.map((z) => h('li', {}, z.art === 'land'
          ? `${z.name}: ${z.kontinent}${z.land.hs ? `, Hauptstadt ${z.land.hs}` : ''}`
          : `${z.name}: ${z.land.name}, ${z.kontinent}`))),
        h('p', { class: 'gedaempft' }, 'Falsch beantwortete Orte kommen in den nächsten Runden früher wieder.')) : null,
      h('div', { class: 'reihe' },
        h('button', { class: 'knopf gelb', type: 'button', style: { flex: '1' }, onclick: () => { location.hash = `#/atlas/${k.id}/pruefen?t=${Date.now()}`; } }, 'Neue Runde'),
        h('a', { class: 'knopf zweit', href: `#/atlas/${k.id}/lernen`, style: { flex: '1' } }, 'Zum Lernmodus'),
        h('a', { class: 'knopf zweit', href: `#/lernen/${k.id}`, style: { flex: '1' } }, 'Zur Klasse')));
    seite.querySelector('h1').focus();
    window.scrollTo({ top: 0 });
  }

  naechste();

  return () => {
    if (beendet) return;
    beendet = true;
    aufraeumen();
    if (protokoll.length) { verbucheEinheit(sekunden); toast('Deine angefangene Runde wurde gespeichert.'); }
  };
}
