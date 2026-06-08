# random
All Random mini projects from neybo

## Home Assistant Blueprints

### Yuka KI-Mähentscheidung nach Wetter und letztem Mähen

Blueprint für Mammotion/Yuka-Mäher: prüft täglich eine konfigurierte Uhrzeit, berücksichtigt Akku, Docking-Status, Wettervorhersage und den `input_datetime`-Helfer für die letzte Mahd. Die eigentliche Wetterentscheidung trifft `ai_task.generate_data`; feste harte Zeitregel bleibt nur der Mindestabstand, standardmäßig 2 Tage. Ab dem Ziel-Maximalabstand, standardmäßig 7 Tage, soll die KI normalerweise zum Mähen tendieren, außer Wetter/Rasen/Mäher wirken klar ungeeignet. Der Helfer wird nach dem Startbefehl aktualisiert.

Datei: `home-assistant/blueprints/automation/yuka_ai_weather_mowing.yaml`
