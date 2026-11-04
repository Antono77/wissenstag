import { h, toast } from '../lib/dom.js';
import { speicher } from '../app.js';
import { levelInfo, serie, wochenleiste } from '../lib/punkte.js';
import { heute, wochentagKurz } from '../lib/zeit.js';
import { istFaellig, istSchwaeche } from '../lib/lernlogik.js';

const ZEITEN = [5, 10, 15, 20, 30];
const ANZAHLEN = [10, 20, 50];

export function zielFuerHeute(z) {
  const zh = z.einstellungen.zielHeute;
  return zh && zh.tag === heute() ? { art: zh.art, wert: zh.wert } : { ...z.einstellungen.ziel };
}

export function zielText(ziel) {
  if (ziel.art === 'frei') return 'ohne Limit';
  if (ziel.art === 'zeit') return `${ziel.wert} Minuten`;
  return `${ziel.wert} Fragen`;
}

export function render(main) {
  const z = speicher.get();
  const tag = heute();
  const info = levelInfo(z.xp);
  const tageInFolge = serie(z.tage);
  const woche = wochenleiste(z.tage);
  const heuteDaten = z.tage[tag];
  const faellig = Object.values(z.fragen).filter((e) => istFaellig(e, tag)).length;
  const schwaechen = Object.values(z.fragen).filter(istSchwaeche).length;
  let ziel = zielFuerHeute(z);

  const stunde = new Date().getHours();
  const gruss = stunde < 11 ? 'Guten Morgen' : stunde < 18 ? 'Hallo' : 'Guten Abend';
  const datum = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  // --- Ziel-Auswahl ---
  const zielBereich = h('div', { class: 'stapel' });
  const zielChip = h('span', { class: 'chip petrol' });
  function zielZeichnen() {
    zielBereich.replaceChildren();
    zielChip.textContent = zielText(ziel);
    const arten = h('div', { class: 'segmente', role: 'group', 'aria-label': 'Art des Ziels' },
      ...[['zeit', 'Zeit'], ['fragen', 'Fragen'], ['frei', 'Ohne Limit']].map(([art, text]) =>
        h('button', {
          class: 'segment', type: 'button', 'aria-pressed': String(ziel.art === art),
          onclick: () => { ziel = { art, wert: art === 'zeit' ? 10 : art === 'fragen' ? 20 : 0 }; merkeHeute(); zielZeichnen(); },
        }, text)));
    zielBereich.append(arten);
    if (ziel.art !== 'frei') {
      const werte = ziel.art === 'zeit' ? ZEITEN : ANZAHLEN;
      const einheit = ziel.art === 'zeit' ? 'Min.' : 'Fragen';
      const eigenerWert = !werte.includes(ziel.wert);
      const eingabe = h('input', {
        class: 'eingabe', type: 'number', min: '1', max: ziel.art === 'zeit' ? '180' : '500', inputmode: 'numeric',
        value: eigenerWert ? String(ziel.wert) : '', placeholder: 'Eigene', 'aria-label': `Eigene ${ziel.art === 'zeit' ? 'Minutenzahl' : 'Fragenzahl'}`,
        style: { width: '110px' },
        onchange: (e) => {
          const n = Math.round(Number(e.target.value));
          if (n >= 1) { ziel = { art: ziel.art, wert: Math.min(n, ziel.art === 'zeit' ? 180 : 500) }; merkeHeute(); zielZeichnen(); }
        },
      });
      zielBereich.append(h('div', { class: 'segmente', role: 'group', 'aria-label': ziel.art === 'zeit' ? 'Lernzeit' : 'Anzahl Fragen' },
        ...werte.map((w) => h('button', {
          class: 'segment mono', type: 'button', 'aria-pressed': String(ziel.wert === w),
          onclick: () => { ziel = { art: ziel.art, wert: w }; merkeHeute(); zielZeichnen(); },
        }, `${w} ${einheit}`)),
        eingabe));
    }
    const standard = speicher.get().einstellungen.ziel;
    const istStandard = standard.art === ziel.art && standard.wert === ziel.wert;
    zielBereich.append(h('div', { class: 'zwischen' },
      h('span', { class: 'gedaempft', style: { fontSize: '0.88rem' } }, `Voreinstellung: ${zielText(standard)}`),
      istStandard ? null : h('button', {
        class: 'knopf leise', type: 'button',
        onclick: () => { speicher.aendern((s) => { s.einstellungen.ziel = { ...ziel }; }); toast(`Neue Voreinstellung: ${zielText(ziel)}`); zielZeichnen(); },
      }, 'Als Voreinstellung merken')));
  }
  function merkeHeute() {
    speicher.aendern((s) => { s.einstellungen.zielHeute = { tag, ...ziel }; });
  }
  zielZeichnen();

  const starte = (modus) => {
    const p = new URLSearchParams({ modus, art: ziel.art, wert: String(ziel.wert) });
    location.hash = `#/sitzung?${p}`;
  };

  main.append(h('div', { class: 'seite' },
    h('section', { class: 'begruessung' },
      h('span', { class: 'label' }, datum),
      h('h1', {}, `${gruss}!`),
      h('p', { class: 'gedaempft' }, heuteDaten?.einheiten
        ? `Heute schon ${heuteDaten.einheiten} ${heuteDaten.einheiten === 1 ? 'Einheit' : 'Einheiten'} geschafft. Weitermachen geht immer.`
        : 'Wie lange willst du heute lernen? Du entscheidest.'),
    ),

    h('section', { class: 'karte stapel', 'aria-labelledby': 'ziel-titel' },
      h('div', { class: 'zwischen' }, h('h2', { id: 'ziel-titel' }, 'Dein Ziel heute'), zielChip),
      zielBereich,
      h('button', { class: 'knopf gelb gross', type: 'button', onclick: () => starte('gemischt') }, 'Gemischt lernen'),
      h('div', { class: 'reihe' },
        h('a', { class: 'knopf zweit', href: '#/lernen', style: { flex: '1' } }, 'Klasse wählen'),
        schwaechen > 0 ? h('button', { class: 'knopf zweit', type: 'button', style: { flex: '1' }, onclick: () => starte('schwaechen') }, `Schwächen üben (${schwaechen})`) : null,
      ),
      faellig > 0 ? h('p', { class: 'gedaempft', style: { fontSize: '0.9rem' } }, `${faellig} ${faellig === 1 ? 'Frage wartet' : 'Fragen warten'} auf Wiederholung. Sie kommen in deiner nächsten Einheit zuerst.`) : null,
    ),

    h('section', { class: 'karte stapel', 'aria-labelledby': 'stand-titel' },
      h('h2', { id: 'stand-titel', class: 'visuell-versteckt' }, 'Dein Stand'),
      h('div', { class: 'serie-zeile' },
        h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'wert' }, String(tageInFolge)), h('span', { class: 'label' }, 'Tage in Folge')),
        h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'wert' }, String(z.xp)), h('span', { class: 'label' }, 'XP gesamt')),
        h('div', { class: 'kennzahl', style: { flex: '1.4' } }, h('span', { class: 'wert', style: { fontFamily: 'var(--f-titel)', fontSize: '1.3rem' } }, info.name), h('span', { class: 'label' }, `Level ${info.stufe}`)),
      ),
      h('div', { class: 'stapel', style: { gap: '6px' } },
        h('div', { class: 'level-balken', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(info.anteil * 100)), 'aria-label': 'Fortschritt bis zum nächsten Level' },
          h('span', { style: { width: `${Math.round(info.anteil * 100)}%` } })),
        h('span', { class: 'gedaempft', style: { fontSize: '0.85rem' } }, info.naechstes ? `Noch ${info.fehlt} XP bis „${info.naechstes.name}“` : 'Höchstes Level erreicht'),
      ),
      h('div', { class: 'woche', 'aria-label': 'Die letzten sieben Tage' },
        ...woche.map((w) => h('div', { class: 'woche-tag' },
          h('div', { class: `woche-punkt${w.erledigt ? ' voll' : ''}${w.heute ? ' heute' : ''}`, role: 'img', 'aria-label': `${wochentagKurz(w.tag)}: ${w.erledigt ? 'gelernt' : 'nicht gelernt'}` }),
          h('span', { class: 'label' }, wochentagKurz(w.tag))))),
    ),

    h('div', { class: 'raster' },
      h('a', { class: 'karte stapel', href: '#/duemmste', style: { textDecoration: 'none', color: 'inherit' } },
        h('span', { class: 'label' }, 'Spielmodus'), h('h3', {}, 'Der Dümmste fliegt'),
        h('p', { class: 'gedaempft' }, 'Schnelle Fragen, drei Leben. Allein oder mit bis zu acht Leuten an einem Gerät.')),
      h('a', { class: 'karte stapel', href: '#/aktuell', style: { textDecoration: 'none', color: 'inherit' } },
        h('span', { class: 'label' }, 'Nachrichten'), h('h3', {}, 'Aktuell'),
        h('p', { class: 'gedaempft' }, 'Die neuesten Meldungen mit Einordnung und einem kleinen Quiz zur Woche.')),
    ),
  ));
}
