# Wissenstag

Eine Lernseite für Allgemeinwissen. Du lernst mit Wissenskarten und Quizfragen in 24 Klassen, spielst „Der Dümmste fliegt“ allein oder mit Freunden und liest die aktuellen Nachrichten mit kurzer Einordnung. Die Seite ist statisch: kein Server, keine Anmeldung, keine Kosten.

- 24 Klassen mit zusammen über 3.600 Fragen, jede mit Erklärkarte, Merksatz und Begründung
- Jede Klasse hat zwei Modi: **Lernmodus** (Karten ansehen und einprägen) und **Prüfungsmodus** (Quiz)
- 3 Atlas-Klassen mit Globus und Weltkarte: Länder, Städte und Globus-Zuordnung, in drei Levels (Anfänger mit Tipps, Fortgeschritten, Profi)
- Lernzeit frei wählbar: Minuten, Anzahl Fragen oder ohne Limit
- Wiederholung in Abständen: Falsch beantwortete Fragen kommen öfter wieder
- XP, Level, Tagesserie, Fortschritt pro Klasse mit Meister-Abzeichen
- Fortschritt als Datei exportieren und importieren
- Hell und dunkel, mit der Tastatur bedienbar (1 bis 4 oder A bis D), mobil zuerst

## 1. Die Seite auf deinem Rechner starten

