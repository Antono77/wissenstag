// Zeigt eine Quizfrage mit vier Antworten (A bis D) oder Freitext-Eingabe,
// prüft die Antwort und blendet die Begründung ein. Tastatur: 1 bis 4 oder A bis D, Enter = weiter.
import { h, bewegungReduziert } from './dom.js';
import { flaggeUrl } from './daten.js';
import { mischen } from './zufall.js';
import { passtFreitext } from './text.js';

const BUCHSTABEN = ['A', 'B', 'C', 'D'];

export function zeigeFrage(ziel, q, opts = {}) {
  const {
    kopf = null,
    freitext = false,
    zeitlimit = 0,
    onAntwort = () => {},
    onWeiter = () => {},
    weiterText = 'Weiter',
    zusatzNachAntwort = null,
  } = opts;

  let beantwortet = false;
  let timer = null;
  let raf = null;

  const optionen = mischen([q.richtig, ...q.falsch]);
  const istFlagge = q.antwortTyp === 'flagge';

  const titelId = `frage-${q.id}`;
  const frageEl = h('h2', { class: 'frage-text', id: titelId, tabindex: '-1' }, q.frage);
  const bild = q.bild?.typ === 'flagge'
    ? h('div', { class: 'frage-bild' }, h('img', { class: 'flagge-gross', src: flaggeUrl(q.bild.code), alt: 'Gesuchte Flagge', width: 240, height: 180 }))
    : null;

  const zeitbalken = zeitlimit > 0 ? h('div', { class: 'zeitbalken', role: 'timer', 'aria-label': `${zeitlimit} Sekunden Zeit` }, h('span')) : null;

  const knoepfe = [];
  let antwortBereich;
  let eingabe = null;

  if (freitext) {
    eingabe = h('input', {
      class: 'eingabe', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
      'aria-labelledby': titelId, placeholder: 'Deine Antwort',
    });
    const pruefen = h('button', { class: 'knopf', type: 'submit' }, 'Prüfen');
    antwortBereich = h('form', {
      class: 'stapel',
      onsubmit: (e) => { e.preventDefault(); if (!beantwortet) pruefeFreitext(); },
    }, eingabe, pruefen);
  } else {
    antwortBereich = h('div', { class: `antworten${istFlagge ? ' flaggen' : ''}`, role: 'group', 'aria-labelledby': titelId });
    optionen.forEach((opt, i) => {
      const inhalt = istFlagge
        ? h('img', { src: flaggeUrl(opt), alt: `Flagge ${BUCHSTABEN[i]}`, loading: 'eager', width: 160, height: 120 })
        : h('span', {}, opt);
      const k = h('button', {
        class: `antwort${istFlagge ? ' antwort-flagge' : ''}`, type: 'button', 'data-wert': opt,
        onclick: () => waehle(i),
      }, h('span', { class: 'taste', 'aria-hidden': 'true' }, BUCHSTABEN[i]), inhalt, istFlagge ? null : h('span', { class: 'zeichen', 'aria-hidden': 'true' }));
      knoepfe.push(k);
      antwortBereich.append(k);
    });
  }

  const feedbackBereich = h('div', { 'aria-live': 'polite' });
  const hinweis = h('p', { class: 'tastenhinweis' }, freitext ? 'Enter zum Prüfen' : 'Tasten 1 bis 4 oder A bis D wählen eine Antwort');

  const wurzel = h('section', { class: 'stapel ansicht-rein', 'aria-labelledby': titelId },
    kopf, zeitbalken, frageEl, bild, antwortBereich, hinweis, feedbackBereich);
  ziel.append(wurzel);
  (eingabe ?? frageEl).focus({ preventScroll: true });

  if (zeitlimit > 0) starteTimer();

  function starteTimer() {
    const start = performance.now();
    const balken = zeitbalken.firstChild;
    const tick = (jetzt) => {
      const rest = Math.max(0, 1 - (jetzt - start) / (zeitlimit * 1000));
      balken.style.transform = `scaleX(${rest})`;
      zeitbalken.classList.toggle('knapp', rest < 0.3);
      if (rest > 0 && !beantwortet) raf = requestAnimationFrame(tick);
    };
    if (!bewegungReduziert()) raf = requestAnimationFrame(tick);
    else balken.style.transform = 'scaleX(1)';
    timer = setTimeout(() => { if (!beantwortet) abschliessen(false, null, true); }, zeitlimit * 1000);
  }

  function waehle(i) {
    if (beantwortet) return;
    const wert = optionen[i];
    abschliessen(wert === q.richtig, i);
  }

  function pruefeFreitext() {
    const wert = eingabe.value;
    if (!wert.trim()) { eingabe.focus(); return; }
    abschliessen(passtFreitext(wert, q.richtig, q.alias ?? []), null, false, wert);
  }

  function abschliessen(richtig, index, zeitAus = false, text = null) {
    beantwortet = true;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    hinweis.remove();

    if (!freitext) {
      knoepfe.forEach((k, i) => {
        k.disabled = true;
        const istRichtig = optionen[i] === q.richtig;
        if (istRichtig) { k.classList.add('richtig'); setZeichen(k, '✓'); }
        else if (i === index) { k.classList.add('falsch'); setZeichen(k, '✗'); }
        else k.classList.add('gedimmt');
        if (istFlagge && q.namen) {
          const name = q.namen[optionen[i]];
          if (name) {
            k.querySelector('img').alt = `Flagge von ${name}`;
            k.append(h('span', { style: { gridColumn: '1 / -1', fontSize: '0.85rem' } }, name));
          }
        }
      });
    } else {
      eingabe.disabled = true;
      antwortBereich.querySelector('button').disabled = true;
    }

    const richtigText = istFlagge ? (q.namen?.[q.richtig] ?? 'die markierte Flagge') : q.richtig;
    const titel = zeitAus ? 'Zeit abgelaufen' : richtig ? 'Richtig!' : 'Leider falsch';
    const fb = h('div', { class: `feedback ${richtig ? 'ok' : 'nein'}` },
      h('p', { class: 'feedback-titel' }, titel),
      text != null && !richtig ? h('p', {}, `Deine Antwort: „${text}“`) : null,
      h('p', {}, h('strong', {}, `Richtig: ${richtigText}. `), q.begruendung),
      q.karte?.merke && q.karte.merke !== q.begruendung ? h('div', { class: 'merke' }, h('span', { class: 'label' }, 'Merke'), q.karte.merke) : null,
      q.stand ? h('p', { class: 'label' }, `Stand: ${standLesbar(q.stand)}`) : null,
    );
    feedbackBereich.append(fb);
    if (zusatzNachAntwort) {
      const z = zusatzNachAntwort(richtig);
      if (z) feedbackBereich.append(z);
    }
    const weiter = h('button', { class: 'knopf gross', type: 'button', onclick: () => weiterGehen() }, weiterText);
    feedbackBereich.append(h('div', { class: 'weiter-zeile' }, weiter));
    weiter.focus({ preventScroll: true });
    fb.scrollIntoView({ block: 'nearest', behavior: bewegungReduziert() ? 'auto' : 'smooth' });
    onAntwort(richtig, { zeitAus, text });
  }

  let weg = false;
  function weiterGehen() {
    if (weg) return;
    weg = true;
    aufraeumen();
    onWeiter();
  }

  function setZeichen(k, z) {
    const el = k.querySelector('.zeichen');
    if (el) el.textContent = z;
  }

  function tasten(e) {
    if (e.target instanceof HTMLInputElement && !beantwortet) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (!beantwortet && !freitext) {
      const k = e.key.toLowerCase();
      const idx = ['1', '2', '3', '4'].indexOf(k) >= 0 ? ['1', '2', '3', '4'].indexOf(k) : ['a', 'b', 'c', 'd'].indexOf(k);
      if (idx >= 0 && idx < optionen.length) { e.preventDefault(); waehle(idx); }
    } else if (beantwortet && (e.key === 'Enter' || e.key === ' ')) {
      if (document.activeElement?.tagName === 'BUTTON' && document.activeElement.textContent !== weiterText) return;
      e.preventDefault();
      weiterGehen();
    }
  }
  document.addEventListener('keydown', tasten);

  function aufraeumen() {
    document.removeEventListener('keydown', tasten);
    clearTimeout(timer);
    cancelAnimationFrame(raf);
  }

  return { zerstoeren: aufraeumen, element: wurzel };
}

