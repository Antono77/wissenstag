import { h, ersetzen, toast } from '../lib/dom.js';
import { speicher } from '../app.js';
import { ladeKlassen, ladeAlle } from '../lib/daten.js';
import { klassenStatistik } from '../lib/lernlogik.js';
import { levelInfo, klassenStufe, serie, wochenleiste, LEVEL } from '../lib/punkte.js';
import { heute, wochentagKurz } from '../lib/zeit.js';

const pz = (x) => `${Math.round(x * 100)} %`;

export async function render(main) {
  const seite = h('div', { class: 'seite breit' });
  main.append(seite);
  seite.append(h('div', { class: 'lade', role: 'status' }, h('div', { class: 'lade-punkt' })));
  const klassen = await ladeKlassen();
  const alle = await ladeAlle(klassen);
  zeichnen(seite, klassen, alle);
  const ab = speicher.abonnieren(() => zeichnen(seite, klassen, alle));
  return ab;
}

function zeichnen(seite, klassen, alle) {
  const z = speicher.get();
  const info = levelInfo(z.xp);
  const tageInFolge = serie(z.tage);
  const woche = wochenleiste(z.tage);
  const nachKlasse = alle.reduce((m, q) => ((m[q.klasse] ??= []).push(q), m), {});
  const stats = klassen.map((k) => ({ k, st: klassenStatistik(nachKlasse[k.id] ?? [], z.fragen), stufe: klassenStufe(z.klassenXp[k.id]) }));
  const gesamt = klassenStatistik(alle, z.fragen);
  const tageWerte = Object.values(z.tage);
  const einheiten = tageWerte.reduce((s, t) => s + (t.einheiten ?? 0), 0);
  const minuten = Math.round(tageWerte.reduce((s, t) => s + (t.sekunden ?? 0), 0) / 60);
  const lernTage = tageWerte.filter((t) => t.einheiten > 0).length;

  // Stärkste und schwächste Klassen: nur mit genug Antworten
  const bewertbar = stats.filter((s) => s.st.antworten >= 10);
  const sortiert = [...bewertbar].sort((a, b) => b.st.quote - a.st.quote);
  const staerkste = sortiert.slice(0, 3);
  const schwaechste = sortiert.slice(-3).reverse().filter((s) => !staerkste.includes(s));

  const dateiInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'visuell-versteckt', id: 'import-datei', onchange: importieren });

  ersetzen(seite, 
    h('section', { class: 'stapel' }, h('span', { class: 'label' }, `Seit ${new Date(z.erstellt).toLocaleDateString('de-DE')}`), h('h1', {}, 'Fortschritt')),

    h('section', { class: 'karte stapel' },
      h('div', { class: 'serie-zeile' },
        h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'wert' }, String(z.xp)), h('span', { class: 'label' }, 'XP')),
        h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'wert' }, String(tageInFolge)), h('span', { class: 'label' }, 'Tage in Folge')),
        h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'wert' }, String(einheiten)), h('span', { class: 'label' }, 'Einheiten')),
        h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'wert' }, String(minuten)), h('span', { class: 'label' }, 'Minuten')),
      ),
      h('div', { class: 'zwischen' }, h('h2', {}, info.name), h('span', { class: 'chip' }, `Level ${info.stufe} von ${LEVEL.length}`)),
      h('div', { class: 'level-balken', role: 'progressbar', 'aria-label': 'Fortschritt bis zum nächsten Level', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(info.anteil * 100)) },
        h('span', { style: { width: `${Math.round(info.anteil * 100)}%` } })),
      h('p', { class: 'gedaempft', style: { fontSize: '0.88rem' } }, info.naechstes ? `Noch ${info.fehlt} XP bis „${info.naechstes.name}“. Level: ${LEVEL.map((l) => l.name).join(', ')}.` : 'Du hast das höchste Level erreicht.'),
      h('div', { class: 'woche', 'aria-label': 'Die letzten sieben Tage' }, ...woche.map((w) => h('div', { class: 'woche-tag' },
        h('div', { class: `woche-punkt${w.erledigt ? ' voll' : ''}${w.heute ? ' heute' : ''}`, role: 'img', 'aria-label': `${wochentagKurz(w.tag)}: ${w.erledigt ? 'gelernt' : 'nicht gelernt'}` }),
        h('span', { class: 'label' }, wochentagKurz(w.tag))))),
      h('p', { class: 'gedaempft', style: { fontSize: '0.88rem' } },
        `${gesamt.gesehen} von ${gesamt.gesamt.toLocaleString('de-DE')} Fragen gesehen, ${gesamt.gelernt} sicher gelernt. `,
        gesamt.quote != null ? `Trefferquote insgesamt ${pz(gesamt.quote)}. ` : '',
        `An ${lernTage} ${lernTage === 1 ? 'Tag' : 'Tagen'} gelernt.`),
    ),

    h('div', { class: 'raster' },
      h('section', { class: 'karte stapel' }, h('h2', {}, 'Stärkste Klassen'),
        staerkste.length ? h('ol', { class: 'rangliste' }, ...staerkste.map((s, i) => h('li', {}, h('span', { class: 'mono' }, `${i + 1}.`), h('span', {}, s.k.name), h('span', { class: 'mono' }, pz(s.st.quote)))))
          : h('p', { class: 'gedaempft' }, 'Beantworte in einer Klasse mindestens zehn Fragen, dann erscheint sie hier.')),
      h('section', { class: 'karte stapel' }, h('h2', {}, 'Schwächste Klassen'),
        schwaechste.length ? h('ol', { class: 'rangliste' }, ...schwaechste.map((s, i) => h('li', {}, h('span', { class: 'mono' }, `${i + 1}.`), h('a', { href: `#/lernen/${s.k.id}` }, s.k.name), h('span', { class: 'mono' }, pz(s.st.quote)))))
          : h('p', { class: 'gedaempft' }, 'Noch zu wenige Antworten für einen Vergleich.')),
    ),

    h('section', { class: 'karte stapel' },
      h('h2', {}, 'Alle Klassen'),
      h('div', { class: 'tabelle-wrap' }, h('table', { class: 'tabelle' },
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Klasse'), h('th', { scope: 'col', class: 'zahl' }, 'Gelernt'), h('th', { scope: 'col', class: 'zahl' }, 'Stufe'), h('th', { scope: 'col', class: 'zahl' }, 'Quote'), h('th', { scope: 'col', class: 'zahl' }, 'Fragen'))),
        h('tbody', {}, ...stats.map(({ k, st, stufe }) => h('tr', {},
          h('th', { scope: 'row', style: { fontWeight: 600 } }, h('a', { href: `#/lernen/${k.id}` }, k.name), st.meister ? h('span', { class: 'chip gelb', style: { marginLeft: '8px' } }, 'Meister') : null,
            h('div', { class: 'mini-balken', 'aria-hidden': 'true' }, h('span', { style: { width: `${Math.round(st.anteilGelernt * 100)}%` } }))),
          h('td', { class: 'zahl' }, pz(st.anteilGelernt)),
          h('td', { class: 'zahl' }, String(stufe)),
          h('td', { class: 'zahl' }, st.quote == null ? 'noch keine' : pz(st.quote)),
          h('td', { class: 'zahl' }, String(st.gesamt)))))))),

    h('section', { class: 'karte stapel' },
      h('h2', {}, 'Einstellungen'),
      h('label', { class: 'schalter' }, h('input', { type: 'checkbox', checked: z.einstellungen.kartenZeigen, onchange: (e) => speicher.aendern((s) => { s.einstellungen.kartenZeigen = e.target.checked; }) }), 'Vor neuen Fragen die Wissenskarte zeigen'),
      h('div', { class: 'stapel', style: { gap: '6px' } }, h('span', { style: { fontWeight: 600 } }, 'Farbschema'),
        h('div', { class: 'segmente', role: 'group', 'aria-label': 'Farbschema' },
          ...[['auto', 'Wie im System'], ['hell', 'Hell'], ['dunkel', 'Dunkel']].map(([w, t]) => h('button', { class: 'segment', type: 'button', 'aria-pressed': String(z.einstellungen.theme === w), onclick: () => speicher.aendern((s) => { s.einstellungen.theme = w; }) }, t)))),
    ),

    h('section', { class: 'karte stapel' },
      h('h2', {}, 'Sichern und übertragen'),
      h('p', { class: 'gedaempft' }, 'Dein Fortschritt liegt nur in diesem Browser. Exportiere ihn als Datei, um ihn zu sichern oder auf einem anderen Gerät zu importieren.'),
      h('div', { class: 'reihe' },
        h('button', { class: 'knopf', type: 'button', onclick: exportieren }, 'Fortschritt exportieren'),
        h('label', { class: 'knopf zweit', for: 'import-datei', tabindex: '0', onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dateiInput.click(); } } }, 'Datei importieren'),
        dateiInput,
        h('button', { class: 'knopf leise', type: 'button', onclick: zuruecksetzen, style: { color: 'var(--falsch)' } }, 'Alles zurücksetzen')),
    ),
  );
}

function exportieren() {
  const blob = new Blob([speicher.exportieren()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `wissenstag-fortschritt-${heute()}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Fortschritt exportiert.');
}

async function importieren(e) {
  const datei = e.target.files?.[0];
  e.target.value = '';
  if (!datei) return;
  if (datei.size > 5_000_000) { toast('Die Datei ist zu groß.'); return; }
  const text = await datei.text();
  if (!confirm('Der importierte Stand ersetzt deinen aktuellen Fortschritt in diesem Browser. Fortfahren?')) return;
  try {
    speicher.importieren(text);
    toast('Fortschritt importiert.');
  } catch (err) {
    toast(err.message);
  }
}

function zuruecksetzen() {
  if (!confirm('Wirklich den gesamten Fortschritt löschen? Das lässt sich nicht rückgängig machen. Exportiere ihn vorher, wenn du ihn behalten willst.')) return;
  speicher.zuruecksetzen();
  toast('Fortschritt gelöscht.');
}
