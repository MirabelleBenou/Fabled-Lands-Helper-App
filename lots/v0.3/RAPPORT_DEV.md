# RAPPORT DU DEV — La feuille d'aventure · `v0.3`
### 24 octobre 2026 · dev Opus (High) · branche `lot/v0.3`

## 1 · Ce dont je ne suis pas sûr

- **`js/vues.js` exporte deux fonctions de plus** : `el` (la fabrique d'éléments) et `ligneProfession`, que `js/feuille.js`
  réutilise au lieu d'en écrire des doubles. Le cadrage (§2-36) dit que `vues.js` « perd la création et la fiche et ce
  qui ne sert qu'à elles » ; ces deux fonctions servent aussi à l'accueil, elles y restent, exportées. `lienRetour` et
  `DELAI_CONFIRMATION`, qui ne servaient qu'à la fiche, sont passés dans `js/feuille.js`.
- **`js/sauvegarde.js` importe `COMPETENCES` de `js/regles.js`**, pour ne pas écrire la liste des six compétences deux
  fois. `js/sauvegarde.js` reste importable dans Node (le rituel le charge : `sauvegardes: lues=2/2 schema=2`).
- **Ce qui existait déjà et que j'ai repris au lieu de le créer** : la complétion d'un personnage (`completer`, privée
  dans `js/sauvegarde.js`) est devenue `completerPersonnage`, exportée (§2-3) ; la suppression en deux touchers de
  l'ancienne fiche est reprise telle quelle dans `js/feuille.js`.
- **Les fonctions de bornes que je nomme** (§2-7), toutes dans `js/regles.js` : `changerEndurance`, `changerEnduranceMax`,
  `changerNiveau`, `changerBase`, `ajouterBonus`, `retirerBonus`, `changerBourse`, `operationBourse`, `ajouterPossession`,
  `ajouterTitre`, `retirerDeListe`, `ajouterEntree`, `feuilleLibre`, et les lecteurs de saisie `entierSaisi`,
  `nombreDepart`. Chacune rend une copie, ou `null` quand la règle refuse (rien ne s'enregistre).
- **Les compteurs « − / + » de la Bourse** (§2-26) n'ont pas de règle écrite : je les borne à ≥ 0, comme la Bourse
  (§2-7), sans message.
- **La file des changements** : chaque toucher est enregistré l'un après l'autre (une file de promesses dans
  `js/feuille.js`) et la fiche attend la fin des écritures en cours avant de se relire. Sans cela, deux touchers rapides
  pouvaient lire la même valeur. C'est une précaution d'exécution ; le cadrage ne la nomme pas.
- **Le focus** (§2-19) revient sur l'élément au même `data-test`, avec `preventScroll` pour que la page ne saute pas.
  Pour un bouton « Retirer » (sans `data-test` au cadrage), le focus n'est pas rendu.

## 2 · Le commit de livraison et les portes

**Commit de livraison** : `90023b6646c168ffcb5c0fd8bf7b6ad4fa571574` (« Lot v0.3 — livraison »). Base :
`main` = `ec237aff40c75e0cec9a73ec4c1c03772be6d426`.

| porte | attendu | mesuré sur `mesure/` | |
|---|---|---|---|
| P0 | bloc « base » ; `main` = `ec237af…` | bloc identique ligne pour ligne ; `git rev-parse origin/main` = `ec237aff40c75e0cec9a73ec4c1c03772be6d426` ; auto-essai de la base `autotest: 50/50` | OK |
| P1 | `v0.3`, cohérente | `version: code=v0.3 changelog=v0.3 cache=flh-v0.3 coherente=oui` | OK |
| P2 | 35 fichiers, 0 cache | `fichiers: 35` · `poids: 305843` · `caches: 0` · pas de `node_modules/` | OK |
| P3 | 18/18 | `syntaxe: 18/18` | OK |
| P4 | ≥ 55 passés, 0 échec ; sauvegardes 2/2 | `tests: 82 passed, 0 failed` · `sauvegardes: lues=2/2 schema=2` | OK |
| P5 | 137 = 137, 0 / 0 / 0 | `i18n: fr=137 en=137 manquantes=0 orphelines=0 inconnues=0` | OK |
| P6 | 0 externe, `PRECACHE` 26, 0 / 0 | `horsligne: externes=0 precache=26 manquants=0 en_trop=0` | OK |
| P7 | `ecran: rendus=96 verifs=568/568 console=0 externes=0 debords=0 horsligne_reel=ok` | la même ligne, à l'octet | OK |
| P8 | schéma 2 avec sa migration ; références relues | `SCHEMA = 2` ; `lues=2/2 schema=2` ; migration couverte par les tests | OK |
| P9 | 0 « à compléter », première entrée `v0.3` | `changelog: a_completer=0` ; `## v0.3 — 2026-10-24` | OK |
| P10 | `ecart: ajoutes=6 modifies=11 retires=0`, liste du §4 | la même ligne ; la liste du §4 exactement | OK |
| P11 | empreinte annoncée | `6650ff8470e9fa70e076459ed04cb3debc7e85e9933602232e2ffdc592194f87` | OK |
| P12 | les fichiers du banc du §4 | `banc/README.md`, `banc/autotest.mjs`, `banc/lib/contrat.mjs`, `banc/rituel.mjs`, `banc/sauvegardes/README.md`, `banc/sauvegardes/v0.3-exemple.json` ; `PROMPT_DEV_FLH.md`, `.gitattributes`, `.gitignore`, `.github/` intacts | OK |

**Mes comptes** : poids **305843** octets ; **82 tests** (30 existants + 52 neufs) — `tests/regles.test.js` **25**,
`tests/pretires.test.js` **8**, `tests/sauvegarde.test.js` **33** (14 existants adaptés, **19** neufs) ; empreinte
`6650ff8470e9fa70e076459ed04cb3debc7e85e9933602232e2ffdc592194f87` ; auto-essai du banc livré **n = 55**.

## 3 · Les critères du lot

- **C1 — tenu.** Les deux blocs du §5 sont rendus à l'octet, aux comptes annoncés près (sorties brutes au § 5).
- **C2 — tenu.** `ecran.mjs` du banc livré (copie hors du clone, `npm ci` fait) sur `mesure/` avec
  `lots/v0.3/controles.json` : `ecran: rendus=96 verifs=568/568 console=0 externes=0 debords=0 horsligne_reel=ok`.
- **C3 — tenu.** Le rituel du banc livré sur `base/`, avec les sauvegardes du banc de `main` (`v0.1-exemple.json`
  seule), redonne le bloc « base » à l'octet (`cmp` identique à la sortie du banc de `main`).
- **C4 — tenu.** L'auto-essai du banc livré : `autotest: 55/55`, aucune ligne `ECHEC` (50 de `banc-v1` + 5 neuves :
  la référence D17, D17 ×2, D18 ×2).
- **C5 — tenu.** `css/app.css` = `b39a5065…1356` ; `banc/sauvegardes/v0.3-exemple.json` = `650acb66…72d5`.
- **C6 — tenu.** Aucun `innerHTML` dans `js/` ; aucune clé construite (les clés par code passent par les tables
  `NOM_COMPETENCE`, `ABR_COMPETENCE`, `RUBRIQUES`, `CULTES` de `js/feuille.js`, chaque clé écrite en entier) ; le seul
  attribut `style` est la largeur du `span` de la jauge ; la seule adresse `http(s)://` du code servi est dans
  `js/liens.js` (le rituel compte `externes=0`, et sur l'archive `grep http js/*.js` hors `liens.js` ne trouve rien).
  Les textes de l'interface viennent des dictionnaires ; les seuls littéraux affichés sont les signes que le cadrage
  donne (`−` U+2212, `+`, `×` U+00D7, `—` U+2014, ` · `, ` / `) et les données des pré-tirés (en français, §2-9).
- **C7 — tenu.** `tests/regles.test.js` (25) : `totalCompetence` sans bonus, avec bonus et malus, négatif ; `defense`,
  dont un bonus de Combat qui n'y entre pas ; `signe` dans ses trois cas ; chaque borne du §2-7. `tests/pretires.test.js`
  (8) : 9 pré-tirés, identifiants uniques, ordre ; `defense()` = la Défense publiée pour chacun ; relecture par
  `lire(construireExport([…]))` sans changement ; `LIENS.pretires`. `tests/sauvegarde.test.js` (19 neufs) : migration du
  schéma 1 ; un schéma 2 complet relu sans changer ; chaque ligne du tableau du §2-2 dans son cas invalide ; plus de 12
  possessions conservées ; champ inconnu conservé ; `schema: 3` → `SCHEMA_RECENT` ; `construireExport` au schéma 2 ;
  `completerPersonnage` (le stockage).
- **C8 — tenu.** Le rituel passé deux fois sur `mesure/` : sorties identiques (`cmp`). Le contrôle d'écran passé deux
  fois sur `mesure/` : lignes identiques (`cmp`, captures exclues).
- **C9 — tenu.** Le parcours de bout en bout (script Playwright dans `/tmp/c9/`, jamais commité, sur une copie de
  `mesure/` servie par le serveur du banc, Chromium du banc, tablette 800 × 1280, FR) : `parcours: 14/14` (sortie au § 5).

## 4 · La maquette

Sans objet : le cadrage n'en demande pas au dev. Aucune capture ouverte ; les captures sont restées hors du dépôt.

## 5 · Les sorties brutes, sur `mesure/`

**Environnement** : `/bin/bash` · Node `v22.23.4` · npm `10.9.9` · git `2.43.0`.

**P0, le rituel sur `base/`** (banc de `main`) :

```
fichiers: 29
poids: 222970
caches: 0
syntaxe: 12/12
tests: 30 passed, 0 failed
sauvegardes: lues=1/1 schema=1
i18n: fr=61 en=61 manquantes=0 orphelines=0 inconnues=0
horsligne: externes=0 precache=22 manquants=0 en_trop=0
version: code=v0.2 changelog=v0.2 cache=flh-v0.2 coherente=oui
changelog: a_completer=0
empreinte: 577b35c25c2d9b262d0cdbe919ccf7d547a7b5ccd93ee5a666ef0e4a24432f89
```

Auto-essai du banc de `main` : `autotest: 50/50`, aucune ligne `ECHEC`.

**Le rituel sur `mesure/`** (banc de la livraison, `banc/sauvegardes/` : deux fichiers) :

```
fichiers: 35
poids: 305843
caches: 0
syntaxe: 18/18
tests: 82 passed, 0 failed
sauvegardes: lues=2/2 schema=2
i18n: fr=137 en=137 manquantes=0 orphelines=0 inconnues=0
horsligne: externes=0 precache=26 manquants=0 en_trop=0
version: code=v0.3 changelog=v0.3 cache=flh-v0.3 coherente=oui
changelog: a_completer=0
empreinte: 6650ff8470e9fa70e076459ed04cb3debc7e85e9933602232e2ffdc592194f87
```

**La mesure commune** `ecart.mjs base mesure` :

```
M CHANGELOG.md
M css/app.css
M i18n/en.json
M i18n/fr.json
M js/app.js
A js/feuille.js
A js/liens.js
M js/precache.js
A js/pretires.js
A js/regles.js
M js/sauvegarde.js
M js/stockage.js
M js/version.js
M js/vues.js
A tests/pretires.test.js
A tests/regles.test.js
M tests/sauvegarde.test.js
ecart: ajoutes=6 modifies=11 retires=0
```

**Le contrôle d'écran** (dernière ligne, deux passages identiques) :

```
ecran: rendus=96 verifs=568/568 console=0 externes=0 debords=0 horsligne_reel=ok
```

**L'auto-essai du banc livré** (les lignes neuves et la dernière) :

```
ok    D17 référence : l'essai avec un js/liens.js à LIENS vide, horsligne à zéro [horsligne: externes=0 precache=13 manquants=0 en_trop=0]
ok    D17 une adresse ajoutée à LIENS dans js/liens.js : horsligne inchangé (externes reste à 0) [horsligne: externes=0 precache=13 manquants=0 en_trop=0 -> horsligne: externes=0 precache=13 manquants=0 en_trop=0]
ok    D17 aucune autre ligne n'a bougé (hors fichiers, poids, empreinte) [aucune autre]
ok    D18 la même adresse écrite dans un autre fichier : externes +1 [horsligne: externes=0 precache=13 manquants=0 en_trop=0 -> horsligne: externes=1 precache=13 manquants=0 en_trop=0]
ok    D18 seule cette ligne a bougé (hors fichiers, poids, empreinte) [aucune autre]
autotest: 55/55
```

**Le parcours de bout en bout (C9)** :

```
ok    1 création d'un pré-tiré : Défense 7, 9 / 9, Combat 5, lien Alkonost target=_blank [7 | 9 / 9 | 5 | https://alkonost-editions.com/collections/livres-jeux/fabled-lands/personnages-pretires/livres-1-2/ | _blank | noopener | Liana la Vive]
ok    2 l'Endurance : 7 / 9, après rechargement 7 / 9, puis + trois fois → 9 / 9 [7 / 9 | 7 / 9 | 9 / 9]
ok    3 un bonus : total 6, puce +1 Épée, Défense 7 ; 0 → rien ; sans raison → rien ; Retirer → 5 [6 | +1 Épée | 7 | 1 0/Rien | 1 | 5]
ok    4 la position : déplier Adresse ne bouge pas la page de plus de 1 px [avant=836 après=836]
ok    5 l'Endurance maximale : max 6 → actuelle 6 ; Niveau 2 → Défense 8 [6 / 6 | 8]
ok    6 la Bourse : dépenser 10 → 6, montant vidé ; 100 → refusé, message ; gagner 5 → 11, message vidé [6 chardes |  | 6 chardes | La bourse ne contient que 6 chardes. | 11 chardes | ]
ok    7 les 12 possessions : champ et bouton disabled, plein ; une retirée → actif [true | true | 1 | true | 0 | 11 / 12]
ok    8 titres, histoire, cultes : titre par Entrée, histoire après rechargement, bénédiction ajoutée puis retirée [Ami des Rangers× | Partie de Sokar. | Alvir et Valmir 1 | Aucune bénédiction.]
ok    9 la saisie libre : Niveau 1, Endurance 12 / 12, Défense 4 [Essai | Niveau 1 | 12 / 12 | 4 | 0]
ok    10 le personnage de la v0.2 : fiche ouverte, 0 / 0, Défense = niveau ; listé à l'accueil [Aldo | 0 / 0 | 3 | Essai,Liana la Vive,Aldo]
ok    11 l'export et l'import : schéma 2, réimport à l'identique ; ancien.json ajoute ses deux personnages [schema=2 identique=true Personnages importés : 2 | 5 (avant 3)]
ok    12 la suppression : deux touchers → accueil, personnage absent [Confirmer la suppression | Essai,Liana la Vive,Aldwen de Marlock,Brunehaut]
ok    13 le focus : Entrée sur « + » → le focus est sur le même bouton après le rendu [endurance-plus 6 / 6]
ok    14 aucune erreur de console et aucune requête vers un autre hôte [console=0 externes=0]
parcours: 14/14
```

*Détails du parcours* : point 4, fenêtre ramenée à 800 × 600 pour que la page défile, la ligne Adresse amenée à l'écran
puis la page défilée de 200 px de plus avant de la déplier. Point 10, le personnage du schéma 1 (niveau 3) est écrit par
`indexedDB.open('flh', 1)` dans le magasin `personnages`. Point 11, le personnage modifié est retiré de la base puis
réimporté depuis le fichier exporté, et comparé à l'octet (JSON) avec ce qui était stocké avant l'export.

## 6 · Les écarts au cadrage

- **Aucun écart sur ce que le cadrage commande.**
- **Les quatre choix d'exécution** sont au § 1 : les exports de `vues.js`, l'import de `COMPETENCES` dans
  `sauvegarde.js`, le comportement des « − / + » de la Bourse, la file des changements.
- **L'auto-essai** : D17 et D18 se comparent à une référence (l'essai muni d'un `js/liens.js` à `LIENS` vide et déclaré
  dans `PRECACHE`), pas à l'essai sain. Sans cela, ajouter `js/liens.js` ferait aussi bouger `syntaxe` et `manquants`, et
  la vérification « les autres lignes ne bougent pas » ne pourrait pas tenir. La référence compte pour une vérification.
- **`banc/README.md`** : en plus de la définition de `horsligne` (§ 3) et du point 9 du contrat (§ 4), rien d'autre n'a
  changé ; le tableau des défauts plantés du § 5 ne cite pas D17 et D18 (le cadrage ne le demandait pas).

## 7 · La méthode

- Début : `Sat Oct 24 19:32:48 CEST 2026` ; fin du rapport : 20 h 18 CEST.
- Aucune intervention, aucun arrêt.
- Ce qui m'a ralenti : la durée des contrôles d'écran (96 rendus, chacun avec son navigateur, environ 13 minutes par
  passage) et de l'auto-essai (environ 12 minutes) ; le moniteur d'attente expire toutes les 5 minutes et doit être
  relancé.
- Les commits de travail ont été fondus en un seul commit de livraison avant le premier push : la branche porte le
  cadrage, la livraison, puis ce rapport.
