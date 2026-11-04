import { h, ersetzen, toast, bewegungReduziert } from '../lib/dom.js';
import { speicher, verbucheAntwort, verbucheEinheit } from '../app.js';
import { ladeKlassen, ladeKlasse, ladeAlle } from '../lib/daten.js';
import { stelleZusammen } from '../lib/lernlogik.js';
import { levelInfo, serie, XP_RICHTIG } from '../lib/punkte.js';
import { heute } from '../lib/zeit.js';
import { zeigeFrage, zeigeKarte } from '../lib/frage-ui.js';

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export async function render(main, { parameter }) {
  const modus = parameter.get('modus') ?? 'gemischt';
  const klasseId = parameter.get('klasse');
  const art = parameter.get('art') ?? 'zeit';
  const zielWert = Math.max(0, Number(parameter.get('wert') ?? 10));

  const seite = h('div', { class: 'seite' });
  main.append(seite);
  seite.append(h('div', { class: 'lade', role: 'status' }, h('div', { class: 'lade-punkt' })));

  const klassen = await ladeKlassen();
  const klassenName = Object.fromEntries(klassen.map((k) => [k.id, k.name]));
  const auswahl = klasseId ? klassen.filter((k) => k.id === klasseId) : klassen;
  const fragen = klasseId ? await ladeKlasse(auswahl[0]) : await ladeAlle(auswahl);
  const tag = heute();

  const anfangsAnzahl = art === 'fragen' ? zielWert : 30;
  let warteschlange = stelleZusammen(fragen, speicher.get().fragen, { tag, modus: modus === 'schwaechen' ? 'schwaechen' : 'gemischt', anzahl: anfangsAnzahl });
  const benutzt = new Set(warteschlange.map((x) => x.frage.id));

  if (!warteschlange.length) {
    ersetzen(seite, h('section', { class: 'karte stapel' },
      h('h1', {}, modus === 'schwaechen' ? 'Keine Schwächen' : 'Alles erledigt'),
      h('p', {}, modus === 'schwaechen' ? 'Du hast gerade keine falsch beantworteten Fragen offen. Stark!' : 'Für diese Auswahl gibt es gerade keine Fragen.'),
      h('a', { class: 'knopf', href: '#/lernen' }, 'Zu den Klassen')));
    return;
  }

  // --- Zustand der Einheit ---
  const protokoll = []; // { frage, richtig, nochmal }
  const nochmalGefragt = new Set();
  let xpEinheit = 0;
  let sekunden = 0;
  let letzterTick = performance.now();
  let pausiert = document.hidden;
  let zielGemeldet = false;
  let beendet = false;
  let aktuell = null; // { zerstoeren }

  // --- Kopfbereich ---
  const titel = modus === 'schwaechen' ? 'Schwächen üben' : klasseId ? klassenName[klasseId] : 'Gemischt';
  const zaehler = h('span', { class: 'label' });
  const uhr = h('span', { class: 'uhr', 'aria-live': 'off' });
  const linie = h('div', { class: 'fortschritt-linie', 'aria-hidden': 'true' }, h('span', { style: { width: '0%' } }));
  const zielHinweis = h('div', { 'aria-live': 'polite' });
  const beendenKnopf = h('button', { class: 'knopf leise', type: 'button', onclick: () => beenden() }, 'Einheit beenden');
  const kopf = h('header', { class: 'sitzung-kopf' },
    h('div', { class: 'zwischen' }, h('div', { class: 'stapel', style: { gap: '2px' } }, h('span', { class: 'label' }, titel), zaehler), h('div', { class: 'reihe' }, uhr, beendenKnopf)),
    linie, zielHinweis);
  const buehne = h('div', { class: 'stapel' });
  ersetzen(seite, kopf, buehne);

  const anzahlGezaehlt = () => protokoll.filter((p) => !p.nochmal).length;
  let zielFragen = zielWert;

  function zielErreicht() {
    if (art === 'zeit') return sekunden >= zielWert * 60;
    if (art === 'fragen') return anzahlGezaehlt() >= zielWert;
    return false;
  }

  function kopfAktualisieren() {
    const n = anzahlGezaehlt();
    zaehler.textContent = art === 'fragen' ? `${Math.min(n, zielFragen)} von ${zielFragen} Fragen` : `${n} beantwortet`;
    uhr.textContent = art === 'zeit' ? `${mmss(sekunden)} / ${zielWert}:00` : mmss(sekunden);
    uhr.classList.toggle('erreicht', zielErreicht());
    const anteil = art === 'zeit' ? sekunden / (zielWert * 60) : art === 'fragen' ? n / zielFragen : 0;
    linie.firstChild.style.width = `${Math.min(100, Math.round(anteil * 100))}%`;
    if (!zielGemeldet && zielErreicht()) {
      zielGemeldet = true;
      ersetzen(zielHinweis, h('div', { class: 'hinweis warn zwischen' },
        h('span', {}, h('strong', {}, 'Ziel erreicht. '), 'Du kannst abschließen oder weitermachen.'),
        h('button', { class: 'knopf gelb', type: 'button', onclick: () => beenden() }, 'Abschließen')));
    }
  }

  const uhrTimer = setInterval(() => {
    const jetzt = performance.now();
    if (!pausiert && !beendet) sekunden += (jetzt - letzterTick) / 1000;
    letzterTick = jetzt;
    kopfAktualisieren();
  }, 500);
  const sichtbarkeit = () => { pausiert = document.hidden; letzterTick = performance.now(); };
  document.addEventListener('visibilitychange', sichtbarkeit);

  function nachfuellen() {
    if (warteschlange.length >= 5 || art === 'fragen') return;
    const verlauf = speicher.get().fragen;
    const rest = fragen.filter((q) => !benutzt.has(q.id));
    const neu = stelleZusammen(rest, verlauf, { tag, modus: modus === 'schwaechen' ? 'schwaechen' : 'gemischt', anzahl: 20 });
    for (const x of neu) benutzt.add(x.frage.id);
    warteschlange.push(...neu);
  }

  function naechste() {
    aktuell?.zerstoeren();
    ersetzen(buehne);
    nachfuellen();
    kopfAktualisieren();
    if (art === 'fragen' && anzahlGezaehlt() >= zielFragen && !warteschlange.some((x) => x.art === 'nochmal')) {
      buehne.append(h('section', { class: 'karte stapel ansicht-rein' },
        h('h2', {}, 'Ziel erreicht'),
        h('p', {}, `Du hast ${zielFragen} Fragen geschafft. Schließ ab oder hol dir zehn weitere.`),
        h('div', { class: 'reihe' },
          h('button', { class: 'knopf gelb', type: 'button', style: { flex: '1' }, onclick: () => beenden() }, 'Abschließen'),
          h('button', { class: 'knopf zweit', type: 'button', style: { flex: '1' }, onclick: () => {
            zielFragen += 10;
            const rest = fragen.filter((q) => !benutzt.has(q.id));
            const neu = stelleZusammen(rest, speicher.get().fragen, { tag, modus: modus === 'schwaechen' ? 'schwaechen' : 'gemischt', anzahl: 10 });
            for (const x of neu) benutzt.add(x.frage.id);
            warteschlange.push(...neu);
            naechste();
          } }, '10 weitere Fragen'))));
      buehne.querySelector('.knopf.gelb').focus();
      return;
    }
    const eintrag = warteschlange.shift();
    if (!eintrag) return beenden();
    const q = eintrag.frage;
    const chip = { neu: 'Neu', wiederholung: 'Wiederholung', schwaeche: 'Schwäche', nochmal: 'Nochmal', uebung: 'Übung' }[eintrag.art];
    const kopfzeile = h('div', { class: 'zwischen' },
      h('span', { class: 'label' }, `${klassenName[q.klasse] ?? ''} · ${q.schwierigkeit}`),
      h('span', { class: `chip${eintrag.art === 'wiederholung' || eintrag.art === 'nochmal' ? ' petrol' : ''}` }, chip));

    const frageZeigen = () => {
      aktuell?.zerstoeren();
      ersetzen(buehne);
      aktuell = zeigeFrage(buehne, q, {
        kopf: kopfzeile,
        onAntwort: (richtig) => {
          if (eintrag.art !== 'nochmal') xpEinheit += verbucheAntwort(q, richtig);
          protokoll.push({ frage: q, richtig, nochmal: eintrag.art === 'nochmal' });
          if (!richtig && !nochmalGefragt.has(q.id)) {
            nochmalGefragt.add(q.id);
            warteschlange.splice(Math.min(3, warteschlange.length), 0, { frage: q, art: 'nochmal' });
          }
          kopfAktualisieren();
        },
        onWeiter: naechste,
      });
    };

    if (eintrag.art === 'neu' && speicher.get().einstellungen.kartenZeigen && q.karte) {
      aktuell = zeigeKarte(buehne, q, { klassenName: klassenName[q.klasse], onWeiter: frageZeigen });
    } else frageZeigen();
    if (!bewegungReduziert()) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function beenden() {
    if (beendet) return;
    beendet = true;
    aktuell?.zerstoeren();
    clearInterval(uhrTimer);
    document.removeEventListener('visibilitychange', sichtbarkeit);
    if (!protokoll.length) { location.hash = '#/'; return; }
    const xpVorher = speicher.get().xp - xpEinheit;
    const bonus = verbucheEinheit(sekunden);
    zeigeErgebnis(seite, { protokoll, xp: xpEinheit + bonus, sekunden, xpVorher, titel, parameter });
  }

  naechste();

  // Beim Verlassen der Seite: angefangene Einheit trotzdem zählen
  return () => {
    if (!beendet) {
      beendet = true;
      aktuell?.zerstoeren();
      clearInterval(uhrTimer);
      document.removeEventListener('visibilitychange', sichtbarkeit);
      if (protokoll.length) { verbucheEinheit(sekunden); toast('Deine angefangene Einheit wurde gespeichert.'); }
    }
  };
}

function zeigeErgebnis(seite, { protokoll, xp, sekunden, xpVorher, titel, parameter }) {
  const gezaehlt = protokoll.filter((p) => !p.nochmal);
  const richtig = gezaehlt.filter((p) => p.richtig).length;
  const gesamt = gezaehlt.length;
  const quote = gesamt ? Math.round((richtig / gesamt) * 100) : 0;
  const z = speicher.get();
  const vorher = levelInfo(xpVorher);
  const nachher = levelInfo(z.xp);
  const tageInFolge = serie(z.tage);

  // Das nimmst du mit: zuerst alles, was falsch war, dann einige neue richtige
  const gesehen = new Set();
  const mitnehmen = [];
  for (const p of protokoll) if (!p.richtig && !gesehen.has(p.frage.id)) { gesehen.add(p.frage.id); mitnehmen.push(p.frage); }
  for (const p of protokoll) if (p.richtig && !gesehen.has(p.frage.id) && mitnehmen.length < 8) { gesehen.add(p.frage.id); mitnehmen.push(p.frage); }

  const lob = quote >= 90 ? 'Hervorragend.' : quote >= 70 ? 'Starke Runde.' : quote >= 50 ? 'Solide.' : 'Dranbleiben lohnt sich.';
  ersetzen(seite, 
    h('section', { class: 'karte stapel ansicht-rein', 'aria-labelledby': 'ergebnis-titel' },
      h('span', { class: 'label' }, `${titel} · Einheit abgeschlossen`),
      h('h1', { id: 'ergebnis-titel' }, lob),
      h('div', { class: 'serie-zeile' },
        h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'ergebnis-zahl' }, `${richtig}/${gesamt}`), h('span', { class: 'label' }, 'Punkte')),
        h('div', { class: 'kennzahl', style: { flex: '1' } }, h('span', { class: 'ergebnis-zahl' }, `${quote} %`), h('span', { class: 'label' }, 'richtig')),
      ),
      h('p', {}, `+${xp} XP (je ${XP_RICHTIG} pro richtiger Antwort, dazu 20 für die Einheit) · Lernzeit ${mmss(sekunden)} · ${tageInFolge} ${tageInFolge === 1 ? 'Tag' : 'Tage'} in Folge`),
      nachher.stufe > vorher.stufe ? h('div', { class: 'merke' }, h('span', { class: 'label' }, 'Neues Level'), `Du bist jetzt ${nachher.name}!`) : null,
    ),
    mitnehmen.length ? h('section', { class: 'stapel' },
      h('h2', {}, 'Das nimmst du mit'),
      h('ul', { class: 'mitnehmen' }, ...mitnehmen.map((q) => h('li', {}, q.karte?.merke ?? q.begruendung)))) : null,
    h('div', { class: 'reihe' },
      h('button', {
        class: 'knopf gelb', type: 'button', style: { flex: '1' },
        onclick: () => { const p = new URLSearchParams(parameter); p.set('t', Date.now()); location.hash = `#/sitzung?${p}`; },
      }, 'Noch eine Einheit'),
      h('a', { class: 'knopf zweit', href: '#/', style: { flex: '1' } }, 'Zur Startseite')),
  );
  seite.querySelector('h1').focus?.();
  window.scrollTo({ top: 0 });
}
