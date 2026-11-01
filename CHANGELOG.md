# CHANGELOG — Fabled Lands Helper

*Une entrée par version, la plus récente en tête ; sous chaque entrée, les fichiers touchés, en sous-puces à deux
espaces de retrait.*

## v0.8.1 — 2026-11-01

- Correctif : au téléphone, les onglets de la fiche passent à la ligne d'eux-mêmes ; sur un écran étroit, ils ne dépassent plus à droite et le bouton-dé reste visible.
  - `css/app.css` : la règle des onglets de la fiche au téléphone (`.rubriques-fiche`, sous `max-width: 520px`) : rangée souple qui passe à la ligne
  - `js/version.js` : `v0.8.1` (le cache hors ligne devient `flh-v0.8.1`)
  - `CHANGELOG.md` : cette entrée

## v0.8 — 2026-11-01

- Les biens : une rubrique « Biens » sur la fiche, avec les investissements et les dépôts (une carte par lieu : sa section en pastille, sa somme à − / +, les conditions d'un dépôt) puis le navire (son nom, son type, la qualité de son équipage, son lieu d'amarrage et sa cargaison, une ligne par unité, « n / max ») ; dans Possessions, sous les possessions transportées, les possessions stockées, une carte par lieu. L'application ne calcule rien. Après un toucher, le focus revient à l'élément touché (sauvegarde au schéma 6).
  - `js/sauvegarde.js` : le schéma 6, la complétion de `stockees`, `investissements`, `depots` et `navire`, `personnageNeuf` avec trois listes vides et `navire: null`
  - `js/regles.js` : `EQUIPAGES`, `ajouterLieu`, `modifierLieu`, `changerSomme`, `ajouterObjetStocke`, `retirerObjetStocke`, `acquerirNavire`, `modifierNavire`, `retirerNavire`, `ajouterCargaison`, `retirerCargaison` ; `retirerDeListe` sert aussi pour les trois listes de lieux
  - `js/feuille.js` : la rubrique Biens (les investissements, les dépôts, le navire et leurs éditeurs), les possessions stockées dans Possessions, le focus après un toucher rendu à l'élément du même rang
  - `js/app.js` : la rubrique `biens`, les routes `#/perso/<id>/biens/i<n>`, `d<n>`, `n` et `#/perso/<id>/possessions/s<n>`
  - `css/app.css` : la feuille de style du lot
  - `js/version.js` : `v0.8` (le cache hors ligne devient `flh-v0.8`)
  - `i18n/fr.json`, `i18n/en.json` : 39 clés neuves (245 clés)
  - `tests/sauvegarde.test.js`, `tests/regles.test.js` : 9 et 15 tests neufs ; les tests du schéma 5 comme schéma courant mis au schéma 6
  - `CHANGELOG.md` : cette entrée

## v0.7 — 2026-11-01

- Les codes et les cases de section du livret d'aventure, pour le livre 1 : une rubrique « Codes » sur la fiche, avec les 35 codes à cocher puis les 42 cases de section, ligne par ligne ; les cases de la section en cours s'affichent aussi sous son numéro, dans Aventure, et s'y cochent ; une quête peut lier des codes, choisis dans la liste et montrés en pastilles. Chaque case se coche seule. L'application ne vérifie rien (sauvegarde au schéma 5).
  - `js/livret.js` : neuf, les listes du livret du livre 1 (`LIVRETS` : 35 codes, 37 lignes de cases) et `lignesDeSection`
  - `js/sauvegarde.js` : le schéma 5, la complétion de `codes`, `cases` et des codes liés de chaque quête, `personnageNeuf` avec `codes` et `cases` vides
  - `js/regles.js` : `basculerCode`, `rangsCoches`, `cocherCase`, `ajouterCodeQuete`, `retirerCodeQuete` ; `ajouterQuete` pose `codes: []`
  - `js/feuille.js` : la rubrique Codes (les codes, puis les cases de section), les cases sous la section en cours (Aventure), les codes liés sur la carte d'une quête et dans son éditeur
  - `js/app.js` : la rubrique `codes`, la route `#/perso/<id>/codes`
  - `js/precache.js` : `js/livret.js` dans le cache hors ligne (28 entrées)
  - `css/app.css` : la feuille de style du lot
  - `js/version.js` : `v0.7` (le cache hors ligne devient `flh-v0.7`)
  - `i18n/fr.json`, `i18n/en.json` : 12 clés neuves (206 clés)
  - `tests/sauvegarde.test.js`, `tests/regles.test.js` : 7 et 11 tests neufs ; les tests du schéma 4 comme schéma courant mis au schéma 5, et ceux de la forme d'une quête
  - `CHANGELOG.md` : cette entrée

## v0.6 — 2026-10-25

- Le journal : deux rubriques de plus sur la fiche. Aventure : la section en cours, que « Aller » change en inscrivant la section quittée dans le chemin parcouru (un toucher sur une section du chemin y ramène) ; les quêtes, avec leurs personnages, leurs sections importantes et la case « Terminée » ; les notes, rattachées à la section et à la date où elles ont été écrites. Combats : le Combat, la Défense et l'Endurance du personnage, celle de la feuille ; un adversaire par carte, avec son Endurance à − / + ; « Fin du combat » le range dans les combats passés. L'application ne calcule rien (sauvegarde au schéma 4).
  - `js/sauvegarde.js` : le schéma 4, la complétion des quatre listes du journal (`historique`, `quetes`, `notes`, `combats`), `personnageNeuf` avec ces listes vides
  - `js/regles.js` : `MAX_HISTORIQUE`, `allerSection`, `ajouterQuete`, `modifierQuete`, `ajouterSectionQuete`, `retirerSectionQuete`, `ajouterNote`, `ajouterAdversaire`, `modifierAdversaire`, `changerEnduranceAdversaire`, `finirCombat` ; `retirerDeListe` sert aussi pour les quêtes, les notes et les combats
  - `js/feuille.js` : les rubriques Aventure (la section en cours, « Aller », le chemin parcouru, les quêtes et leur éditeur, les notes) et Combats (vous, les adversaires et leur éditeur, les combats passés)
  - `js/app.js` : les rubriques `aventure` et `combats`, les routes `#/perso/<id>/aventure/q<n>` et `#/perso/<id>/combats/a<n>`, sans retour en haut de page
  - `css/app.css` : la feuille de style du lot
  - `js/version.js` : `v0.6` (le cache hors ligne devient `flh-v0.6`)
  - `i18n/fr.json`, `i18n/en.json` : 39 clés neuves (194 clés)
  - `tests/sauvegarde.test.js`, `tests/regles.test.js` : 9 et 17 tests neufs ; les tests du schéma 3 comme schéma courant mis au schéma 4
  - `CHANGELOG.md` : cette entrée

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
