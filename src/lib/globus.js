// Globus und Weltkarte auf einem <canvas>, gezeichnet mit d3-geo.
// Drehen: ziehen (Maus/Finger) oder Pfeiltasten. Zoomen: Mausrad, zwei Finger, + und −.
// Antippen: ruft onKlick({ pos: [Länge, Breite], code }) auf. Mit der Tastatur: Enter tippt auf die Mitte (Fadenkreuz).
import { geoOrthographic, geoEqualEarth, geoPath, geoGraticule10, geoContains, geoDistance, geoInterpolate, geoBounds, geoArea } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import { h, bewegungReduziert } from './dom.js';

const MIN_ZOOM = 1;
const MAX_ZOOM = 14;
const klemme = (x, a, b) => Math.max(a, Math.min(b, x));

function farben(el) {
  const s = getComputedStyle(el);
  const v = (n) => s.getPropertyValue(n).trim();
  return {
    meer: v('--atlas-meer'), land: v('--atlas-land'), tint: v('--atlas-tint'), grenze: v('--atlas-grenze'),
    netz: v('--atlas-netz'), markiert: v('--gelb'), richtig: v('--richtig'), falsch: v('--falsch'),
    text: v('--text'), halo: v('--atlas-halo'), petrol: v('--petrol'),
  };
}

