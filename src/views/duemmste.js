// Spielmodus „Der Dümmste fliegt“: schnelle Fragen, Leben, optional Zeitlimit,
// allein oder mit 2 bis 8 Leuten an einem Gerät.
import { h, ersetzen, toast } from '../lib/dom.js';
import { speicher, verbucheSpielzeit } from '../app.js';
import { ladeKlassen, ladeAlle } from '../lib/daten.js';
import { zeigeFrage } from '../lib/frage-ui.js';
import { freitextTauglich } from '../lib/text.js';
import { mischen } from '../lib/zufall.js';
import { icons } from '../lib/icons.js';

export async function render(main) {
  const seite = h('div', { class: 'seite' });
  main.append(seite);
  let aufraeumen = null;
  einrichten(seite, (fn) => { aufraeumen = fn; });
  return () => aufraeumen?.();
}

function einrichten(seite, setzeAufraeumen) {
  const ein = { ...speicher.get().einstellungen.ddf };
  let mehrspieler = (ein.namen ?? []).filter((n) => n.trim()).length >= 2;
  let namen = ein.namen?.length >= 2 ? [...ein.namen] : ['', ''];

  const formular = h('div', { class: 'stapel' });
  function zeichnen() {
    ersetzen(formular, 
      h('fieldset', { class: 'karte stapel', style: { border: '1px solid var(--linie)' } },
        h('legend', { class: 'label', style: { padding: '0 6px' } }, 'Mitspieler'),
        h('div', { class: 'segmente', role: 'group', 'aria-label': 'Spielerzahl' },
          h('button', { class: 'segment', type: 'button', 'aria-pressed': String(!mehrspieler), onclick: () => { mehrspieler = false; zeichnen(); } }, 'Allein'),
          h('button', { class: 'segment', type: 'button', 'aria-pressed': String(mehrspieler), onclick: () => { mehrspieler = true; zeichnen(); } }, 'Mehrere an einem Gerät')),
        mehrspieler ? h('div', { class: 'spieler-liste' },
          ...namen.map((n, i) => h('div', { class: 'spieler-zeile' },
            h('span', { class: 'mono gedaempft' }, String(i + 1)),
            h('input', {
              class: 'eingabe', type: 'text', value: n, maxlength: '20', placeholder: `Name ${i + 1}`, 'aria-label': `Name von Spieler ${i + 1}`,
              oninput: (e) => { namen[i] = e.target.value; },
            }),
            namen.length > 2 ? h('button', { class: 'knopf leise', type: 'button', 'aria-label': `Spieler ${i + 1} entfernen`, onclick: () => { namen.splice(i, 1); zeichnen(); } }, 'Entfernen') : h('span'))),
          namen.length < 8 ? h('button', { class: 'knopf zweit', type: 'button', onclick: () => { namen.push(''); zeichnen(); formular.querySelectorAll('input.eingabe')[namen.length - 1]?.focus(); } }, '+ Spieler hinzufügen') : null,
        ) : h('p', { class: 'gedaempft' }, `Dein Rekord: ${speicher.get().highscore.ddf} richtige Antworten in einem Spiel.`),
      ),
      h('fieldset', { class: 'karte stapel', style: { border: '1px solid var(--linie)' } },
        h('legend', { class: 'label', style: { padding: '0 6px' } }, 'Regeln'),
        h('div', { class: 'stapel', style: { gap: '6px' } }, h('span', { style: { fontWeight: 600 } }, 'Leben'),
          h('div', { class: 'segmente', role: 'group', 'aria-label': 'Leben' },
            ...[1, 3, 5].map((n) => h('button', { class: 'segment mono', type: 'button', 'aria-pressed': String(ein.leben === n), onclick: () => { ein.leben = n; zeichnen(); } }, String(n))))),
        h('label', { class: 'schalter' }, h('input', { type: 'checkbox', checked: ein.zeitAn, onchange: (e) => { ein.zeitAn = e.target.checked; zeichnen(); } }), 'Zeitlimit pro Frage'),
        ein.zeitAn ? h('div', { class: 'segmente', role: 'group', 'aria-label': 'Sekunden pro Frage' },
          ...[5, 10, 15, 20].map((n) => h('button', { class: 'segment mono', type: 'button', 'aria-pressed': String(ein.zeitlimit === n), onclick: () => { ein.zeitlimit = n; zeichnen(); } }, `${n} s`))) : null,
        h('div', { class: 'stapel', style: { gap: '6px' } }, h('span', { style: { fontWeight: 600 } }, 'Antworten'),
          h('div', { class: 'segmente', role: 'group', 'aria-label': 'Antwortmodus' },
            h('button', { class: 'segment', type: 'button', 'aria-pressed': String(!ein.freitext), onclick: () => { ein.freitext = false; zeichnen(); } }, 'Vier zur Auswahl'),
            h('button', { class: 'segment', type: 'button', 'aria-pressed': String(ein.freitext), onclick: () => { ein.freitext = true; zeichnen(); } }, 'Freitext tippen')),
          ein.freitext ? h('p', { class: 'gedaempft', style: { fontSize: '0.88rem' } }, 'Groß- und Kleinschreibung und kleine Tippfehler zählen nicht als Fehler.') : null),
      ),
      h('button', { class: 'knopf gelb gross', type: 'button', onclick: los }, 'Spiel starten'),
    );
  }

  async function los() {
    const spielerNamen = mehrspieler ? namen.map((n, i) => n.trim() || `Spieler ${i + 1}`) : ['Du'];
    if (mehrspieler && new Set(spielerNamen).size !== spielerNamen.length) { toast('Bitte gib allen Spielern unterschiedliche Namen.'); return; }
    speicher.aendern((z) => { z.einstellungen.ddf = { ...ein, namen: mehrspieler ? namen : z.einstellungen.ddf.namen }; });
    ersetzen(seite, h('div', { class: 'lade', role: 'status' }, h('div', { class: 'lade-punkt' })));
    const klassen = await ladeKlassen();
    const alle = await ladeAlle(klassen);
    spielen(seite, alle, spielerNamen, ein, setzeAufraeumen);
  }

  ersetzen(seite, 
    h('section', { class: 'stapel' },
      h('span', { class: 'label' }, 'Spielmodus'),
      h('h1', {}, 'Der Dümmste fliegt'),
      h('p', { class: 'gedaempft' }, 'Schnelle Allgemeinwissensfragen, mal leicht, mal gemein. Jede falsche Antwort kostet ein Leben. Wer alle Leben verliert, fliegt. Wer zuletzt übrig ist, gewinnt.'),
      h('p', { class: 'gedaempft', style: { fontSize: '0.85rem' } }, 'Angelehnt an die gleichnamige Videoreihe von Schmobin, die auf das Format von Reved und PietSmiet zurückgeht. Alle Fragen hier sind eigene.'),
    ),
    formular,
  );
  zeichnen();
}

