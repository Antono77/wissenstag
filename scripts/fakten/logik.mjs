// Logik & Mathe-Kopfnüsse: Die Aufgaben werden hier berechnet, damit jede Lösung stimmt.
const de = (n) => n.toLocaleString('de-DE');

// Falsche Antworten in der Nähe der richtigen Zahl
function nahe(wert, schritte) {
  return (r, rand) => {
    const res = new Set();
    let i = 0;
    while (res.size < 3 && i < 100) {
      const d = schritte[Math.floor(rand() * schritte.length)] * (rand() < 0.5 ? -1 : 1);
      const k = wert(r) + d;
      if (k !== wert(r) && k >= 0) res.add(de(k));
      i++;
    }
    return [...res];
  };
}

// 1) Einmaleins und Kopfrechnen
const malAufgaben = [];
for (const [a, b] of [[7, 8], [6, 9], [12, 12], [13, 7], [15, 6], [17, 4], [9, 9], [8, 12], [14, 6], [16, 5], [11, 13], [19, 3], [25, 4], [18, 5], [7, 7]]) {
  malAufgaben.push({ aufgabe: `${a} × ${b}`, a, b, s: a * b > 120 ? 2 : 1 });
}

// 2) Prozentrechnung
const prozent = [[10, 250], [25, 80], [50, 64], [20, 150], [5, 300], [75, 40], [15, 200], [30, 90], [12, 50], [40, 35]]
  .map(([p, g]) => ({ aufgabe: `${p} % von ${g}`, p, g, s: [10, 25, 50].includes(p) ? 1 : 2 }));

// 3) Quadratzahlen
const quadrate = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25].map((n) => ({ aufgabe: `${n}²`, n, s: n <= 12 ? 1 : n <= 16 ? 2 : 3 }));

// 4) Primzahlen
const istPrim = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const primzahlen = [23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97].map((p) => ({ aufgabe: `Primzahl ${p}`, p, s: p < 50 ? 2 : 3 }));

// 5) Zahlenfolgen
const folgen = [
  { aufgabe: '2, 4, 8, 16, …', loesung: 32, regel: 'Jede Zahl ist doppelt so groß wie die vorige.' },
  { aufgabe: '3, 6, 9, 12, …', loesung: 15, regel: 'Es kommt jedes Mal 3 dazu.' },
  { aufgabe: '1, 1, 2, 3, 5, 8, …', loesung: 13, regel: 'Jede Zahl ist die Summe der beiden vorigen (Fibonacci-Folge).' },
  { aufgabe: '1, 4, 9, 16, 25, …', loesung: 36, regel: 'Das sind die Quadratzahlen: 1², 2², 3² und so weiter.' },
  { aufgabe: '100, 90, 81, 73, …', loesung: 66, regel: 'Abgezogen werden 10, 9, 8, also als Nächstes 7.' },
  { aufgabe: '2, 3, 5, 7, 11, …', loesung: 13, regel: 'Das sind die Primzahlen.' },
  { aufgabe: '1, 3, 6, 10, 15, …', loesung: 21, regel: 'Es kommen nacheinander 2, 3, 4, 5 und dann 6 dazu.' },
  { aufgabe: '5, 10, 20, 40, …', loesung: 80, regel: 'Jede Zahl wird verdoppelt.' },
  { aufgabe: '81, 27, 9, 3, …', loesung: 1, regel: 'Jede Zahl wird durch 3 geteilt.' },
  { aufgabe: '1, 2, 6, 24, 120, …', loesung: 720, regel: 'Multipliziert wird mit 2, 3, 4, 5 und dann 6 (Fakultät).' },
  { aufgabe: '7, 14, 21, 28, …', loesung: 35, regel: 'Das ist die Siebenerreihe.' },
  { aufgabe: '1, 8, 27, 64, …', loesung: 125, regel: 'Das sind die Kubikzahlen: 1³, 2³, 3³, 4³, 5³.' },
].map((f, i) => ({ ...f, s: i < 3 || i === 7 || i === 10 ? 1 : i < 9 ? 2 : 3 }));

