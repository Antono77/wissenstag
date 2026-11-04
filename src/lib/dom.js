// Kleine Helfer, um DOM-Elemente sicher zu bauen (Text wird nie als HTML eingefügt).
export function h(tag, attrs = {}, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'html') el.innerHTML = v; // nur für eigene, feste SVG-Icons
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  anhaengen(el, kinder);
  return el;
}

function anhaengen(el, kinder) {
  for (const k of kinder.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

// Wie replaceChildren, aber null/false werden ignoriert (statt als Text „null“ zu erscheinen)
export function ersetzen(el, ...kinder) {
  el.replaceChildren(...kinder.flat(Infinity).filter((k) => k != null && k !== false));
}

export function leeren(el) {
  while (el.firstChild) el.firstChild.remove();
}

export const bewegungReduziert = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let toastZaehler = 0;
export function toast(text, { aktion, dauer = 3800 } = {}) {
  const bereich = document.getElementById('toasts');
  if (!bereich) return;
  const id = ++toastZaehler;
  const el = h('div', { class: 'toast', 'data-id': id }, h('span', {}, text));
  if (aktion) {
    el.append(h('button', { class: 'knopf gelb', type: 'button', onclick: () => { aktion.fn(); el.remove(); } }, aktion.text));
  }
  bereich.append(el);
  setTimeout(() => el.remove(), dauer);
}

export function datumLesbar(iso, mitZeit = false) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('de-DE', mitZeit
    ? { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'long', year: 'numeric' });
}
