# Vereinsplaner → Anwesenheitsliste

Statische Mini-Website mit lokal mitgelieferter PDF-Bibliothek. Den vollständigen Ordner einschließlich `vendor/` behalten. `index.html` direkt in einem aktuellen Browser öffnen oder das Repository lokal bereitstellen:

```sh
python3 -m http.server 8000
```

Danach `http://localhost:8000/vereinsplaner2anwesenheit/` öffnen.

- Vereinsplaner-Mitgliederliste als CSV oder XLSX laden, wie bei `vereinsplaner2nuliga`.
- Ohne Filter werden alle Mitglieder übernommen. „Rolle: Nachwuchs“ wählt auch Mitglieder mit zusätzlichen Rollen aus.
- Bis zu zehn Filter auf allen Quellfeldern mit UND-/ODER-Verknüpfung, Werte-Vorschlägen und sieben Vergleichsbedingungen. Filter ohne erforderlichen Wert bleiben wirkungslos und werden markiert.
- Start- und Endmonat (maximal 24 Monate), Wochentage, Gruppenüberschrift, Zweitnamen, maximale Teilnehmerzeilen pro Seite und Sortierung wählen. A4 ist in Querformat und Hochformat verfügbar; Vorschau, Druck und PDF nutzen dieselbe Auswahl.
- Standard: maximal 20 Teilnehmer pro A4-Seite im Querformat, jeder Monat beginnt auf einer neuen Seite. Weitere Teilnehmer erhalten Folgeseiten im gleichen Monat. Die Zeilenzahl pro Seite ist einstellbar. Nicht belegte Zeilen bleiben einschließlich Namensfeld leer, damit neue Mitglieder handschriftlich ergänzt werden können. Jede Seite wird bis zur eingestellten, auf der Seite verfügbaren Zeilenzahl aufgefüllt, auch im CSV-Export. Enthalten sind: Namen als „Vorname Nachname“, Datumsspalten wie „DI - 20.10“, leere Felder zum Abhaken. Der kompakte Kopf zeigt Monat und Verein nebeneinander sowie die Seitenzahl oben. Ohne zusätzliche Abschnittsüberschriften passen bis zu 24 Teilnehmerzeilen mit etwa 6,9 mm Höhe und 12 pt Namensschrift auf eine Seite. Dafür werden oben und unten 5 mm Seitenrand genutzt (links und rechts 10 mm). Die Namensschrift beträgt standardmäßig 12 pt (16 px); bei höher eingestellter Teilnehmerzahl wird sie passend verkleinert.
- Optional nach Rollen, Gruppenzugehörigkeit oder einem beliebigen anderen Quellfeld gruppieren. Gruppen können als Abschnitte auf derselben Monatsseite oder auf eigenen Monatsseiten erscheinen. Die Reihenfolge lässt sich frei eingeben; eine Vorlage bietet Trainer → Beginner → Intermediate → Advanced. Weitere Gruppen folgen alphabetisch, fehlende Zuordnungen am Ende. Bei mehreren Rollen zählt die erste passende Gruppe in der Reihenfolge; ohne passende Vorgabe zählt der erste exportierte Wert. Niemand wird durch die Gruppierung doppelt aufgeführt.
- Gruppenüberschriften auf gemeinsamen Seiten beanspruchen zusätzlichen Platz. Die Teilnehmerzeilen bleiben gleich hoch; gegebenenfalls passen weniger auf eine Seite und es entstehen weitere Seiten. Bei eigenen Gruppenseiten steht die Gruppe im Listenkopf. Jede Seite enthält freie Zeilen bis zur auf der Seite verfügbaren Teilnehmerzahl.
- Bis zu zwölf selbst benannte Zusatzspalten links oder rechts von den Tagen ergänzen. Die Reihenfolge innerhalb einer Seite entspricht der Eingabereihenfolge. Zusatzspalten enthalten leere Kästchen zum handschriftlichen Ankreuzen. Sehr lange Titel und viele Spalten benötigen mehr Platz; kurze Titel und passende Trainingstage wählen. Gruppierung und Zusatzspalten erscheinen auch im CSV-Export.
- Drucker-Symbol: Druckdialog öffnen. PDF-Symbol: A4-PDF direkt herunterladen (300 dpi, ohne Druckdialog). A4, die gewählte Ausrichtung, 100 % und keine Browser-Kopf-/Fußzeilen einstellen. Optional CSV exportieren. PDF-Erstellung erfolgt ausschließlich lokal mit der mitgelieferten [jsPDF-Bibliothek](vendor/README.md).
- Einstellungen automatisch im Local Storage und, sofern sie in ein Cookie passen, zusätzlich als Cookie speichern (ein Jahr). Bei direktem Öffnen als Datei dient Local Storage als Speicher. Bei blockiertem Speicher erscheint ein Hinweis.
- Einstellungen als JSON exportieren/importieren. „Zurücksetzen“ stellt den aktuellen Monat, alle Mitglieder und alle Wochentage wieder her.

Mitgliederdaten bleiben nur im Arbeitsspeicher der geöffneten Seite und werden beim Neuladen entfernt. Die Testliste aus Downloads gehört nicht ins Repository.

## Tests

Kalender, CSV-Import, Filterbedingungen, Gruppierung, Seiteneinteilung, Zusatzspalten und Einstellungsvalidierung werden mit Node.js getestet:

```sh
node --test vereinsplaner2anwesenheit/tests/core.test.cjs
```
