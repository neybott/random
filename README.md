# random
All Random mini projects from neybo

## Home Assistant Blueprints

### Yuka KI-Mähentscheidung nach Wetter und letztem Mähen

Blueprint für Mammotion/Yuka-Mäher: prüft täglich eine konfigurierte Uhrzeit, berücksichtigt Akku, Docking-Status, Wettervorhersage und den `input_datetime`-Helfer für die letzte Mahd. Die eigentliche Wetterentscheidung trifft eine im Blueprint auswählbare `ai_task`-Entity über `ai_task.generate_data`; feste harte Zeitregel bleibt nur der Mindestabstand, standardmäßig 2 Tage. Zusätzlich gibt es einen idealen Abstand, standardmäßig 3 Tage, zwischen Mindest- und Ziel-Maximalabstand. Ab dem Ziel-Maximalabstand, standardmäßig 7 Tage, soll die KI normalerweise zum Mähen tendieren, außer Wetter/Rasen/Mäher wirken klar ungeeignet. Der Helfer wird nach dem Startbefehl aktualisiert; optionaler Dry-Run-Modus testet die Entscheidung ohne Mäherstart und ohne Helfer-Update. Optional kann die KI-Begründung per konfigurierbarem notify-Service, z. B. aufs Handy, gesendet werden.

Datei: `home-assistant/blueprints/automation/yuka_ai_weather_mowing.yaml`
