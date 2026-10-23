# CHANGELOG — Fabled Lands Helper

*Une entrée par version, la plus récente en tête. Le texte de chaque entrée vient du cadrage, mot pour mot ; le dev y
ajoute ses lignes de fichiers en sous-puces à deux espaces de retrait.*

## v0.1 — 2026-10-23

- Le socle de Fabled Lands Helper : application installable et utilisable hors ligne, en français et en anglais, avec les ambiances Jour et Chandelle ; création, liste et suppression des personnages ; export et import d'un fichier de sauvegarde ; page « Droits et sources ».
  - `index.html`, `css/app.css`, `js/app.js`, `js/vues.js` : la page, le Carnet de route, le démarrage et les cinq écrans
  - `js/version.js`, `js/precache.js`, `sw.js`, `manifest.webmanifest` : la version, le cache hors ligne (21 entrées), le service worker, l'installation
  - `js/sauvegarde.js`, `js/stockage.js` : le schéma 1 (lecture, export, personnage neuf) et IndexedDB
  - `js/i18n.js`, `i18n/fr.json`, `i18n/en.json` : les dictionnaires (46 clés)
  - `icons/icon.svg`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-maskable-512.png` : les icônes
  - `fonts/` : IM Fell English SC et Alegreya (latin, OFL-1.1) avec leurs licences
  - `tests/sauvegarde.test.js`, `tests/i18n.test.js` : les tests
  - `README.md` : la présentation du dépôt