// 6) Römische Zahlen
function roemisch(n) {
  const t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, z] of t) while (n >= v) { s += z; n -= v; }
  return s;
}
const roemer = [4, 9, 14, 19, 40, 49, 90, 99, 444, 1990, 2026, 1492, 1871, 1648, 3999, 1000, 500].map((n) => ({ aufgabe: roemisch(n), n, s: n < 50 ? 1 : n < 1000 ? 2 : 3 }));

// 7) Einheiten umrechnen
const einheiten = [
  { aufgabe: '1 Kilometer in Meter', loesung: 1000, einheit: 'm', s: 1 }, { aufgabe: '1 Liter in Milliliter', loesung: 1000, einheit: 'ml', s: 1 },
  { aufgabe: '1 Stunde in Sekunden', loesung: 3600, einheit: 's', s: 1 }, { aufgabe: '1 Tag in Minuten', loesung: 1440, einheit: 'min', s: 2 },
  { aufgabe: '1 Quadratmeter in Quadratzentimeter', loesung: 10000, einheit: 'cm²', s: 2 }, { aufgabe: '1 Tonne in Kilogramm', loesung: 1000, einheit: 'kg', s: 1 },
  { aufgabe: '1 Hektar in Quadratmeter', loesung: 10000, einheit: 'm²', s: 3 }, { aufgabe: '1 Kubikmeter in Liter', loesung: 1000, einheit: 'l', s: 2 },
  { aufgabe: '1 Woche in Stunden', loesung: 168, einheit: 'h', s: 2 }, { aufgabe: '2,5 Kilogramm in Gramm', loesung: 2500, einheit: 'g', s: 1 },
  { aufgabe: '1 Jahr (kein Schaltjahr) in Tagen', loesung: 365, einheit: 'Tage', s: 1 }, { aufgabe: '90 Minuten in Stunden', loesung: 1.5, einheit: 'h', s: 1 },
];