export function standLesbar(stand) {
  const [j, m] = String(stand).split('-');
  if (!m) return j;
  const monate = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  return `${monate[Number(m) - 1]} ${j}`;
}

// Wissenskarte für neue Fragen
export function zeigeKarte(ziel, q, { klassenName, onWeiter }) {
  const titelId = `karte-${q.id}`;
  const weiter = h('button', { class: 'knopf gross', type: 'button', onclick: () => fertig() }, 'Zur Frage');
  const el = h('article', { class: 'karte wissenskarte ansicht-rein', 'aria-labelledby': titelId },
    h('div', { class: 'zwischen' }, h('span', { class: 'label' }, klassenName), h('span', { class: 'chip gelb' }, 'Neu')),
    q.karte.bild?.typ === 'flagge' ? h('img', { class: 'flagge-gross', style: { width: '140px' }, src: flaggeUrl(q.karte.bild.code), alt: `Flagge: ${q.karte.titel}` }) : null,
    h('h2', { id: titelId, tabindex: '-1' }, q.karte.titel),
    h('p', {}, q.karte.text),
    h('div', { class: 'merke' }, h('span', { class: 'label' }, 'Merke'), q.karte.merke),
    q.stand ? h('p', { class: 'label' }, `Stand: ${standLesbar(q.stand)}`) : null,
  );
  ziel.append(el, h('div', { class: 'weiter-zeile' }, weiter));
  el.querySelector('h2').focus({ preventScroll: true });
  const tasten = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fertig(); }
  };
  document.addEventListener('keydown', tasten);
  let weg = false;
  function fertig() {
    if (weg) return;
    weg = true;
    document.removeEventListener('keydown', tasten);
    onWeiter();
  }
  return { zerstoeren: () => document.removeEventListener('keydown', tasten) };
}
