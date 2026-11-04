import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import './styles/main.css';

import { speicher } from './app.js';
import { icons } from './lib/icons.js';
import { leeren, toast } from './lib/dom.js';
import { levelInfo } from './lib/punkte.js';
import * as start from './views/start.js';
import * as lernen from './views/lernen.js';
import * as sitzung from './views/sitzung.js';
import * as duemmste from './views/duemmste.js';
import * as aktuell from './views/aktuell.js';
import * as fortschritt from './views/fortschritt.js';

const routen = [
  { muster: /^\/?$/, ansicht: start, nav: 'start', titel: 'Start' },
  { muster: /^\/lernen\/?$/, ansicht: lernen, nav: 'lernen', titel: 'Lernen' },
  { muster: /^\/lernen\/([\w-]+)\/?$/, ansicht: lernen, nav: 'lernen', titel: 'Klasse' },
  { muster: /^\/sitzung\/?$/, ansicht: sitzung, nav: 'lernen', titel: 'Lerneinheit' },
  { muster: /^\/duemmste\/?$/, ansicht: duemmste, nav: 'duemmste', titel: 'Der Dümmste fliegt' },
  { muster: /^\/aktuell\/?$/, ansicht: aktuell, nav: 'aktuell', titel: 'Aktuell' },
  { muster: /^\/fortschritt\/?$/, ansicht: fortschritt, nav: 'fortschritt', titel: 'Fortschritt' },
];

const main = document.getElementById('inhalt');
let aufraeumen = null;

// Icons in die Navigation setzen
for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = icons[el.dataset.icon] ?? '';

function aktuellerPfad() {
  const hash = location.hash.replace(/^#/, '');
  const [pfad, query = ''] = hash.split('?');
  return { pfad: pfad || '/', parameter: new URLSearchParams(query) };
}

async function zeige() {
  const { pfad, parameter } = aktuellerPfad();
  let treffer = null;
  let gruppen = [];
  for (const r of routen) {
    const m = pfad.match(r.muster);
    if (m) { treffer = r; gruppen = m.slice(1); break; }
  }
  if (!treffer) { location.hash = '#/'; return; }
  try { aufraeumen?.(); } catch { /* Ansicht war schon weg */ }
  aufraeumen = null;
  leeren(main);
  for (const a of document.querySelectorAll('[data-nav]')) {
    if (a.dataset.nav === treffer.nav) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  document.title = `${treffer.titel} · Wissenstag`;
  window.scrollTo({ top: 0 });
  const ergebnis = await treffer.ansicht.render(main, { gruppen, parameter });
  if (typeof ergebnis === 'function') aufraeumen = ergebnis;
  // Fokus für Screenreader auf den neuen Inhalt setzen
  const h1 = main.querySelector('h1');
  if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
}

// Kopfzeile: XP und Farbschema
function kopfAktualisieren(z) {
  const info = levelInfo(z.xp);
  document.getElementById('kopf-xp').textContent = `${z.xp} XP · ${info.name}`;
  const theme = z.einstellungen.theme;
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  const knopf = document.getElementById('theme-knopf');
  knopf.innerHTML = icons[theme === 'hell' ? 'sonne' : theme === 'dunkel' ? 'mond' : 'auto'];
  const namen = { auto: 'automatisch', hell: 'hell', dunkel: 'dunkel' };
  knopf.setAttribute('aria-label', `Farbschema: ${namen[theme]}. Wechseln`);
  knopf.title = `Farbschema: ${namen[theme]}`;
}

document.getElementById('theme-knopf').addEventListener('click', () => {
  const reihe = ['auto', 'hell', 'dunkel'];
  speicher.aendern((z) => {
    z.einstellungen.theme = reihe[(reihe.indexOf(z.einstellungen.theme) + 1) % reihe.length];
  });
  const t = speicher.get().einstellungen.theme;
  toast(`Farbschema: ${t === 'auto' ? 'wie im System' : t}`);
});

speicher.abonnieren(kopfAktualisieren);
speicher.onFehler = () => toast('Dein Browser erlaubt kein Speichern. Sichere deinen Fortschritt über „Exportieren“.', { dauer: 7000 });
kopfAktualisieren(speicher.get());

window.addEventListener('hashchange', zeige);
zeige();