export function erstelleGlobus(container, { welt, ansicht = 'globus', onKlick = null, beschreibung = 'Globus' } = {}) {
  const laenderFormen = feature(welt, welt.objects.countries).features;
  const formNachCode = new Map();
  for (const f of laenderFormen) {
    if (!f.id) continue;
    const liste = formNachCode.get(f.id) ?? [];
    liste.push(f);
    formNachCode.set(f.id, liste);
  }
  const grenzen = mesh(welt, welt.objects.countries, (a, b) => a !== b);
  const kuesten = mesh(welt, welt.objects.countries, (a, b) => a === b);
  const netz = geoGraticule10();
  const kugel = { type: 'Sphere' };
  const schachteln = laenderFormen.map((f) => ({ f, b: geoBounds(f) }));

  // --- Zustand ---
  let modus = ansicht; // 'globus' | 'karte'
  let mitte = [10, 30]; // [Länge, Breite] in der Bildmitte
  let zoom = 1;
  let breite = 0, hoehe = 0, dpr = 1;
  let inhalt = { laender: {}, kontinentCodes: null, punkte: [], linien: [], beschriftungen: [] };
  let fadenkreuz = false;
  let animation = null;
  let gezeichnetGeplant = false;
  let farb = null;

  // --- DOM ---
  const canvas = h('canvas', { class: 'globus-canvas', tabindex: '0', role: 'img', 'aria-label': beschreibung });
  const knopf = (text, label, fn) => h('button', { class: 'icon-knopf globus-knopf', type: 'button', 'aria-label': label, title: label, onclick: fn }, text);
  const ansichtKnopf = h('button', { class: 'knopf zweit globus-ansicht', type: 'button', onclick: () => setzeAnsicht(modus === 'globus' ? 'karte' : 'globus') });
  const steuerung = h('div', { class: 'globus-steuerung' },
    knopf('+', 'Hineinzoomen', () => zoomeAuf(zoom * 1.5)),
    knopf('−', 'Herauszoomen', () => zoomeAuf(zoom / 1.5)),
  );
  const huelle = h('div', { class: 'globus' }, canvas, steuerung, h('div', { class: 'globus-unten' }, ansichtKnopf));
  container.append(huelle);
  const ctx = canvas.getContext('2d');

  function ansichtKnopfText() {
    ansichtKnopf.textContent = modus === 'globus' ? 'Als Karte zeigen' : 'Als Globus zeigen';
  }
  ansichtKnopfText();

  // --- Projektion ---
  let projektion;
  function baueProjektion() {
    if (modus === 'globus') {
      const r = Math.min(breite, hoehe) / 2 - 6;
      projektion = geoOrthographic().clipAngle(90).precision(0.4)
        .translate([breite / 2, hoehe / 2]).scale(r * zoom).rotate([-mitte[0], -mitte[1]]);
    } else {
      const p = geoEqualEarth().precision(0.4).rotate([-mitte[0], 0]).fitSize([breite, hoehe], kugel);
      p.scale(p.scale() * zoom);
      p.translate([breite / 2, hoehe / 2]);
      const y = p([mitte[0], mitte[1]])?.[1] ?? hoehe / 2;
      p.translate([breite / 2, hoehe / 2 + (hoehe / 2 - y)]);
      // Nicht über den Kartenrand hinaus schieben: Die Karte füllt das Bild immer von oben bis unten
      const [[, oben], [, unten]] = geoPath(p).bounds(kugel);
      let dy = 0;
      if (unten - oben <= hoehe) dy = hoehe / 2 - (oben + unten) / 2;
      else if (oben > 0) dy = -oben;
      else if (unten < hoehe) dy = hoehe - unten;
      if (dy) {
        const [tx, ty] = p.translate();
        p.translate([tx, ty + dy]);
        const neu = p.invert([breite / 2, hoehe / 2]);
        if (neu && Number.isFinite(neu[1])) mitte = [mitte[0], neu[1]];
      }
      projektion = p;
    }
  }

  function groesse() {
    const b = Math.round(huelle.clientWidth);
    if (!b) return;
    breite = b;
    hoehe = modus === 'globus' ? Math.round(Math.min(b, 560)) : Math.round(Math.min(b * 0.56, 560));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = breite * dpr;
    canvas.height = hoehe * dpr;
    canvas.style.height = `${hoehe}px`;
    zeichnen();
  }

  const sichtbar = (pos) => modus === 'karte' || geoDistance(pos, mitte) < Math.PI / 2 - 0.02;

  // --- Zeichnen ---
  function zeichnen() {
    if (gezeichnetGeplant) return;
    gezeichnetGeplant = true;
    requestAnimationFrame(() => { gezeichnetGeplant = false; jetztZeichnen(); });
  }

  function jetztZeichnen() {
    if (!breite) return;
    farb ??= farben(huelle);
    baueProjektion();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, breite, hoehe);
    const pfad = geoPath(projektion, ctx);

    ctx.beginPath(); pfad(kugel); ctx.fillStyle = farb.meer; ctx.fill();
    ctx.beginPath(); pfad(netz); ctx.strokeStyle = farb.netz; ctx.lineWidth = 0.6; ctx.stroke();

    // Landflächen
    ctx.beginPath();
    for (const f of laenderFormen) pfad(f);
    ctx.fillStyle = farb.land; ctx.fill();

    // Kontinent leicht einfärben (Tipp für Anfänger)
    if (inhalt.kontinentCodes) {
      ctx.beginPath();
      for (const code of inhalt.kontinentCodes) for (const f of formNachCode.get(code) ?? []) pfad(f);
      ctx.fillStyle = farb.tint; ctx.fill();
    }

    // Markierte Länder
    for (const [code, art] of Object.entries(inhalt.laender)) {
      ctx.beginPath();
      for (const f of formNachCode.get(code) ?? []) pfad(f);
      ctx.fillStyle = farb[art] ?? farb.markiert; ctx.fill();
    }

    ctx.beginPath(); pfad(grenzen); ctx.strokeStyle = farb.grenze; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.beginPath(); pfad(kuesten); ctx.strokeStyle = farb.grenze; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.beginPath(); pfad(kugel); ctx.strokeStyle = farb.grenze; ctx.lineWidth = 1; ctx.stroke();

    // Verbindungslinien (z. B. vom Tipp zum richtigen Ort)
    for (const l of inhalt.linien) {
      ctx.beginPath(); pfad({ type: 'LineString', coordinates: [l.von, l.nach] });
      ctx.setLineDash([6, 5]); ctx.strokeStyle = farb.text; ctx.lineWidth = 1.6; ctx.stroke(); ctx.setLineDash([]);
    }

    // Punkte: Städte, Ringe um Kleinstaaten, Tipps
    for (const p of inhalt.punkte) {
      if (!sichtbar(p.pos)) continue;
      const xy = projektion(p.pos);
      if (!xy) continue;
      const farbe = farb[p.farbe] ?? farb.petrol;
      if (p.art === 'ring') {
        ctx.beginPath(); ctx.arc(xy[0], xy[1], p.r ?? 11, 0, 2 * Math.PI);
        ctx.lineWidth = 3; ctx.strokeStyle = farb.halo; ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = farbe; ctx.stroke();
      } else if (p.art === 'kreuz') {
        const r = 7;
        ctx.lineWidth = 4; ctx.strokeStyle = farb.halo;
        ctx.beginPath(); ctx.moveTo(xy[0] - r, xy[1] - r); ctx.lineTo(xy[0] + r, xy[1] + r); ctx.moveTo(xy[0] + r, xy[1] - r); ctx.lineTo(xy[0] - r, xy[1] + r); ctx.stroke();
        ctx.lineWidth = 2.2; ctx.strokeStyle = farbe; ctx.stroke();
      } else {
        const r = p.r ?? 4.5;
        ctx.beginPath(); ctx.arc(xy[0], xy[1], r + 1.5, 0, 2 * Math.PI); ctx.fillStyle = farb.halo; ctx.fill();
        ctx.beginPath(); ctx.arc(xy[0], xy[1], r, 0, 2 * Math.PI); ctx.fillStyle = farbe; ctx.fill();
      }
    }

    // Beschriftungen, ohne Überlappung (wichtige zuerst)
    if (inhalt.beschriftungen.length) {
      ctx.font = '600 12px "Figtree Variable", Figtree, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      const belegt = [];
      for (const b of inhalt.beschriftungen) {
        if (!sichtbar(b.pos)) continue;
        const xy = projektion(b.pos);
        if (!xy) continue;
        const y = xy[1] + (b.versatz ?? 0);
        const w = ctx.measureText(b.text).width + 6;
        const box = [xy[0] - w / 2, y - 8, xy[0] + w / 2, y + 8];
        if (box[0] < 0 || box[2] > breite || box[1] < 0 || box[3] > hoehe) continue;
        if (belegt.some((o) => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) continue;
        belegt.push(box);
        ctx.lineWidth = 3.5; ctx.strokeStyle = farb.halo; ctx.strokeText(b.text, xy[0], y);
        ctx.fillStyle = farb.text; ctx.fillText(b.text, xy[0], y);
      }
    }

    // Fadenkreuz für die Bedienung mit der Tastatur
    if (fadenkreuz) {
      const [x, y] = [breite / 2, hoehe / 2];
      ctx.lineWidth = 2; ctx.strokeStyle = farb.text;
      ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x - 4, y); ctx.moveTo(x + 4, y); ctx.lineTo(x + 14, y);
      ctx.moveTo(x, y - 14); ctx.lineTo(x, y - 4); ctx.moveTo(x, y + 4); ctx.lineTo(x, y + 14); ctx.stroke();
    }
  }

  // --- Treffer: Bildschirmpunkt → Ort und Land ---
  function ortAn(x, y) {
    baueProjektion();
    if (modus === 'globus') {
      const r = projektion.scale();
      if (Math.hypot(x - breite / 2, y - hoehe / 2) > r) return null; // neben die Kugel getippt
    }
    const pos = projektion.invert([x, y]);
    if (!pos || !Number.isFinite(pos[0]) || !Number.isFinite(pos[1])) return null;
    const zurueck = projektion(pos);
    if (!zurueck || Math.hypot(zurueck[0] - x, zurueck[1] - y) > 2) return null; // außerhalb der Karte
    return pos;
  }

  function landAn(pos) {
    for (const { f, b } of schachteln) {
      if (!f.id) continue;
      const [[w, s], [o, n]] = b;
      if (pos[1] < s - 0.5 || pos[1] > n + 0.5) continue;
      const imLaengenbereich = w <= o ? pos[0] >= w - 0.5 && pos[0] <= o + 0.5 : pos[0] >= w - 0.5 || pos[0] <= o + 0.5;
      if (!imLaengenbereich) continue;
      if (geoContains(f, pos)) return f.id;
    }
    return null;
  }

  function tippe(x, y) {
    const pos = ortAn(x, y);
    if (!pos || !onKlick) return;
    onKlick({ pos, code: landAn(pos) });
  }

  // --- Bewegung ---
  function verschiebe(dx, dy) {
    baueProjektion();
    const grad = 180 / (Math.PI * projektion.scale());
    mitte = [((mitte[0] - dx * grad + 540) % 360) - 180, klemme(mitte[1] + dy * grad, -80, 80)];
    zeichnen();
  }

  function zoomeAuf(z) {
    stoppeAnimation();
    zoom = klemme(z, MIN_ZOOM, MAX_ZOOM);
    zeichnen();
  }

  function stoppeAnimation() {
    if (animation) cancelAnimationFrame(animation);
    animation = null;
  }

  function fliegeZu(pos, zielZoom = zoom, dauer = 900) {
    stoppeAnimation();
    zielZoom = klemme(zielZoom, MIN_ZOOM, MAX_ZOOM);
    if (bewegungReduziert() || dauer === 0) {
      mitte = [pos[0], klemme(pos[1], -80, 80)];
      zoom = zielZoom;
      zeichnen();
      return;
    }
    const start = performance.now();
    const weg = geoInterpolate(mitte, [pos[0], klemme(pos[1], -80, 80)]);
    const z0 = zoom;
    // Bei weiten Wegen kurz herauszoomen, damit man sieht, wohin es geht
    const bogen = geoDistance(mitte, pos) > 1 ? 0.35 : 0;
    const schritt = (jetzt) => {
      const t = Math.min(1, (jetzt - start) / dauer);
      const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      mitte = weg(e);
      const zLinear = z0 + (zielZoom - z0) * e;
      zoom = Math.max(MIN_ZOOM, zLinear * (1 - bogen * Math.sin(Math.PI * e)));
      jetztZeichnen();
      animation = t < 1 ? requestAnimationFrame(schritt) : null;
    };
    animation = requestAnimationFrame(schritt);
  }

  function setzeAnsicht(neu) {
    modus = neu;
    ansichtKnopfText();
    groesse();
  }

  // --- Zeiger (Maus, Finger, Stift) ---
  const zeiger = new Map();
  let startAbstand = 0, startZoom = 1, bewegt = 0;
  canvas.addEventListener('pointerdown', (e) => {
    stoppeAnimation();
    canvas.setPointerCapture(e.pointerId);
    zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (zeiger.size === 1) bewegt = 0;
    if (zeiger.size === 2) {
      const [a, b] = [...zeiger.values()];
      startAbstand = Math.hypot(a.x - b.x, a.y - b.y);
      startZoom = zoom;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const alt = zeiger.get(e.pointerId);
    if (!alt) return;
    const neu = { x: e.clientX, y: e.clientY };
    zeiger.set(e.pointerId, neu);
    if (zeiger.size === 1) {
      bewegt += Math.abs(neu.x - alt.x) + Math.abs(neu.y - alt.y);
      if (bewegt > 4) verschiebe(neu.x - alt.x, neu.y - alt.y);
    } else if (zeiger.size === 2) {
      bewegt = 99;
      const [a, b] = [...zeiger.values()];
      zoom = klemme(startZoom * (Math.hypot(a.x - b.x, a.y - b.y) / (startAbstand || 1)), MIN_ZOOM, MAX_ZOOM);
      zeichnen();
    }
  });
  const ende = (e) => {
    if (!zeiger.has(e.pointerId)) return;
    const war = zeiger.size;
    zeiger.delete(e.pointerId);
    if (e.type === 'pointerup' && war === 1 && bewegt <= 6) {
      const r = canvas.getBoundingClientRect();
      tippe(e.clientX - r.left, e.clientY - r.top);
    }
  };
  canvas.addEventListener('pointerup', ende);
  canvas.addEventListener('pointercancel', ende);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomeAuf(zoom * Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });

  // --- Tastatur ---
  canvas.addEventListener('focus', () => { fadenkreuz = canvas.matches(':focus-visible'); zeichnen(); });
  canvas.addEventListener('blur', () => { fadenkreuz = false; zeichnen(); });
  canvas.addEventListener('keydown', (e) => {
    const s = 40;
    const tasten = {
      ArrowLeft: () => verschiebe(s, 0), ArrowRight: () => verschiebe(-s, 0),
      ArrowUp: () => verschiebe(0, s), ArrowDown: () => verschiebe(0, -s),
      '+': () => zoomeAuf(zoom * 1.4), '=': () => zoomeAuf(zoom * 1.4), '-': () => zoomeAuf(zoom / 1.4),
      Enter: () => tippe(breite / 2, hoehe / 2), ' ': () => tippe(breite / 2, hoehe / 2),
    };
    const fn = tasten[e.key];
    if (!fn) return;
    e.preventDefault();
    e.stopPropagation();
    fadenkreuz = true;
    fn();
  });

  // --- Größe und Farbschema beobachten ---
  const ro = new ResizeObserver(() => groesse());
  ro.observe(huelle);
  const themaNeu = () => { farb = null; zeichnen(); };
  const mo = new MutationObserver(themaNeu);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', themaNeu);
  groesse();

  return {
    element: huelle,
    canvas,
    // inhalt: { laender: { code: 'markiert'|'richtig'|'falsch' }, kontinentCodes: [...]|null, punkte: [...], linien: [...], beschriftungen: [...] }
    setze(neu) { inhalt = { laender: {}, kontinentCodes: null, punkte: [], linien: [], beschriftungen: [], ...neu }; zeichnen(); },
    fliegeZu,
    beschreibe(text) { canvas.setAttribute('aria-label', text); },
    // Zoom, bei dem das Hauptgebiet eines Landes gut ins Bild passt
    zoomFuerLand(code, fallback = 5) {
      const fs = formNachCode.get(code);
      if (!fs) return fallback;
      let best = null, bestA = -1;
      for (const f of fs) {
        const teile = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
        for (const c of teile) {
          const t = { type: 'Polygon', coordinates: c };
          const a = geoArea(t);
          if (a > bestA) { bestA = a; best = t; }
        }
      }
      const [[w, s], [o, n]] = geoBounds(best);
      const breiteGrad = (o >= w ? o - w : o + 360 - w) * Math.cos(((s + n) / 2) * Math.PI / 180);
      const spanne = Math.max(n - s, breiteGrad, 0.5);
      const faktor = modus === 'globus' ? 40 : 70;
      return klemme(faktor / spanne, MIN_ZOOM, 9);
    },
    zoom: () => zoom,
    zerstoeren() {
      stoppeAnimation();
      ro.disconnect();
      mo.disconnect();
      mq.removeEventListener('change', themaNeu);
    },
  };
}