Du brauchst einmalig **Node.js** (Version 20 oder neuer). Lade es kostenlos von [nodejs.org](https://nodejs.org) herunter und installiere es.

Öffne dann ein Terminal in diesem Ordner und gib ein:

```bash
npm install
npm run dev
```

Das Terminal zeigt eine Adresse an, meist `http://localhost:5173/`. Öffne sie im Browser. Beenden kannst du den Server mit `Strg + C`.

Weitere Befehle:

| Befehl | Was er macht |
|---|---|
| `npm run build` | baut die fertige Seite in den Ordner `dist/` |
| `npm run preview` | zeigt die gebaute Seite zur Kontrolle an |
| `npm run pruefen` | prüft alle Fragen auf Fehler |
| `npm run atlas` | baut die Daten für die Atlas-Klassen und prüft alle Koordinaten |
| `npm test` | startet die automatischen Tests |
| `npm run news` | holt die neuesten Nachrichten nach `public/news.json` |
| `npm run screenshots` | klickt sich durch alle Bereiche und speichert Bilder in `screenshots/` (vorher `npm run dev` starten) |
| `npm run a11y` | prüft die Barrierefreiheit (vorher `npm run dev` starten) |

## 2. Neue Fragen hinzufügen

Jede Klasse hat eine eigene Datei im Ordner `public/data/`, zum Beispiel `public/data/geografie.json`. Öffne sie mit einem Texteditor (etwa dem kostenlosen [Visual Studio Code](https://code.visualstudio.com)) und füge in der Liste `"fragen"` einen neuen Eintrag hinzu:

```json
{
  "id": "geo-100",
  "schwierigkeit": "mittel",
  "frage": "Welcher Fluss fließt durch Wien?",
  "richtig": "Donau",
  "falsch": ["Rhein", "Elbe", "Moldau"],
  "begruendung": "Die Donau fließt mitten durch Wien und weiter nach Bratislava.",
  "karte": {
    "titel": "Wien und die Donau",
    "text": "Wien liegt an der Donau. Die Stadt ist die Hauptstadt Österreichs.",
    "merke": "Wien liegt an der Donau."
  }
}
```

Darauf musst du achten:

- **`id`** muss einmalig sein. Nimm das Kürzel der Klasse und eine neue Nummer.
- **`schwierigkeit`** ist `leicht`, `mittel` oder `schwer`.
- **`richtig`** ist die richtige Antwort, **`falsch`** genau drei falsche. Die Seite mischt die Reihenfolge selbst.
- **`karte`** ist die Wissenskarte, die vor einer neuen Frage erscheint. **`merke`** wird gelb hervorgehoben.
- Freiwillig: **`"stand": "2026-11"`** bei Fakten, die sich ändern können (etwa Ämter), **`"alias": ["…"]`** für weitere richtige Schreibweisen im Freitext-Modus und **`"ddf": true`**, wenn die Frage gut zu „Der Dümmste fliegt“ passt.
- Zwischen zwei Einträgen steht ein Komma, nach dem letzten nicht.

Prüf danach mit `npm run pruefen`, ob alles stimmt. Das Skript nennt dir Datei und Frage, falls etwas fehlt.

### Fragen aus Faktentabellen

Viele Fragen entstehen automatisch aus Tabellen in `scripts/fakten/`. In `scripts/fakten/geografie.mjs` steht zum Beispiel pro Zeile ein Fluss und seine Mündung. Daraus baut `npm run fakten` die Fragen in `public/data/generiert/`. Bearbeite die Dateien in `generiert/` nicht von Hand, sie werden beim nächsten Build überschrieben. Flaggen und Länder entstehen genauso aus `scripts/laender-basis.mjs`.

### Eine neue Klasse anlegen

1. Lege `public/data/meine-klasse.json` an mit `{ "klasse": "meine-klasse", "fragen": [ … ] }`.
2. Trag die Klasse in `public/data/klassen.json` ein (Name, zwei Buchstaben als Kürzel, kurze Beschreibung, Dateiliste).
3. `npm run pruefen` verlangt mindestens 100 Fragen pro Klasse. Den Wert kannst du oben in `scripts/validate-data.mjs` ändern.

### Die Atlas-Klassen (Globus)

Die drei Atlas-Klassen haben keine Fragen-Dateien. Ihre Fragen entstehen aus den Kartendaten:

| Klasse | Lernmodus | Prüfungsmodus |
|---|---|---|
| Atlas: Länder | Land wählen, Globus zeigt es | Welches Land ist markiert? |
| Atlas: Städte | Stadt wählen, Globus zeigt sie | Welche Stadt ist markiert? |
| Atlas: Globus | Globus frei erkunden | Land oder Stadt selbst antippen |

Das Level stellst du auf der Seite der Klasse ein. **Anfänger** bekommen nur bekannte Orte und einen Tipp (Kontinent oder Hauptstadt), der Kontinent ist auf dem Globus eingefärbt. **Fortgeschritten** bekommen mehr Orte und keine Tipps. **Profis** bekommen alle 195 Staaten, falsche Antworten aus der Nachbarschaft und müssen genauer tippen (150 statt 500 km).

Neue Städte trägst du in `scripts/atlas-orte.mjs` ein (Name, Land, Breite, Länge, Stufe, Merksatz). `npm run atlas` baut daraus `public/data/atlas/` und prüft, ob jede Stadt wirklich in ihrem Land liegt. Liegt eine Koordinate falsch, bricht das Skript mit einer Meldung ab.

## 3. Die Seite kostenlos online stellen

### Variante A: GitHub Pages (empfohlen, mit automatischen Nachrichten)

1. Lege ein kostenloses Konto auf [github.com](https://github.com) an und erstelle ein neues Repository, zum Beispiel `wissenstag`.
2. Lade diesen Ordner hoch:
   ```bash
   git remote add origin https://github.com/DEIN-NAME/wissenstag.git
   git branch -M main
   git push -u origin main
   ```
3. Öffne im Repository **Settings → Pages** und wähle bei „Source“ den Eintrag **GitHub Actions**.
4. Unter **Settings → Actions → General** setzt du bei „Workflow permissions“ den Haken bei **Read and write permissions**, damit die Action neue Nachrichten speichern darf.
5. Unter dem Reiter **Actions** siehst du, wie die Seite gebaut wird. Nach ein bis zwei Minuten ist sie unter `https://DEIN-NAME.github.io/wissenstag/` erreichbar.

Ab dann baut GitHub die Seite bei jeder Änderung neu und holt dreimal am Tag frische Nachrichten.

### Variante B: Netlify

1. Lade das Projekt wie oben zu GitHub hoch.
2. Melde dich bei [netlify.com](https://www.netlify.com) kostenlos an und wähle **Add new site → Import an existing project**.
3. Wähle dein Repository. Die Einstellungen liest Netlify aus `netlify.toml`, du musst nur auf **Deploy** klicken.

Die Nachrichten holt auch hier die GitHub Action aus Variante A. Sie speichert `public/news.json` im Repository, und Netlify baut danach automatisch neu. Lass deshalb die Action eingeschaltet (Schritt 4 von Variante A).

## 4. So bleiben die Nachrichten aktuell

Der Reiter „Aktuell“ nutzt zwei Wege:

1. **GitHub Action** (`.github/workflows/deploy.yml`): Dreimal am Tag ruft `scripts/fetch-news.mjs` die öffentlichen Angebote von tagesschau.de (JSON-Schnittstelle), ZDFheute und Deutschlandfunk (RSS) ab. Das Skript entfernt Dubletten, behält die Meldungen der letzten sieben Tage und schreibt sie nach `public/news.json`. Dafür braucht es keinen API-Schlüssel.
2. **Live-Abruf im Browser:** Die tagesschau-Schnittstelle erlaubt Abrufe direkt aus dem Browser. Die Seite lädt deshalb zusätzlich die allerneuesten tagesschau-Meldungen, sobald jemand den Reiter öffnet.

Fällt beides aus, zeigt die Seite einen deutlichen Hinweis mit dem Datum des letzten erfolgreichen Abrufs statt alter Meldungen ohne Datum. Die Einordnungen („Gut zu wissen“) stehen in `src/lib/einordnung.js` und lassen sich dort erweitern.

## 5. Aufbau des Projekts

```
index.html              Grundgerüst der Seite
src/main.js             Start, Navigation, Farbschema
src/views/              die Bereiche: Start, Lernen, Lernkarten, Atlas, Dümmste fliegt, Aktuell, Fortschritt
src/lib/                Lernlogik, Speicher, Punkte, Textvergleich, Nachrichten
src/styles/main.css     Farben, Schriften, Layout
public/data/            Fragen (eine Datei pro Klasse), atlas/ mit Ländergrenzen und Orten
public/news.json        Nachrichten, von der Action erzeugt
scripts/                Generatoren, Prüfskript, Nachrichtenabruf, Screenshots
tests/                  automatische Tests
docs/                   Notizen zur Recherche
```

Werkzeug ist [Vite](https://vite.dev) mit einfachem JavaScript, ohne Framework. Vite startet schnell und baut eine rein statische Seite. Der Code bleibt so auch für Einsteiger lesbar.

## 6. Datenschutz

Dein Fortschritt bleibt in deinem Browser (localStorage). Die Seite setzt keine Cookies und lädt Schriften nicht von Google, sondern liefert sie selbst aus. Nur der Reiter „Aktuell“ fragt beim Öffnen die tagesschau-Schnittstelle an. Mit „Fortschritt exportieren“ sicherst du deinen Stand als Datei.

## 7. Lizenzen

- Code: MIT
- Flaggen: [flag-icons](https://github.com/lipis/flag-icons), MIT-Lizenz
- Ländergrenzen: [Natural Earth](https://www.naturalearthdata.com) über [world-atlas](https://github.com/topojson/world-atlas), gemeinfrei; Globus mit [d3-geo](https://d3js.org/d3-geo), ISC-Lizenz
- Schriften: Bricolage Grotesque, Figtree und IBM Plex Mono über [Fontsource](https://fontsource.org), SIL Open Font License
- Nachrichten: Überschriften und Anrisse gehören den Redaktionen von tagesschau.de, ZDFheute und Deutschlandfunk. Die Seite verlinkt jeweils auf den Originalartikel.
