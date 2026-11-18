# Umsetzungsplan: Validierung der Spracheingaben

> **Vorläufige Datei: Vor dem Merge nach `main` löschen.**
>
> Dieser Lösungsvorschlag wurde von einer KI erstellt. Er muss vor der
> Umsetzung fachlich und technisch geprüft werden.

## Ausgangslage

`getCurrentLanguage` in `helpers/i18n.js` übernimmt Sprachwerte aus mehreren
Quellen ohne Abgleich mit `availableLanguages`. Die nachgelagerte Prüfung in
`changeLanguage` verhindert nicht, dass der ungeprüfte Wert zuvor als
`res.locals.userLanguage` weitergegeben wird. Dieser Wert wird unter anderem
in Script-Pfaden in `views/lib/default.hbs` und den Datei-Viewer-Templates
verwendet.

## Vorgehen

1. In `helpers/i18n.js` eine zentrale Validierung für Sprachwerte einführen:
   Nur Strings, die exakt in `availableLanguages` enthalten sind, übernehmen;
   bei einem vorhandenen, aber ungültigen Wert `defaultLanguage` verwenden.
   Damit auch der Rückfallwert sicher ist, die Konfiguration auf eine gültige,
   in `availableLanguages` enthaltene Standardsprache prüfen und eine
   Fehlkonfiguration ausdrücklich melden.
2. Diese Prüfung auf alle Quellen in `getCurrentLanguage` anwenden:
   Query-Parameter `lng`, Nutzereinstellung, `currentSchoolData.language`,
   Cookie `USER_LANG` und das Ergebnis der Registrierungs-Schulabfrage.
   Die bisherige Reihenfolge beibehalten: Query, Nutzer, Schule, Cookie,
   Registrierungsschule, Browsersprache auf Login-Routen, Standard. Bei einem ungültigen Wert einer vorhandenen
   Quelle direkt auf die Standardsprache zurückfallen, statt einen Wert aus
   einer Quelle niedrigerer Priorität zu übernehmen. Fehlende Werte weiterhin
   von ungültigen unterscheiden, damit niedrigere Prioritäten nutzbar bleiben.
3. Auch bei fehlendem oder ungültigem Ergebnis der Registrierungs-Schulabfrage
   einen gültigen Rückfall sicherstellen. Dabei die bestehende Fehlerbehandlung
   der API-Abfrage berücksichtigen.
   Die Schulabfrage liefert nur unterstützte Sprachen und protokolliert
   API-Fehler. Ohne ermittelte Schulsprache greift der abschließende
   Standardwert in `getCurrentLanguage`.
4. Die Aufrufer in `middleware/i18n.js`, `helpers/authentication.js` und
   `controllers/registration.js` prüfen: Nur validierte Werte dürfen als
   `userLanguage`, für die Sprachumschaltung oder im Cookie weitergegeben
   werden. Insbesondere das Zusammenspiel mit der Browser-Sprachauswahl auf
   der Login-Seite prüfen; `getBrowserLanguage` filtert bereits nach
   `availableLanguages`. Eine Änderung der bisherigen Auswahl ist gesondert
   zu entscheiden und zu testen.
   `getCurrentLanguage` berücksichtigt den Browser-Header auf Login-Routen
   nach den übrigen Sprachquellen und vor der Standardsprache.
   Schul- und Browserabfrage liefern `undefined`, wenn keine unterstützte
   Sprache ermittelt wird.
5. Zusätzlich prüfen, ob `getLocaleScriptPath` in `middleware/assets.js`
   eigenständig abgesichert werden sollte. Die zentrale Validierung muss
   unabhängig davon alle Script-Pfade schützen, die `userLanguage` verwenden,
   einschließlich beider Datei-Viewer-Templates.
   Der Locale-Skript-Helper validiert zusätzlich vor der Pfadbildung. Beide
   Datei-Viewer verwenden weiterhin die zentral validierte Sprache.

## Tests und Prüfung

- In `test/mocha/helpers/i18n.test.js` für jede Quelle gültige und ungültige
  Werte testen, einschließlich eines Werts mit Script-Injection-Zeichen sowie
  Nicht-Strings und leerer Werte. Priorität und das Verhalten bei fehlenden
  Quellen ausdrücklich testen.
- Für die Registrierungsschule gültige, ungültige und fehlende Antworten sowie
  einen API-Fehler testen. Eine ungültige Standardkonfiguration ebenfalls
  abdecken.
- Middleware und Authentifizierungsfluss darauf prüfen, dass nur die
  validierte Sprache weitergegeben beziehungsweise gespeichert wird.
  Login-/Browser-Sprachauswahl und gerenderte Script-Pfade auf Regressionen
  prüfen; den tatsächlichen ausgegebenen Pfad mit einem ungültigen
  Sprachparameter verifizieren.
- Gezielt ausführen:
  `npx cross-env NODE_ENV=test mocha test/mocha/helpers/i18n.test.js --exit`
  sowie die zusätzlich betroffenen Tests. Bei Bedarf anschließend die gesamte
  Suite mit `npm run mocha` ausführen.
