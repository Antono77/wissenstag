# Recherche: „Der Dümmste fliegt“ (Schmobin)

Stand: 4. November 2026

## Vorgehen

1. Mit `yt-dlp` (über `winget` installiert) habe ich auf YouTube nach „Schmobin Der Dümmste fliegt“ gesucht und 25 Folgen gefunden.
2. Von sechs Folgen habe ich die automatischen deutschen Untertitel geladen (`--write-auto-subs --skip-download`).
3. Ein kleines Skript hat die Untertitel bereinigt und Stellen mit Fragewörtern herausgezogen.

Die Untertitel selbst liegen nicht im Projekt. Auf der Seite stehen keine wörtlich übernommenen Fragen aus den Videos, sondern eigene Fragen in diesem Stil.

## Was den Stil ausmacht

- **Kurz und schnell:** Die meisten Fragen passen in eine Zeile und lassen sich in wenigen Sekunden beantworten („Wie viele Seiten hat ein Würfel?“, „Welcher Fluss fließt durch Paris?“).
- **Bunte Mischung:** Geografie, Allgemeinbildung aus der Schule, Tiere, Essen, Popkultur, Games, Internet, Sprache.
- **Leicht und gemein im Wechsel:** Neben sehr einfachen Fragen kommen Fangfragen, bei denen man genau lesen muss („Wie viele Tiere jeder Art nahm Mose mit auf die Arche?“, „Welches Wort wird immer falsch geschrieben?“, „Wie viele Buchstaben hat das Wort fünf?“).
- **Typische Fallen:** Hauptstädte, die nicht die größte Stadt sind; Zahlen in Wörtern; Sprichwörter, die man halb kennt („Kindermund tut Wahrheit kund“).
- **Flaggen:** Mehrfach wird eine Flagge gezeigt und das Land erfragt.

## Umsetzung auf der Seite

- Fragen mit dem Merkmal `"ddf": true` kommen im Spielmodus bevorzugt dran (etwa zwei Drittel), der Rest stammt aus allen Klassen.
- Im Modus werden nur kurze Fragen genutzt (bis 120 Zeichen).
- Neu geschriebene Fragen im Stil der Reihe stecken in den Klassen, in die sie inhaltlich gehören, zum Beispiel „Welcher Mund tut sprichwörtlich Wahrheit kund?“ in „Sprache & Redewendungen“ und „Wie viele Herzen hat ein Oktopus?“ in „Natur & Tiere“.
- Creator-spezifische Fragen aus den Videos (etwa über Streamer und deren Produkte) habe ich bewusst nicht übernommen: Sie veralten schnell und lassen sich schlecht prüfen.