function fragenPool(alle, freitext) {
  const kurz = alle.filter((q) => q.frage.length <= 120 && (!freitext || freitextTauglich(q)));
  const ddf = mischen(kurz.filter((q) => q.ddf));
  const rest = mischen(kurz.filter((q) => !q.ddf));
  // Etwa zwei Drittel Fragen im typischen Stil, ein Drittel quer durch alle Klassen
  const pool = [];
  while (ddf.length || rest.length) {
    if (ddf.length) pool.push(ddf.pop());
    if (ddf.length) pool.push(ddf.pop());
    if (rest.length) pool.push(rest.pop());
  }
  return pool;
}

function spielen(seite, alle, spielerNamen, ein, setzeAufraeumen) {
  const pool = fragenPool(alle, ein.freitext);
  const spieler = spielerNamen.map((name) => ({ name, leben: ein.leben, punkte: 0, fehler: [], raus: false }));
  const ausgeschieden = [];
  let dran = 0;
  let aktuell = null;
  const start = performance.now();
  const solo = spieler.length === 1;

  setzeAufraeumen(() => { aktuell?.zerstoeren(); verbucheSpielzeit((performance.now() - start) / 1000); });

  const imSpiel = () => spieler.filter((s) => !s.raus);

  function herzen(s) {
    return h('span', { class: 'leben', 'aria-label': `${s.leben} von ${ein.leben} Leben` },
      ...Array.from({ length: ein.leben }, (_, i) => h('span', { class: `herz${i < s.leben ? '' : ' weg'}`, html: icons.herz })));
  }

  function anzeigeKopf(s) {
    return h('div', { class: 'zwischen' },
      h('div', { class: 'stapel', style: { gap: '2px' } },
        h('span', { class: 'label' }, solo ? 'Der Dümmste fliegt' : `${s.name} ist dran`),
        h('span', { class: 'mono', style: { fontWeight: 600 } }, `${s.punkte} richtig`)),
      herzen(s));
  }

  function zug() {
    aktuell?.zerstoeren();
    if (!solo && imSpiel().length <= 1) return ende();
    if (solo && spieler[0].raus) return ende();
    const s = spieler[dran];
    if (!solo) uebergabe(s, () => frage(s));
    else frage(s);
  }

  function uebergabe(s, weiter) {
    const knopf = h('button', { class: 'knopf gelb gross', type: 'button', onclick: () => fertig() }, `Ich bin ${s.name}, los!`);
    ersetzen(seite, h('section', { class: 'karte uebergabe ansicht-rein' },
      h('span', { class: 'label' }, 'Gerät weitergeben an'),
      h('p', { class: 'name' }, s.name),
      herzen(s),
      h('ul', { class: 'rangliste', style: { width: '100%' } }, ...spieler.map((p) => h('li', {}, h('span', { class: 'mono' }, p.raus ? '✗' : '•'), h('span', {}, p.name), h('span', { class: 'mono' }, p.raus ? 'fliegt' : `${p.leben} ♥ · ${p.punkte}`)))),
      knopf));
    knopf.focus();
    const t = (e) => { if (e.key === 'Enter') { e.preventDefault(); fertig(); } };
    document.addEventListener('keydown', t);
    let weg = false;
    function fertig() { if (weg) return; weg = true; document.removeEventListener('keydown', t); weiter(); }
    aktuell = { zerstoeren: () => document.removeEventListener('keydown', t) };
  }

  function frage(s) {
    const q = pool.length ? pool.shift() : null;
    if (!q) return ende();
    ersetzen(seite);
    aktuell = zeigeFrage(seite, q, {
      kopf: anzeigeKopf(s),
      freitext: ein.freitext,
      zeitlimit: ein.zeitAn ? ein.zeitlimit : 0,
      weiterText: 'Weiter',
      onAntwort: (richtig, info) => {
        if (richtig) s.punkte++;
        else {
          s.leben--;
          s.fehler.push({ q, antwort: info.zeitAus ? 'Zeit abgelaufen' : info.text ?? null });
          if (s.leben <= 0) { s.raus = true; ausgeschieden.push(s); }
        }
      },
      zusatzNachAntwort: (richtig) => (!richtig && s.raus ? h('div', { class: 'hinweis warn' }, h('strong', {}, solo ? 'Keine Leben mehr. ' : `${s.name} fliegt! `), solo ? 'Mal sehen, wie weit du gekommen bist.' : 'Die anderen spielen weiter.') : null),
      onWeiter: () => {
        if (!solo) {
          // Nächster Spieler, der noch im Spiel ist
          let n = dran;
          for (let i = 0; i < spieler.length; i++) { n = (n + 1) % spieler.length; if (!spieler[n].raus) break; }
          dran = n;
        }
        zug();
      },
    });
  }

  function ende() {
    aktuell?.zerstoeren();
    verbucheSpielzeit((performance.now() - start) / 1000);
    setzeAufraeumen(null);
    let neuerRekord = false;
    if (solo) {
      const p = spieler[0].punkte;
      speicher.aendern((z) => { if (p > z.highscore.ddf) { z.highscore.ddf = p; neuerRekord = true; } });
    }
    const rangfolge = solo ? spieler : [...imSpiel().sort((a, b) => b.punkte - a.punkte), ...[...ausgeschieden].reverse()];
    const sieger = rangfolge[0];
    const alleFehler = spieler.flatMap((s) => s.fehler.map((f) => ({ ...f, name: s.name })));

    ersetzen(seite, 
      h('section', { class: 'karte stapel ansicht-rein' },
        h('span', { class: 'label' }, 'Spiel vorbei'),
        solo
          ? h('h1', {}, neuerRekord ? 'Neuer Rekord!' : 'Ausgeflogen.')
          : h('h1', {}, `${sieger.name} gewinnt!`),
        solo
          ? h('div', { class: 'serie-zeile' },
            h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'ergebnis-zahl' }, String(spieler[0].punkte)), h('span', { class: 'label' }, 'richtig')),
            h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'ergebnis-zahl' }, String(speicher.get().highscore.ddf)), h('span', { class: 'label' }, 'Rekord')))
          : h('ol', { class: 'rangliste' }, ...rangfolge.map((s, i) => h('li', { class: i === 0 ? 'sieger' : '' },
            h('span', { class: 'mono' }, `${i + 1}.`), h('span', {}, s.name), h('span', { class: 'mono' }, `${s.punkte} richtig`)))),
      ),
      alleFehler.length ? h('section', { class: 'stapel' },
        h('h2', {}, 'Die Fehler mit Erklärung'),
        h('ul', { class: 'mitnehmen' }, ...alleFehler.map((f) => h('li', { class: 'stapel', style: { gap: '4px' } },
          !solo ? h('span', { class: 'label' }, f.name) : null,
          h('strong', {}, f.q.frage),
          f.antwort ? h('span', { class: 'gedaempft' }, f.antwort === 'Zeit abgelaufen' ? 'Zeit abgelaufen' : `Deine Antwort: ${f.antwort}`) : null,
          h('span', {}, `Richtig: ${f.q.antwortTyp === 'flagge' ? (f.q.namen?.[f.q.richtig] ?? f.q.richtig) : f.q.richtig}. ${f.q.begruendung}`))))) : null,
      h('div', { class: 'reihe' },
        h('button', { class: 'knopf gelb', type: 'button', style: { flex: '1' }, onclick: () => { location.hash = `#/duemmste?neu=${Date.now()}`; } }, 'Nochmal spielen'),
        h('a', { class: 'knopf zweit', href: '#/', style: { flex: '1' } }, 'Zur Startseite')),
    );
    seite.querySelector('h1')?.setAttribute('tabindex', '-1');
    seite.querySelector('h1')?.focus();
  }

  zug();
}
