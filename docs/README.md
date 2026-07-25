# ArcadeForge

Eine responsive HTML5-Spieleplattform für GitHub Pages. Alle veröffentlichten
Dateien liegen in diesem `docs`-Ordner.

## GitHub Pages

1. Projekt in ein GitHub-Repository hochladen.
2. **Settings → Pages → Deploy from a branch** öffnen.
3. Branch `main` und Ordner `/docs` auswählen.
4. Speichern.

Spiel-URLs:

- `/game/1001/` – Neon Drift
- `/game/1002/` – Blockfall
- `/game/1003/` – Orbit Defender

Im Browser erscheint kein `index.html`. GitHub Pages lädt die Datei im
ID-Ordner automatisch.

## Ein Spiel hinzufügen

1. Unter `games/` einen Ordner mit `index.html`, `Settings.yml`, Spielcode und
   eigenem `favicon.svg` anlegen.
2. Unter `game/DEINE-ID/` eine Launcher-`index.html` anlegen.
3. Das Spiel in `games/catalog.json` eintragen.

Die `Settings.yml` beschreibt ID, Sprachen, Geräte, Eingabemethoden,
Ausrichtung, Version und Lizenz.

## Lizenz

Quellcode, Oberfläche, Originalgrafiken und Spiele stehen unter der
[MIT-Lizenz](LICENSE).
