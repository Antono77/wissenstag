// Gemeinsame Funktionen für Nachrichten: im Browser und im Skript scripts/fetch-news.mjs.

export const QUELLEN = {
  tagesschau: { name: 'tagesschau', url: 'https://www.tagesschau.de/api2u/news/', seite: 'https://www.tagesschau.de' },
  zdf: { name: 'ZDFheute', url: 'https://www.zdfheute.de/rss/zdf/nachrichten', seite: 'https://www.zdfheute.de' },
  dlf: { name: 'Deutschlandfunk', url: 'https://www.deutschlandfunk.de/nachrichten-100.rss', seite: 'https://www.deutschlandfunk.de' },
};

const RESSORTS = { inland: 'Inland', ausland: 'Ausland', wirtschaft: 'Wirtschaft', wissen: 'Wissen', investigativ: 'Investigativ', sport: 'Sport' };

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', shy: '' };
export function entitaetenLoesen(s) {
  return String(s ?? '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

export function ohneHtml(s) {
  return entitaetenLoesen(String(s ?? '').replace(/<!\[CDATA\[|\]\]>/g, ''))
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function kuerzen(s, max = 320) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const ende = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  return ende > max * 0.5 ? cut.slice(0, ende + 1) : `${cut.slice(0, cut.lastIndexOf(' '))} …`;
}

const hash = (s) => [...String(s)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7).toString(36);

// tagesschau: JSON aus der öffentlichen API
export function ausTagesschau(json) {
  const liste = Array.isArray(json?.news) ? json.news : [];
  return liste
    .filter((n) => n.type === 'story' && RESSORTS[n.ressort] && !(n.regionIds?.length) && n.title)
    .map((n) => {
      const link = n.shareURL || n.detailsweb || QUELLEN.tagesschau.seite;
      return {
        id: `ts-${hash(link)}`,
        quelle: 'tagesschau',
        thema: RESSORTS[n.ressort],
        kontext: n.topline ? ohneHtml(n.topline) : null,
        titel: ohneHtml(n.title),
        text: kuerzen(ohneHtml(n.firstSentence || '')),
        datum: new Date(n.date).toISOString(),
        link,
        stichworte: (n.tags ?? []).map((t) => t.tag).slice(0, 6),
      };
    });
}

function rssItems(xml) {
  const items = [];
  const re = /<item[\s>][\s\S]*?<\/item>/g;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[0];
    const feld = (name) => {
      const r = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`));
      return r ? r[1] : '';
    };
    items.push({ title: feld('title'), link: ohneHtml(feld('link')), description: feld('description'), pubDate: ohneHtml(feld('pubDate')), category: feld('category') });
  }
  return items;
}

const zdfThema = (link) => {
  if (/\/politik\/ausland/.test(link)) return 'Ausland';
  if (/\/politik\/deutschland|\/politik\//.test(link)) return 'Inland';
  if (/\/wirtschaft/.test(link)) return 'Wirtschaft';
  if (/\/wissen/.test(link)) return 'Wissen';
  if (/\/sport/.test(link)) return 'Sport';
  if (/\/kultur/.test(link)) return 'Kultur';
  if (/\/panorama/.test(link)) return 'Panorama';
  return 'Nachrichten';
};

export function ausZdf(xml) {
  return rssItems(xml).filter((i) => i.title && i.link && !/in eigener sache|pressemitteilung/i.test(`${i.category} ${i.title}`)).map((i) => ({
    id: `zdf-${hash(i.link)}`,
    quelle: 'ZDFheute',
    thema: zdfThema(i.link),
    kontext: i.category ? ohneHtml(i.category) : null,
    titel: ohneHtml(i.title),
    text: kuerzen(ohneHtml(i.description)),
    datum: new Date(i.pubDate || Date.now()).toISOString(),
    link: i.link,
    stichworte: [],
  }));
}

export function ausDlf(xml) {
  return rssItems(xml).filter((i) => i.title && i.link).map((i) => {
    const titelRoh = ohneHtml(i.title);
    const teile = titelRoh.split(' - ');
    const kontext = teile.length > 1 ? teile.shift() : null;
    return {
      id: `dlf-${hash(i.link)}`,
      quelle: 'Deutschlandfunk',
      thema: 'Nachrichten',
      kontext,
      titel: teile.join(' - '),
      text: kuerzen(ohneHtml(i.description)),
      datum: new Date(i.pubDate || Date.now()).toISOString(),
      link: i.link,
      stichworte: [],
    };
  });
}

// Zusammenführen: Dubletten entfernen, nur die letzten Tage behalten, neueste zuerst
export function zusammenfuehren(listen, { tage = 7, max = 160, proQuelle = 60, jetzt = Date.now() } = {}) {
  const grenze = jetzt - tage * 86400000;
  const gesehen = new Set();
  const norm = (t) => t.toLowerCase().replace(/[^a-z0-9äöüß]+/g, ' ').trim();
  const alle = listen.flat()
    .filter((m) => m && m.titel && !Number.isNaN(Date.parse(m.datum)) && Date.parse(m.datum) >= grenze && Date.parse(m.datum) <= jetzt + 3600000)
    .sort((a, b) => Date.parse(b.datum) - Date.parse(a.datum));
  const res = [];
  const zaehler = {};
  for (const m of alle) {
    if ((zaehler[m.quelle] ?? 0) >= proQuelle) continue;
    const k1 = m.link;
    const k2 = norm(m.titel);
    if (gesehen.has(k1) || gesehen.has(k2)) continue;
    gesehen.add(k1);
    gesehen.add(k2);
    res.push(m);
    zaehler[m.quelle] = (zaehler[m.quelle] ?? 0) + 1;
    if (res.length >= max) break;
  }
  return res;
}

// News-Quiz: Welche Überschrift passt zum Text?
export function newsQuiz(meldungen, anzahl = 6, rand = Math.random) {
  const geeignet = meldungen.filter((m) => m.text && m.text.length > 60 && m.titel.length < 140);
  const gemischt = geeignet.map((m) => [rand(), m]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const fragen = [];
  for (const m of gemischt) {
    if (fragen.length >= anzahl) break;
    // Text darf die Überschrift nicht wörtlich enthalten
    if (m.text.toLowerCase().includes(m.titel.toLowerCase())) continue;
    const andere = gemischt.filter((x) => x !== m && x.titel !== m.titel).slice(0, 40);
    const falsch = andere.map((x) => [rand(), x.titel]).sort((a, b) => a[0] - b[0]).slice(0, 3).map((x) => x[1]);
    if (falsch.length < 3) break;
    fragen.push({
      id: `news-${m.id}`,
      schwierigkeit: 'mittel',
      frage: `Welche Überschrift gehört zu dieser Meldung? „${m.text}“`,
      richtig: m.titel,
      falsch,
      begruendung: `Die Meldung stammt von ${m.quelle}${m.kontext ? ` (${m.kontext})` : ''}.`,
      karte: { titel: m.titel, text: m.text, merke: m.titel },
      klasse: 'news',
    });
  }
  return fragen;
}
