export function mischen(liste, rand = Math.random) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ziehen(liste, n, rand = Math.random) {
  return mischen(liste, rand).slice(0, n);
}
