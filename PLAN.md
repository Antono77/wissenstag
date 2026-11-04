# Plan: Wissenstag 2.0

Stand: 4. November 2026

## Werkzeug

- **Vite + einfaches JavaScript (ES-Module), kein Framework.** Die Seite hat fünf Ansichten und wenig geteilten Zustand. Vite liefert einen schnellen Entwicklungsserver und baut eine statische Seite, die auf GitHub Pages und Netlify ohne Server läuft. Ohne Framework bleibt der Code für Anfänger lesbar.
- Router über den Hash (`#/lernen`), damit GitHub Pages keine Umleitungen braucht.
- Schriften lokal über `@fontsource` statt vom Google-Server (Datenschutz, funktioniert offline).
- Flaggen als SVG aus `flag-icons` (MIT), beim Start/Build nach `public/flags/` kopiert.
- Tests: `vitest` für die Lernlogik, ein Prüfskript für alle Fragen-Dateien, `playwright` für Klicktests und Screenshots.

## Aufbau

```
index.html
src/
  main.js            Start, Router, Navigation
  state.js           Fortschritt, localStorage, Export/Import
  logic/             Wiederholung (Leitner), XP/Level, Serie, Textvergleich
  views/             start, lernen, sitzung, duemmste, aktuell, fortschritt
  styles/            Design-Tokens, Komponenten
public/
  data/klassen.json  Liste der Klassen
  data/<klasse>.json Fragen je Klasse
  news.json          von GitHub Action erzeugt
scripts/
  laender-basis.mjs  Länderliste (alle 193 UN-Staaten + Vatikan, Palästina, Kosovo)
  generate-laender.mjs  erzeugt flaggen.json und laender.json
  fetch-news.mjs     holt tagesschau, ZDFheute, Deutschlandfunk
  validate-data.mjs  prüft alle Fragen
  screenshots.mjs    Playwright-Rundgang
.github/workflows/   Deploy auf Pages + Nachrichten 3x täglich
```

## Fragenformat

```json
{ "id": "geo-001", "schwierigkeit": "leicht",
  "frage": "…", "richtig": "…", "falsch": ["…","…","…"],
  "begruendung": "…", "karte": { "titel": "…", "text": "…", "merke": "…" },
  "stand": "2026-11", "alias": ["…"] }
```

Die richtige Antwort steht getrennt, die App mischt die Reihenfolge. Das senkt Fehler beim Schreiben neuer Fragen.

## Schritte

1. Grundgerüst (Vite, Design-Tokens, Navigation, Router) → Commit
2. Zustand, Speicher, Export/Import, Lernlogik mit Tests → Commit
3. Länderliste + Generator für Flaggen und Länder → Commit
4. Fragenbank: 22 handgeschriebene Klassen mit je mindestens 30 Fragen, mehrere Commits
5. Lernen: Startseite mit Zeit- oder Fragenziel, Klassenwahl, Sitzung mit Karte, Quiz, Feedback, Ergebnis → Commit
6. „Der Dümmste fliegt“: Einzel, Mehrspieler, Zeitlimit, Freitext → Commit
7. „Aktuell“: Skript + Action + Live-Abruf im Browser, Einordnung, News-Quiz → Commit
8. Fortschrittsseite → Commit
9. Prüfen: Datenprüfung, Unit-Tests, Playwright-Rundgang mit Screenshots (Handy/Desktop, Hell/Dunkel), Fehler beheben → Commit
10. README, Bericht, Seite im Browser öffnen

## Klassen

Vorgegeben (22): Geografie, Flaggen, Länder & Hauptstädte, Geschichte, Politik & Gesellschaft, Wissenschaft, Weltraum, Natur & Tiere, Mensch & Körper, Technik & Erfindungen, Wirtschaft & Geld, Kunst & Kultur, Literatur, Musik, Film & Serien, Sport, Sprache & Redewendungen, Religion & Mythologie, Essen & Trinken, Internet & Popkultur, Deutschland-Wissen, Logik & Mathe-Kopfnüsse.

Ergänzt (2): **Umwelt & Klima** (Alltagsthema mit vielen Nachrichtenbezügen), **Alltag & Allerlei** (Verkehrsschilder, Hochzeitstage, Maße und Einheiten; passt zum Stil von „Der Dümmste fliegt“).

## Lernlogik

- Leitner-System mit 6 Fächern, Abstände 0, 1, 3, 7, 14, 30 Tage. Falsch → Fach 1 und in derselben Einheit noch einmal.
- Neue Frage: erst Wissenskarte, dann Frage. Wiederholung: direkt die Frage.
- „Gelernt“ = Fach 3 oder höher. „Meister“ einer Klasse ab 90 % gelernt.
- XP: 10 je richtige Antwort, 20 je abgeschlossene Einheit. Level wie im Prototyp.
- Serie zählt, sobald an einem Tag eine Einheit abgeschlossen ist.