export default {
  klasse: 'logik',
  tabellen: [
    {
      prefix: 'log-mal', spalten: ['aufgabe'], zeilen: malAufgaben,
      fragen: [{
        frage: (r) => `Wie viel ist ${r.aufgabe}?`,
        richtig: (r) => de(r.a * r.b),
        falsch: (r) => [(r.a + 1) * r.b, r.a * (r.b - 1), r.a * r.b + 10, r.a * r.b - 2].map(de),
        titel: () => 'Kopfrechnen',
        merke: (r) => `${r.aufgabe} = ${de(r.a * r.b)}.`,
        text: (r) => (r.b > 10 ? `Tipp: Zerlege die Aufgabe. ${r.a} × ${r.b} = ${r.a} × 10 + ${r.a} × ${r.b - 10}.` : r.a > 10 ? `Tipp: Zerlege die Aufgabe. ${r.a} × ${r.b} = 10 × ${r.b} + ${r.a - 10} × ${r.b}.` : `Das gehört zum kleinen Einmaleins: ${r.a} × ${r.b} = ${de(r.a * r.b)}.`),
        ddf: () => true,
      }],
    },
    {
      prefix: 'log-pro', spalten: ['aufgabe'], zeilen: prozent,
      fragen: [{
        frage: (r) => `Wie viel sind ${r.aufgabe}?`,
        richtig: (r) => de((r.p * r.g) / 100),
        falsch: (r) => [de((r.p * r.g) / 10), de(r.g - (r.p * r.g) / 100), de(((r.p * r.g) / 100) * 2), de((r.p * r.g) / 100 + 5)],
        titel: () => 'Prozentrechnung',
        merke: (r) => `${r.aufgabe} = ${de((r.p * r.g) / 100)}.`,
        text: (r) => `Rechne ${r.g} ÷ 100 × ${r.p}. Ein Prozent von ${r.g} ist ${de(r.g / 100)}.`,
      }],
    },
    {
      prefix: 'log-qua', spalten: ['aufgabe'], zeilen: quadrate,
      fragen: [{
        frage: (r) => `Wie viel ist ${r.n} × ${r.n}?`,
        richtig: (r) => de(r.n * r.n),
        falsch: (r) => [r.n * (r.n + 1), (r.n - 1) * r.n, r.n * r.n + 10, r.n * 2].map(de),
        titel: () => 'Quadratzahlen',
        merke: (r) => `${r.n}² = ${de(r.n * r.n)}.`,
        text: (r) => `${r.n}² heißt ${r.n} mal ${r.n}. Die Quadratzahlen bis 20² lohnen sich auswendig.`,
      }],
    },
    {
      prefix: 'log-pri', spalten: ['aufgabe'], zeilen: primzahlen,
      fragen: [{
        frage: () => 'Welche dieser Zahlen ist eine Primzahl?',
        richtig: (r) => String(r.p),
        falsch: (r) => {
          const kandidaten = [];
          for (let k = r.p - 12; k <= r.p + 12; k++) if (k > 3 && !istPrim(k) && k % 2 === 1) kandidaten.push(k);
          return kandidaten.sort((x, y) => Math.abs(x - r.p) - Math.abs(y - r.p)).slice(0, 3);
        },
        titel: () => 'Primzahlen',
        merke: (r) => `${r.p} ist eine Primzahl: nur durch 1 und sich selbst teilbar.`,
        text: () => 'Eine Primzahl hat genau zwei Teiler: 1 und sich selbst. Prüfe ungerade Zahlen auf Teilbarkeit durch 3, 7, 11 und 13.',
      }],
    },
    {
      prefix: 'log-fol', spalten: ['aufgabe'], zeilen: folgen,
      fragen: [{
        frage: (r) => `Welche Zahl setzt die Folge fort: ${r.aufgabe}`,
        richtig: (r) => de(r.loesung),
        falsch: nahe((r) => r.loesung, [1, 2, 3, 4, 5, 6]),
        titel: () => 'Zahlenfolgen',
        merke: (r) => `${r.aufgabe.replace('…', de(r.loesung))}. ${r.regel}`,
        begruendung: (r) => r.regel,
        ddf: (r) => r.s === 1,
      }],
    },
    {
      prefix: 'log-rom', spalten: ['aufgabe'], zeilen: roemer,
      fragen: [{
        frage: (r) => `Welche Zahl ist die römische Zahl ${r.aufgabe}?`,
        richtig: (r) => String(r.n),
        falsch: (r) => [r.n + 10, r.n - 1, r.n + 1, r.n + 100, r.n - 10].filter((x) => x > 0).map(String),
        titel: () => 'Römische Zahlen',
        merke: (r) => `${r.aufgabe} = ${r.n}.`,
        text: () => 'I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000. Steht ein kleineres Zeichen vor einem größeren, wird es abgezogen: IV = 4.',
      }],
    },
    {
      prefix: 'log-ein', spalten: ['aufgabe'], zeilen: einheiten,
      fragen: [{
        frage: (r) => `Rechne um: ${r.aufgabe}.`,
        richtig: (r) => `${de(r.loesung)} ${r.einheit}`,
        falsch: (r) => [r.loesung * 10, r.loesung / 10, r.loesung * 100, r.loesung + 60, r.loesung / 2]
          .filter((x) => x !== r.loesung && x > 0).map((x) => `${de(x)} ${r.einheit}`),
        titel: () => 'Einheiten',
        merke: (r) => `${r.aufgabe.split(' in ')[0]} = ${de(r.loesung)} ${r.einheit}.`,
        ddf: (r) => r.s === 1,
      }],
    },
  ],
};

