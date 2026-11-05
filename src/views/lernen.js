import { h, ersetzen } from '../lib/dom.js';
import { speicher } from '../app.js';
import { ladeKlassen, ladeKlasse, ladeAlle } from '../lib/daten.js';
import { klassenStatistik, istFaellig, istSchwaeche } from '../lib/lernlogik.js';
import { klassenStufe } from '../lib/punkte.js';
import { heute } from '../lib/zeit.js';
import { zielFuerHeute, zielText } from './start.js';
import { LEVEL, levelVon } from '../lib/atlas-daten.js';

const prozent = (x) => `${Math.round(x * 100)} %`;

function lade() {
  return h('div', { class: 'lade', role: 'status' }, h('div', { class: 'lade-punkt' }), h('span', { class: 'visuell-versteckt' }, 'Lädt …'));
}

export async function render(main, { gruppen }) {
  const seite = h('div', { class: 'seite breit' });
  main.append(seite);
  seite.append(lade());
  const klassen = await ladeKlassen();
  if (gruppen[0]) return detail(seite, klassen.find((k) => k.id === gruppen[0]));
  return uebersicht(seite, klassen);
}

async function uebersicht(seite, klassen) {
  const z = speicher.get();
  const ziel = zielFuerHeute(z);
  const alle = await ladeAlle(klassen, { mitAtlas: true });
  const nachKlasse = Object.groupBy ? Object.groupBy(alle, (q) => q.klasse) : alle.reduce((m, q) => ((m[q.klasse] ??= []).push(q), m), {});
  // Atlas-Fragen gehören nicht zu „Schwächen üben“ (sie brauchen den Globus)
  const schwaechen = Object.entries(z.fragen).filter(([id, e]) => !id.startsWith('atl-') && istSchwaeche(e)).length;
  const starte = (modus, klasse) => {
    const p = new URLSearchParams({ modus, art: ziel.art, wert: String(ziel.wert) });
    if (klasse) p.set('klasse', klasse);
    location.hash = `#/sitzung?${p}`;
  };

  ersetzen(seite, 
    h('section', { class: 'stapel' },
      h('span', { class: 'label' }, `${klassen.length} Klassen · ${alle.length.toLocaleString('de-DE')} Fragen`),
      h('h1', {}, 'Lernen'),
      h('p', { class: 'gedaempft' }, `Lerne gemischt, eine einzelne Klasse oder gezielt deine Schwächen. Dein Ziel: ${zielText(ziel)}.`),
    ),
    h('div', { class: 'reihe' },
      h('button', { class: 'knopf gelb', type: 'button', onclick: () => starte('gemischt') }, 'Gemischt (alle Klassen)'),
      h('button', { class: 'knopf zweit', type: 'button', disabled: schwaechen === 0, onclick: () => starte('schwaechen') }, schwaechen ? `Schwächen üben (${schwaechen})` : 'Schwächen üben (noch keine)'),
    ),
    h('ul', { class: 'raster', style: { listStyle: 'none', padding: 0, margin: 0 }, 'aria-label': 'Klassen' },
      ...klassen.map((k) => {
        const st = klassenStatistik(nachKlasse[k.id] ?? [], z.fragen);
        return h('li', {}, h('a', { class: 'klasse-kachel', href: `#/lernen/${k.id}` },
          h('span', { class: 'monogramm', 'aria-hidden': 'true' }, k.kurz, st.meister ? h('span', { class: 'meister-abzeichen', title: 'Meister' }, '★') : null),
          h('span', { style: { minWidth: 0 } },
            h('span', { style: { display: 'block', fontWeight: 700 } }, k.name),
            h('span', { class: 'gedaempft', style: { display: 'block', fontSize: '0.85rem' } },
              `${prozent(st.anteilGelernt)} gelernt · Stufe ${klassenStufe(z.klassenXp[k.id])}${st.meister ? ' · Meister' : ''}`),
            h('span', { class: 'mini-balken', 'aria-hidden': 'true' }, h('span', { style: { width: prozent(st.anteilGelernt).replace(' ', '') } })),
          )));
      })),
  );
}

