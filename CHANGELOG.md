# CHANGELOG — Fabled Lands Helper

*Une entrée par version, la plus récente en tête ; sous chaque entrée, les fichiers touchés, en sous-puces à deux
espaces de retrait.*

## v0.5 — 2026-10-25

- Les dés : sur la fiche, un bouton en forme de dé ouvre le choix « 1 dé » ou « 2 dés ». Les dés, en cubes, sont lancés depuis le bas de l'écran, roulent sur la page en rebondissant et s'arrêtent d'eux-mêmes sur la face tirée ; ils restent posés avec leur total, et le dernier jet reste écrit au-dessus du bouton. L'application ne calcule rien : le joueur lit le résultat et le reporte lui-même.
  - `js/des.js` : neuf, le tirage (`tirageNavigateur`), `lancer`, `somme`, `texteJet`, `points`, la barre de la fiche (`barreDes`), la couche où les dés roulent et le dernier jet
  - `js/feuille.js` : la barre des dés à la fin de la fiche (`vueFiche`)
  - `js/precache.js` : `js/des.js` dans le cache hors ligne (27 entrées)
  - `css/app.css` : la feuille de style du lot
  - `js/version.js` : `v0.5` (le cache hors ligne devient `flh-v0.5`)
  - `i18n/fr.json`, `i18n/en.json` : 10 clés neuves (155 clés)
  - `tests/des.test.js` : neuf, 10 tests
  - `CHANGELOG.md` : cette entrée

## v0.4 — 2026-10-25

- Le bonus des objets : une possession peut porter un bonus (ou un malus) à une compétence ou à la Défense, qui entre seul dans le total ; pour chaque compétence et pour la Défense, seul le meilleur bonus d'objet compte, un malus d'objet compte toujours. Les bonus saisis à la main au nom d'un objet transporté passent sur cet objet (sauvegarde au schéma 3).
  - `js/regles.js` : `CIBLES`, `bonusObjets` (le meilleur bonus compte, un malus toujours), les totaux avec les objets, `ajouterPossession` avec un bonus, `changerBonusObjet`
  - `js/sauvegarde.js` : le schéma 3, la complétion des possessions en objets, le rattachement des bonus à la main depuis le schéma 1 ou 2
  - `js/pretires.js` : les possessions des pré-tirés en objets (le Gilet en cuir à Défense +1, la Boussole de Tjell à Exploration +1)
  - `js/feuille.js` : Possessions (la pastille du bonus, l'éditeur du bonus d'un objet, l'ajout avec un bonus) et Statistiques (les pastilles et la liste des bonus d'objets)
  - `js/app.js` : la route `#/perso/<id>/possessions/<index>`, sans retour en haut de page
  - `css/app.css` : la feuille de style du lot
  - `js/version.js` : `v0.4` (le cache hors ligne devient `flh-v0.4`)
  - `i18n/fr.json`, `i18n/en.json` : 6 clés neuves (145 clés)
  - `tests/regles.test.js`, `tests/sauvegarde.test.js`, `tests/pretires.test.js` : 13, 10 et 2 tests neufs ; les tests des possessions en texte, du schéma 2 et des bonus à la main des pré-tirés mis au schéma 3
  - `CHANGELOG.md` : cette entrée

## v0.3.1 — 2026-10-25

- La création d'un pré-tiré : le nom et le bouton « Créer » passent en haut de l'écran, qui y revient au choix d'un personnage. L'aide à l'installation dit quoi faire quand l'icône n'apparaît pas sur l'écran d'accueil.
  - `js/feuille.js` : l'écran du pré-tiré, le formulaire (ou la consigne) en tête, avant la légende, le lien et les cartes
  - `js/app.js` : la page des routes du mode pré-tiré comprend le choix, d'où le retour en haut au toucher d'une carte
  - `js/vues.js` : la ligne d'aide sur les raccourcis, à l'accueil et dans les réglages
  - `js/version.js` : `v0.3.1` (le cache hors ligne devient `flh-v0.3.1`)
  - `i18n/fr.json`, `i18n/en.json` : 2 clés neuves (139 clés)
  - `tests/pretires.test.js` : un commentaire remis en termes neutres
  - `CHANGELOG.md` : l'en-tête et cette entrée

## v0.3 — 2026-10-24

- La feuille d'aventure : la création à partir d'un des neuf personnages pré-tirés de l'éditeur ou par saisie libre ; les Statistiques (Endurance, Niveau, compétences avec leurs bonus et malus, Défense calculée, titres et honneurs, histoire), les Possessions (Bourse en chardes, douze possessions transportées) et les Cultes (bénédictions, malédictions, résurrection) ; les personnages existants reçoivent une feuille vierge (sauvegarde au schéma 2).
  - `js/feuille.js` : la création (pré-tiré, saisie libre) et la fiche en trois rubriques, l'enregistrement de chaque changement, le retour du focus
  - `js/regles.js` : les règles de calcul (`totalCompetence`, `defense`, `signe`) et les bornes de chaque modification
  - `js/pretires.js`, `js/liens.js` : les neuf pré-tirés de l'éditeur et l'adresse de leurs fiches
  - `js/sauvegarde.js`, `js/stockage.js` : le schéma 2, sa complétion (`completerPersonnage`) à l'import comme à la lecture du stockage, la migration du schéma 1
  - `js/app.js`, `js/vues.js` : les routes de la création et de la fiche, le haut de page seulement quand la page change ; le paragraphe des pré-tirés dans « Droits et sources »
  - `css/app.css` : la feuille de style du lot
  - `js/version.js`, `js/precache.js` : `v0.3`, le cache hors ligne (26 entrées)
  - `i18n/fr.json`, `i18n/en.json` : les dictionnaires (137 clés)
  - `tests/regles.test.js`, `tests/pretires.test.js`, `tests/sauvegarde.test.js` : 25, 8 et 19 tests neufs ; les tests du schéma 1 adaptés au schéma 2

## v0.2 — 2026-10-23

- L'installation et les mises à jour : une aide pour installer l'application sur l'écran d'accueil, quel que soit le navigateur ; un bandeau quand une nouvelle version est prête, et « Vérifier les mises à jour » dans les réglages ; une nouvelle icône, le monogramme « FL » du Carnet de route ; un message clair quand le navigateur bloque l'enregistrement.
  - `js/pwa.js` : l'état d'installation, le bouton « Installer », la surveillance du contrôleur, la vérification des mises à jour
  - `tests/pwa.test.js` : 10 tests (`etatInstallation`, `issueVerification`)
  - `index.html`, `css/app.css` : le bandeau de mise à jour, le jeton `--ombre`, `button.lien`, la marge de l'aide
  - `js/app.js`, `js/vues.js`, `js/stockage.js` : l'écoute de l'installation, le bandeau, l'enregistrement du service worker (`updateViaCache`), l'aide de l'accueil, la section « Application » des réglages, le stockage bloqué (`stockageDisponible`)
  - `js/version.js`, `js/precache.js` : `v0.2`, le cache hors ligne (22 entrées)
  - `i18n/fr.json`, `i18n/en.json` : les dictionnaires (61 clés)
  - `icons/icon.svg`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-maskable-512.png` : le monogramme « FL »

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
