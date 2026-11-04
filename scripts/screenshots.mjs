// Klickt sich mit Playwright durch alle Bereiche und speichert Screenshots
// (Handy und Desktop, hell und dunkel). Meldet Fehler aus der Browser-Konsole.
// Aufruf: zuerst „npm run dev“, dann in einem zweiten Fenster „npm run screenshots“.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASIS = process.env.URL ?? 'http://localhost:5173/';
const ORDNER = path.resolve('screenshots');
fs.mkdirSync(ORDNER, { recursive: true });

const geraete = [
  { name: 'handy', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 'desktop', viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 },
];
const schemata = ['light', 'dark'];
const fehler = [];

const browser = await chromium.launch();
for (const g of geraete) {
  for (const schema of schemata) {
    const ctx = await browser.newContext({ ...g, colorScheme: schema, locale: 'de-DE' });
    const page = await ctx.newPage();
    const tag = `${g.name}-${schema === 'light' ? 'hell' : 'dunkel'}`;
    page.on('console', (m) => { if (m.type() === 'error') fehler.push(`[${tag}] Konsole: ${m.text()}`); });
    page.on('pageerror', (e) => fehler.push(`[${tag}] Seitenfehler: ${e.message}`));
    const foto = async (name, ganz = true) => {
      const text = await page.evaluate(() => document.body.innerText);
      const m = text.match(/\b(null|undefined|NaN)\b|\[object Object\]/);
      if (m) fehler.push(`[${tag}] ${name}: Text enthält „${m[0]}“`);
      await page.screenshot({ path: path.join(ORDNER, `${tag}-${name}.png`), fullPage: ganz });
    };
    const warte = (ms = 400) => page.waitForTimeout(ms);

    // Start
    await page.goto(BASIS);
    await page.getByRole('heading', { level: 1 }).waitFor();
    await warte(600);
    await foto('01-start');

    // Lernen: Übersicht und Klasse
    await page.goto(`${BASIS}#/lernen`);
    await page.locator('.klasse-kachel').first().waitFor();
    await warte();
    await foto('02-lernen');
    await page.goto(`${BASIS}#/lernen/flaggen`);
    await page.getByRole('heading', { level: 1, name: 'Flaggen' }).waitFor();
    await foto('03-klasse');

    // Lerneinheit mit 5 Fragen: Karte, Frage, Feedback
    await page.goto(`${BASIS}#/sitzung?modus=klasse&klasse=geografie&art=fragen&wert=5`);
    await page.locator('.wissenskarte, .antworten').first().waitFor();
    await warte();
    await foto('04-wissenskarte', false);
    for (let i = 0; i < 12; i++) {
      if (await page.locator('.wissenskarte').count()) { await page.keyboard.press('Enter'); await warte(250); }
      if (await page.locator('.antworten').count()) {
        // Erste Frage absichtlich per Taste 1, sonst richtig klicken
        const knoepfe = page.locator('.antwort');
        await knoepfe.first().waitFor();
        if (i === 0) await page.keyboard.press('1');
        else {
          const n = await knoepfe.count();
          await knoepfe.nth(Math.floor(Math.random() * n)).click();
        }
        await warte(300);
        if (i < 2) await foto(`05-feedback-${i + 1}`, false);
        await page.keyboard.press('Enter');
        await warte(250);
      }
      if (await page.getByRole('button', { name: 'Abschließen' }).count()) {
        await foto('06-ziel-erreicht', false);
        await page.getByRole('button', { name: 'Abschließen' }).first().click();
        break;
      }
      if (await page.locator('.ergebnis-zahl').count()) break;
    }
    await page.locator('.ergebnis-zahl').first().waitFor({ timeout: 5000 }).catch(() => fehler.push(`[${tag}] Ergebnisseite nicht erreicht`));
    await warte();
    await foto('07-ergebnis');

    // Der Dümmste fliegt: allein mit Freitext
    await page.goto(`${BASIS}#/duemmste`);
    await page.getByRole('button', { name: 'Spiel starten' }).waitFor();
    await foto('08-ddf-start');
    await page.getByRole('button', { name: 'Freitext tippen' }).click();
    await page.getByRole('button', { name: 'Spiel starten' }).click();
    await page.locator('.frage-text').waitFor();
    await warte(500);
    await foto('09-ddf-frage', false);
    await page.locator('input.eingabe').fill('Keine Ahnung');
    await page.keyboard.press('Enter');
    await warte(300);
    await foto('10-ddf-feedback', false);

    // Mehrspieler
    await page.goto(`${BASIS}#/duemmste?m=1`);
    await page.getByRole('button', { name: 'Mehrere an einem Gerät' }).click();
    const felder = page.locator('.spieler-liste input');
    await felder.nth(0).fill('Anna');
    await felder.nth(1).fill('Ben');
    await page.getByRole('button', { name: 'Vier zur Auswahl' }).click();
    await page.getByRole('button', { name: 'Spiel starten' }).click();
    await page.locator('.uebergabe').waitFor();
    await foto('11-ddf-uebergabe', false);
    // Ein paar Runden spielen, bis jemand fliegt
    for (let i = 0; i < 40; i++) {
      if (await page.locator('.uebergabe').count()) await page.keyboard.press('Enter');
      await page.locator('.antwort, .ergebnis-zahl, .rangliste.sieger, h1').first().waitFor();
      if (await page.locator('.antwort').count() && !(await page.locator('.feedback').count())) {
        await page.keyboard.press(String(1 + (i % 4)));
        await warte(120);
        await page.keyboard.press('Enter');
      }
      if (await page.getByText('gewinnt!').count()) break;
      await warte(80);
    }
    await warte(400);
    await foto('12-ddf-ende');

    // Aktuell
    await page.goto(`${BASIS}#/aktuell`);
    await page.getByRole('heading', { level: 1, name: 'Aktuell' }).waitFor();
    await page.locator('.meldung, .hinweis').first().waitFor({ timeout: 15000 });
    await warte(500);
    await foto('13-aktuell', false);

    // Fortschritt
    await page.goto(`${BASIS}#/fortschritt`);
    await page.locator('.tabelle').waitFor();
    await warte();
    await foto('14-fortschritt');

    await ctx.close();
    console.log(`fertig: ${tag}`);
  }
}
await browser.close();

if (fehler.length) {
  console.error(`\n${fehler.length} Probleme:\n` + fehler.join('\n'));
  process.exit(1);
}
console.log(`\nKeine Fehler. Screenshots in ${ORDNER}`);