async function detail(seite, k) {
  if (!k) { location.hash = '#/lernen'; return; }
  const z = speicher.get();
  const fragen = await ladeKlasse(k);
  const st = klassenStatistik(fragen, z.fragen);
  const tag = heute();
  const faellig = fragen.filter((q) => istFaellig(z.fragen[q.id], tag)).length;
  const schwach = fragen.filter((q) => istSchwaeche(z.fragen[q.id])).length;
  const stufen = { leicht: 0, mittel: 0, schwer: 0 };
  for (const q of fragen) stufen[q.schwierigkeit]++;
  const ziel = zielFuerHeute(z);
  const starte = (modus) => {
    const p = new URLSearchParams({ modus, klasse: k.id, art: ziel.art, wert: String(ziel.wert), karten: '0' });
    location.hash = `#/sitzung?${p}`;
  };
  const istAtlas = k.typ === 'atlas';

  // Jede Klasse hat genau zwei Modi: Lernen (ansehen, einprägen) und Prüfen (Quiz)
  const modusKarte = (titel, text, knopf) => h('div', { class: 'modus-karte stapel' }, h('h3', {}, titel), h('p', { class: 'gedaempft' }, text), knopf);
  const modi = h('section', { class: 'modi', 'aria-label': 'Modus wählen' },
    modusKarte('Lernmodus',
      istAtlas ? 'Globus ansehen, Orte auswählen und einprägen. Ohne Punkte und ohne Zeitdruck.' : 'Alle Wissenskarten der Klasse in Ruhe durchblättern. Ohne Fragen und ohne Punkte.',
      h('a', { class: 'knopf zweit gross', href: istAtlas ? `#/atlas/${k.id}/lernen` : `#/karten/${k.id}` }, 'Lernmodus starten')),
    modusKarte('Prüfungsmodus',
      istAtlas ? `${k.id === 'atlas-globus' ? 'Orte selbst auf dem Globus antippen' : 'Markierte Orte benennen'}. 10 Fragen, mit XP und Wiederholung.` : `Quizfragen ohne Wissenskarte vorweg. Dein Ziel: ${zielText(ziel)}.`,
      istAtlas
        ? h('a', { class: 'knopf gelb gross', href: `#/atlas/${k.id}/pruefen` }, 'Prüfung starten')
        : h('button', { class: 'knopf gelb gross', type: 'button', onclick: () => starte('klasse') }, 'Prüfung starten')),
  );

  const levelWahl = istAtlas ? h('fieldset', { class: 'karte stapel level-wahl' },
    h('legend', { class: 'label' }, 'Schwierigkeitslevel'),
    ...Object.entries(LEVEL).map(([id, lv]) => h('label', { class: 'level-option' },
      h('input', {
        type: 'radio', name: 'atlas-level', value: id, checked: levelVon(z) === id,
        onchange: () => speicher.aendern((zz) => { zz.einstellungen.atlasLevel = id; }),
      }),
      h('span', { class: 'stapel', style: { gap: '2px' } }, h('strong', {}, lv.name), h('span', { class: 'gedaempft' }, lv.text)))),
  ) : null;

  ersetzen(seite,
    h('a', { class: 'knopf leise', href: '#/lernen', style: { justifySelf: 'start' } }, '← Alle Klassen'),
    h('section', { class: 'stapel' },
      h('div', { class: 'reihe' },
        h('span', { class: 'monogramm', 'aria-hidden': 'true' }, k.kurz, st.meister ? h('span', { class: 'meister-abzeichen' }, '★') : null),
        h('span', { class: 'label' }, k.text)),
      h('h1', {}, k.name),
    ),
    h('section', { class: 'karte stapel' },
      h('div', { class: 'serie-zeile' },
        h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'wert' }, prozent(st.anteilGelernt)), h('span', { class: 'label' }, 'gelernt')),
        h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'wert' }, String(klassenStufe(z.klassenXp[k.id]))), h('span', { class: 'label' }, 'Stufe')),
        h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'wert' }, st.quote == null ? 'noch keine' : prozent(st.quote)), h('span', { class: 'label' }, 'Trefferquote')),
      ),
      h('div', { class: 'level-balken', role: 'progressbar', 'aria-label': 'Anteil gelernt', 'aria-valuenow': String(Math.round(st.anteilGelernt * 100)), 'aria-valuemin': '0', 'aria-valuemax': '100' },
        h('span', { style: { width: `${Math.round(st.anteilGelernt * 100)}%` } })),
      h('p', { class: 'gedaempft', style: { fontSize: '0.9rem' } },
        `${st.gelernt} von ${st.gesamt} Fragen sicher gelernt, ${st.gesehen} gesehen. `,
        st.meister ? 'Du bist Meister dieser Klasse.' : `Ab 90 % gelernt bekommst du das Meister-Abzeichen.`),
      h('p', { class: 'label' }, `${stufen.leicht} leicht · ${stufen.mittel} mittel · ${stufen.schwer} schwer`),
      h('div', { class: 'reihe' },
        schwach && !istAtlas ? h('button', { class: 'knopf zweit', type: 'button', onclick: () => starte('schwaechen') }, `Schwächen in dieser Klasse (${schwach})`) : null,
        faellig ? h('span', { class: 'chip' }, `${faellig} fällig`) : null,
      ),
    ),
    levelWahl,
    modi,
  );
}
