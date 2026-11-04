// Tolerante Prüfung von Freitext-Antworten:
// Groß- und Kleinschreibung, Akzente, Artikel und kleine Tippfehler sind egal.

export function normalisiere(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[„“"'’`´().,;:!?¿¡]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b(der|die|das|den|dem|des|ein|eine|einen|the|le|la|im|in|am|an|auf|aus|nach)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let vorher = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const jetzt = [i];
    for (let j = 1; j <= b.length; j++) {
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
      jetzt[j] = Math.min(vorher[j] + 1, jetzt[j - 1] + 1, vorher[j - 1] + kosten);
    }
    vorher = jetzt;
  }
  return vorher[b.length];
}

const erlaubteFehler = (laenge) => (laenge <= 3 ? 0 : laenge <= 6 ? 1 : laenge <= 12 ? 2 : 3);

// Prüft eine Eingabe gegen die richtige Antwort und ihre Alternativen
export function passtFreitext(eingabe, richtig, alias = []) {
  const e = normalisiere(eingabe);
  if (!e) return false;
  for (const ziel of [richtig, ...alias]) {
    const z = normalisiere(ziel);
    if (!z) continue;
    if (e === z) return true;
    // Zahlen müssen exakt stimmen
    if (/^\d+$/.test(e.replace(/\s/g, '')) || /^\d+$/.test(z.replace(/\s/g, ''))) {
      if (e.replace(/\s/g, '') === z.replace(/\s/g, '')) return true;
      continue;
    }
    if (levenshtein(e, z) <= erlaubteFehler(z.length)) return true;
    // Ohne Leerzeichen vergleichen („New York“ = „Newyork“)
    if (e.replace(/\s/g, '') === z.replace(/\s/g, '')) return true;
  }
  return false;
}

// Eignet sich eine Frage für Freitext? Nur kurze Antworten, keine Auswahlfragen.
export function freitextTauglich(q) {
  if (q.antwortTyp === 'flagge') return false;
  if (String(q.richtig).length > 28) return false;
  if (/\b(dieser|diesen|folgende[nrs]?)\b/i.test(q.frage)) return false;
  if (/,/.test(q.richtig) && !(q.alias?.length)) return false;
  return true;
}
