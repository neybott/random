# Random Mini Projects

Eine Sammlung kleiner Tools, Webseiten und Home-Assistant-Automatisierungen von [Neybo](https://github.com/neybott).

## Projekte

| Projekt | Beschreibung | Links |
| --- | --- | --- |
| Vereinsplaner → nuLiga | Konvertiert die Mitgliederliste von BSC 70 Linz aus CSV oder XLSX in eine nuLiga-kompatible CSV. Ausgabefelder sind frei wählbar und werden für den nächsten Besuch gespeichert. Die Verarbeitung findet vollständig im Browser statt. | [Live öffnen](https://random.neyda.at/vereinsplaner2nuliga/) · [Quellcode](vereinsplaner2nuliga/index.html) · [HTML herunterladen](https://raw.githubusercontent.com/neybott/random/main/vereinsplaner2nuliga/index.html) |
| Amano Pizza Filter | Statische Webseite zum Durchsuchen und Filtern von Amano-Pizzen nach Zutaten und eigenen Presets. | [Live öffnen](https://random.neyda.at/amano-pizza-filter/) · [Quellcode](amano-pizza-filter/index.html) · [README](amano-pizza-filter/README.md) |
| Yuka KI-Mähentscheidung | Home-Assistant-Blueprint für Mammotion/Yuka-Mäher. Berücksichtigt unter anderem Wetter, Akku, Docking-Status und den Abstand zur letzten Mahd. | [Blueprint ansehen](home-assistant/blueprints/automation/yuka_ai_weather_mowing.yaml) · [RAW-Datei](https://raw.githubusercontent.com/neybott/random/main/home-assistant/blueprints/automation/yuka_ai_weather_mowing.yaml) |

## Vereinsplaner → nuLiga verwenden

1. Den [Vereinsplaner → nuLiga Konverter](https://random.neyda.at/vereinsplaner2nuliga/) im Browser öffnen.
2. `BSC 70 Linz-Mitgliederliste.csv` oder `BSC 70 Linz-Mitgliederliste.xlsx` auswählen.
3. Gewünschte Ausgabefelder markieren und die konvertierte CSV herunterladen.

Alternativ kann die einzelne [`index.html`](https://raw.githubusercontent.com/neybott/random/main/vereinsplaner2nuliga/index.html) heruntergeladen und offline geöffnet werden. Hochgeladene Mitgliederdaten werden ausschließlich im Browser verarbeitet und verlassen das Gerät nicht.

## Lizenz

Sofern in einem Projekt keine eigene Lizenz angegeben ist, bleiben alle Rechte beim jeweiligen Urheber.
