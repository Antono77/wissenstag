// Erzeugt die App-Icons (PNG) aus public/icons/icon.svg. Aufruf: node scripts/make-icons.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
const svg = fs.readFileSync('public/icons/icon.svg', 'utf8');
const b = await chromium.launch();
for (const [name, size, rund] of [['icon-192.png', 192, true], ['icon-512.png', 512, true], ['icon-maskable-512.png', 512, false], ['apple-touch-icon.png', 180, false]]) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `).replace('<rect width="512" height="512"', rund ? '<rect width="512" height="512" rx="110"' : '<rect width="512" height="512"')}</body></html>`);
  await p.screenshot({ path: `public/icons/${name}`, omitBackground: true });
  await p.close();
}
await b.close();
console.log('Icons erstellt');
