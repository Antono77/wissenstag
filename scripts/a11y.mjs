// Prüft die wichtigsten Ansichten automatisch auf Barrierefreiheit (axe-core).
// Aufruf: npm run dev, dann npm run a11y
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASIS = process.env.URL ?? 'http://localhost:5173/';
const seiten = ['#/', '#/lernen', '#/lernen/geografie', '#/sitzung?modus=klasse&klasse=logik&art=fragen&wert=3', '#/duemmste', '#/aktuell', '#/fortschritt'];
const browser = await chromium.launch();
let probleme = 0;
for (const schema of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: schema });
  const page = await ctx.newPage();
  for (const s of seiten) {
    await page.goto(BASIS + s);
    await page.locator('h1, .frage-text, .wissenskarte').first().waitFor();
    await page.waitForTimeout(800);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    for (const v of r.violations) {
      probleme++;
      console.log(`[${schema}] ${s}: ${v.id} (${v.impact}) ${v.help}`);
      for (const n of v.nodes.slice(0, 3)) console.log('    ', n.target.join(' '), n.failureSummary?.split('\n')[1] ?? '');
    }
  }
  await ctx.close();
}
await browser.close();
console.log(probleme ? `${probleme} Probleme gefunden` : 'Keine Verstöße gefunden.');
process.exit(probleme ? 1 : 0);
