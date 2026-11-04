// Datumshilfen. Alle Lern-Daten nutzen das lokale Datum als 'YYYY-MM-DD'.
export function heute(d = new Date()) {
  const j = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const t = String(d.getDate()).padStart(2, '0');
  return `${j}-${m}-${t}`;
}

export function plusTage(isoTag, n) {
  const [j, m, t] = isoTag.split('-').map(Number);
  const d = new Date(j, m - 1, t + n);
  return heute(d);
}

export function tageDazwischen(a, b) {
  const [j1, m1, t1] = a.split('-').map(Number);
  const [j2, m2, t2] = b.split('-').map(Number);
  return Math.round((new Date(j2, m2 - 1, t2) - new Date(j1, m1 - 1, t1)) / 86400000);
}

export function letzteTage(n, bis = heute()) {
  const res = [];
  for (let i = n - 1; i >= 0; i--) res.push(plusTage(bis, -i));
  return res;
}

export const wochentagKurz = (isoTag) => {
  const [j, m, t] = isoTag.split('-').map(Number);
  return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(j, m - 1, t).getDay()];
};
