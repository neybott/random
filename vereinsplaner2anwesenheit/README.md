# Vereinsplaner → Anwesenheitsliste

Statische Mini-Website mit lokal mitgelieferter PDF-Bibliothek. Den vollständigen Ordner einschließlich `vendor/` behalten. `index.html` direkt in einem aktuellen Browser öffnen oder das Repository lokal bereitstellen:

```sh
python3 -m http.server 8000
```

Danach `http://localhost:8000/vereinsplaner2anwesenheit/` öffnen.

- Vereinsplaner-Mitgliederliste als CSV oder XLSX laden, wie bei `vereinsplaner2nuliga`.
- Ohne Filter werden alle Mitglieder übernommen. „Rolle: Nachwuchs“ wählt auch Mitglieder mit zusätzlichen Rollen aus.
- Bis zu zehn Filter auf allen Quellfeldern mit UND-/ODER-Verknüpfung, Werte-Vorschlägen und sieben Vergleichsbedingungen. Filter ohne erforderlichen Wert bleiben wirkungslos und werden markiert.
- Start- und Endmonat (maximal 24 Monate), Wochentage, Gruppenüberschrift, Zweitnamen, Teilnehmerzahl pro Seite und Sortierung wählen.
- Standard: maximal 20 Teilnehmer pro A4-Seite im Querformat, jeder Monat beginnt auf einer neuen Seite. Weitere Teilnehmer erhalten Folgeseiten im gleichen Monat. Die Zeilenzahl pro Seite ist einstellbar. Nicht belegte Zeilen bleiben einschließlich Namensfeld leer, damit neue Mitglieder handschriftlich ergänzt werden können. Jede Seite wird auf die eingestellte Zeilenzahl aufgefüllt, auch im CSV-Export. Enthalten sind: Namen als „Vorname Nachname“, Datumsspalten wie „DI - 20.10“, leere Felder zum Abhaken. Der kompakte Kopf zeigt Monat und Verein nebeneinander sowie die Seitenzahl oben. Bis zu 24 Zeilen behalten dieselbe Zeilenhöhe von etwa 6,9 mm und 12 pt Namensschrift. Dafür werden oben und unten 5 mm Seitenrand genutzt (links und rechts 10 mm). Die Namensschrift beträgt standardmäßig 12 pt (16 px); bei höher eingestellter Teilnehmerzahl wird sie passend verkleinert.
- Drucker-Symbol: Druckdialog öffnen. PDF-Symbol: A4-PDF direkt herunterladen (300 dpi, ohne Druckdialog). A4, Querformat, 100 % und keine Browser-Kopf-/Fußzeilen einstellen. Optional CSV exportieren. PDF-Erstellung erfolgt ausschließlich lokal mit der mitgelieferten [jsPDF-Bibliothek](vendor/README.md).
- Einstellungen automatisch im Local Storage und, sofern sie in ein Cookie passen, zusätzlich als Cookie speichern (ein Jahr). Bei direktem Öffnen als Datei dient Local Storage als Speicher. Bei blockiertem Speicher erscheint ein Hinweis.
- Einstellungen als JSON exportieren/importieren. „Zurücksetzen“ stellt den aktuellen Monat, alle Mitglieder und alle Wochentage wieder her.

Mitgliederdaten bleiben nur im Arbeitsspeicher der geöffneten Seite und werden beim Neuladen entfernt. Die Testliste aus Downloads gehört nicht ins Repository.

## Tests

Kalender, CSV-Import, Filterbedingungen und Einstellungsvalidierung werden mit Node.js getestet:

```sh
node --test vereinsplaner2anwesenheit/tests/core.test.cjs
```
