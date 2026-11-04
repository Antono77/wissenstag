// Kopiert die Flaggen-SVGs aus dem MIT-lizenzierten Paket „flag-icons“ nach public/flags/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quelle = path.join(root, 'node_modules', 'flag-icons', 'flags', '4x3');
const ziel = path.join(root, 'public', 'flags');
fs.mkdirSync(ziel, { recursive: true });
let n = 0;
for (const f of fs.readdirSync(quelle)) {
  if (!f.endsWith('.svg')) continue;
  fs.copyFileSync(path.join(quelle, f), path.join(ziel, f));
  n++;
}
fs.copyFileSync(path.join(root, 'node_modules', 'flag-icons', 'LICENSE'), path.join(ziel, 'LICENSE-flag-icons.txt'));
console.log(`${n} Flaggen nach public/flags kopiert.`);
