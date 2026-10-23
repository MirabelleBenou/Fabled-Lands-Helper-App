# RAPPORT DU DEV — lot `banc-v1`

Dev : Sonnet · High · 23 octobre 2026 · branche `lot/banc-v1` · base `6ce323c3eb9edf3a5f70c8cd3b16a6f6da9ee31c`.
Le cadrage se lit avec `ADDENDUM_1.md` (bloc « base », ligne 9 : `cache=absent`), qui répond à `ARRET_1.md`.

## 1 · Ce dont je ne suis pas sûr

- **Rien qui bloque.** Points à connaître, déjà confirmés conformes par l'addendum 1 : contrôle de syntaxe en module par
  l'entrée standard ; D1 planté en `node_modules/x/README.md`, D3 en test ajouté dans un fichier existant ; un Chromium par
  rendu ; `externes` compté en adresses distinctes, console et requêtes mesurées sur la page finale après au plus 5 s de
  réseau calme, `console` non contrainte pour D13.
- **Le P3 du prompt du dev** (`node --check` sur chaque `.js` servi) est aveugle sur un `.js` à `import`/`export` d'un dossier
  sans `package.json` à `"type": "module"` (Node 22.22, mesuré) ; le rituel, lui, contrôle en module. Le prompt est au CdP.
- **Durée de l'auto-essai** : environ 1 min 20 (un navigateur par rendu). Si une machine plus lente dépasse un délai interne
  (10 s pour `data-pret`, 5 s de réseau calme), le rendu concerné compte comme raté plutôt que de bloquer.
- **Code existant qui ferait ce que le cadrage demande de créer** : aucun (le dépôt de base ne porte que `CHANGELOG.md`).
- Environnement (§2 du prompt) : `echo $0` → `/bin/bash` ; `node --version` → `v22.22.0` ; `npm --version` → `10.9.4` ;
  `git --version` → `git version 2.43.0`. Pas d'écart.

## 2 · Le commit de livraison et les portes

Commit de livraison : **`84c88055dc425975055b285b43dcde9008cfabff`** (« Lot banc-v1 — livraison »), 29 fichiers, tous sous
`banc/`. Les portes sont lues sur `mesure/` = `git archive 84c88055…`.

| porte | attendu | mesuré |
|---|---|---|
| P0 base = bloc « base » corrigé | égal, ligne pour ligne | égal (`cmp` sans différence) ; tête de `main` = `6ce323c3eb9edf3a5f70c8cd3b16a6f6da9ee31c` |
| P1 version | aucune | `code=absente changelog=absente cache=absent coherente=sans-objet` |
| P2 fichiers de l'archive | 1 | 1 (`CHANGELOG.md`), 232 octets, 0 cache |
| P3 à P8 | sans objet pour l'archive (voir C3 à C5) | sans objet |
| P9 `CHANGELOG` | inchangé | inchangé : `changelog: a_completer=0`, fichier identique |
| P10 écart base → mesure | `ecart: ajoutes=0 modifies=0 retires=0` | idem |
| P11 empreinte | `07b6f76c…3c72` | `07b6f76cdc25cf99b81333c21ccf0645ac3378eb23894fb00f9e3ce6a9573c72` |
| P12 hors du code | seuls `banc/**` (et `lots/banc-v1/…`) | `git diff --name-only origin/main 84c8805` : `banc/**` et `lots/banc-v1/CADRAGE.md` (commit de cadrage) ; `git diff --stat origin/main 84c8805 -- PROMPT_DEV_FLH.md .gitattributes .gitignore .github CHANGELOG.md` vide |

Comptes annoncés : 29 fichiers ajoutés sous `banc/` (dont 13 pour la mini-application d'essai et 2 pour ses sauvegardes et
contrôles) ; 0 fichier ajouté, modifié ou retiré dans l'archive de déploiement ; 5 tests dans l'essai (2 fichiers) ; 6 clés
de traduction dans l'essai (FR = EN) ; 0 `node_modules/` suivi.

## 3 · Les critères du cadrage

| critère | résultat | mesure |
|---|---|---|
| C1 | **OK** | le rituel sur `mesure/` égale à l'octet le bloc « base » corrigé par l'addendum 1 (onze lignes, `cmp` sans différence) |
| C2 | **OK** | `ecart: ajoutes=0 modifies=0 retires=0`, seule ligne |
| C3 | **OK** | `autotest: 50/50`, 0 ligne `ECHEC` ; l'essai sain et D1 à D16 y sont nommés |
| C4 | **OK** | les 9 vérifications « l'essai sain doit donner » de l'auto-essai sont `ok` (caches 0, syntaxe 9/9, tests 5 passed 0 failed, sauvegardes 1/1 schema=1, i18n 6/6 à zéro, horsligne à zéro, coherente=oui, a_completer=0, écran 64/64 console=0 externes=0 debords=0 horsligne_reel=ok) |
| C5 | **OK** | 16 rendus (2 cas × 8), 16 captures `<cas>_<largeur>_<langue>_<theme>.png` |
| C6 | **OK** | deux exécutions identiques à l'octet : rituel sur `mesure/`, mesure commune, lignes de rendu du contrôle d'écran (et le rituel et le contrôle d'écran de l'essai sain, dans l'auto-essai) |
| C7 | **OK** | empreinte de l'essai sain inchangée après rituel et contrôle d'écran (vérifiée dans l'auto-essai et par `sha256sum` avant/après) |
| C8 | **OK** | `package.json` : `playwright-core` `1.64.1`, `@sparticuz/chromium` `153.0.0`, rien d'autre, sans `^` ni `~` ; `npm ci` passe dans une copie neuve (`package.json` + lock seuls) ; `git ls-files | grep -c node_modules` = 0 |
| C9 | **OK** | `grep -rniE "fabled|forêt|golnir|sukh|chasm" banc` = 0 occurrence ; textes de l'essai neutres |

## 4 · La maquette

Sans objet (lot d'outillage, aucune image).

## 5 · Les sorties brutes

### Rituel sur `base/` (`git archive origin/main`)

```
fichiers: 1
poids: 232
caches: 0
syntaxe: 0/0
tests: aucun
sauvegardes: lues=0/0 schema=absent
i18n: absente
horsligne: externes=0 precache=absent manquants=0 en_trop=0
version: code=absente changelog=absente cache=absent coherente=sans-objet
changelog: a_completer=0
empreinte: 07b6f76cdc25cf99b81333c21ccf0645ac3378eb23894fb00f9e3ce6a9573c72
```

### Rituel sur `mesure/` (deux exécutions, identiques)

```
fichiers: 1
poids: 232
caches: 0
syntaxe: 0/0
tests: aucun
sauvegardes: lues=0/0 schema=absent
i18n: absente
horsligne: externes=0 precache=absent manquants=0 en_trop=0
version: code=absente changelog=absente cache=absent coherente=sans-objet
changelog: a_completer=0
empreinte: 07b6f76cdc25cf99b81333c21ccf0645ac3378eb23894fb00f9e3ce6a9573c72
```

### Mesure commune `node banc/ecart.mjs base mesure` (deux exécutions, identiques)

```
ecart: ajoutes=0 modifies=0 retires=0
```

### Rituel sur l'essai sain

```
fichiers: 15
poids: 8499
caches: 0
syntaxe: 9/9
tests: 5 passed, 0 failed
sauvegardes: lues=1/1 schema=1
i18n: fr=6 en=6 manquantes=0 orphelines=0 inconnues=0
horsligne: externes=0 precache=12 manquants=0 en_trop=0
version: code=v0.0 changelog=v0.0 cache=flh-v0.0 coherente=oui
changelog: a_completer=0
empreinte: dcfae71875b7b4cf75745821e64c182c40591a0866b4f46a5d6a8f605645d033
```

### Contrôle d'écran sur l'essai sain (deux exécutions, identiques)

```
accueil tablette fr jour verifs=4/4 console=0 externes=0 debord=0
accueil tablette fr chandelle verifs=4/4 console=0 externes=0 debord=0
accueil tablette en jour verifs=4/4 console=0 externes=0 debord=0
accueil tablette en chandelle verifs=4/4 console=0 externes=0 debord=0
accueil telephone fr jour verifs=4/4 console=0 externes=0 debord=0
accueil telephone fr chandelle verifs=4/4 console=0 externes=0 debord=0
accueil telephone en jour verifs=4/4 console=0 externes=0 debord=0
accueil telephone en chandelle verifs=4/4 console=0 externes=0 debord=0
perso tablette fr jour verifs=4/4 console=0 externes=0 debord=0
perso tablette fr chandelle verifs=4/4 console=0 externes=0 debord=0
perso tablette en jour verifs=4/4 console=0 externes=0 debord=0
perso tablette en chandelle verifs=4/4 console=0 externes=0 debord=0
perso telephone fr jour verifs=4/4 console=0 externes=0 debord=0
perso telephone fr chandelle verifs=4/4 console=0 externes=0 debord=0
perso telephone en jour verifs=4/4 console=0 externes=0 debord=0
perso telephone en chandelle verifs=4/4 console=0 externes=0 debord=0
ecran: rendus=16 verifs=64/64 console=0 externes=0 debords=0 horsligne_reel=ok
```

### Auto-essai complet (`node banc/autotest.mjs`)

```
ok    sain rituel : onze lignes [11]
ok    sain caches 0 [caches: 0]
ok    sain syntaxe total/total [syntaxe: 9/9]
ok    sain tests : au moins 2 passés, 0 échoué [tests: 5 passed, 0 failed]
ok    sain sauvegardes : toutes lues, au moins une, schema=1 [sauvegardes: lues=1/1 schema=1]
ok    sain i18n : manquantes=0 orphelines=0 inconnues=0, au moins 3 clés [i18n: fr=6 en=6 manquantes=0 orphelines=0 inconnues=0]
ok    sain horsligne : externes=0 manquants=0 en_trop=0 [horsligne: externes=0 precache=12 manquants=0 en_trop=0]
ok    sain version : coherente=oui [version: code=v0.0 changelog=v0.0 cache=flh-v0.0 coherente=oui]
ok    sain changelog : a_completer=0 [changelog: a_completer=0]
ok    sain écran : au moins 16 rendus [16]
ok    sain écran : toutes les vérifications passées [64/64]
ok    sain écran : console=0 externes=0 debords=0 [console=0 externes=0 debords=0]
ok    sain écran : horsligne_reel=ok [ok]
ok    sain écran : une capture par rendu, nommée <cas>_<largeur>_<langue>_<theme>.png [16 captures]
ok    sain écran : rendus dans l'ordre cas, largeur, langue, thème
ok    sain rituel déterministe (deux exécutions identiques)
ok    sain écran déterministe (lignes de rendu identiques sur deux exécutions)
ok    sain mesure commune déterministe
ok    sain dossier mesuré intact (empreinte avant = après rituel et écran)
ok    D1 un fichier sous node_modules : caches [caches: 0 -> caches: 1]
ok    D1 seule cette ligne a bougé (hors fichiers, poids, empreinte) [aucune autre]
ok    D2 une erreur de syntaxe dans un .js de l'application : syntaxe [syntaxe: 9/9 -> syntaxe: 8/9]
ok    D2 seule cette ligne a bougé (hors fichiers, poids, empreinte) [aucune autre]
ok    D3 un test qui échoue : tests [tests: 5 passed, 0 failed -> tests: 5 passed, 1 failed]
ok    D3 seule cette ligne a bougé (hors fichiers, poids, empreinte) [aucune autre]
ok    D4 une sauvegarde de référence illisible : sauvegardes [sauvegardes: lues=1/1 schema=1 -> sauvegardes: lues=1/2 schema=1]
ok    D4 seule cette ligne a bougé (hors fichiers, poids, empreinte) [aucune autre]
ok    D5 une clé retirée de en.json : i18n [i18n: fr=6 en=6 manquantes=0 orphelines=0 inconnues=0 -> i18n: fr=6 en=5 manquantes=1 orphelines=0 inconnues=0]
ok    D5 seule cette ligne a bougé (hors fichiers, poids, empreinte) [aucune autre]
ok    D6 une clé utilisée dans le HTML et définie nulle part : i18n [i18n: fr=6 en=6 manquantes=0 orphelines=0 inconnues=0 -> i18n: fr=6 en=6 manquantes=0 orphelines=0 inconnues=1]
ok    D6 seule cette ligne a bougé (hors fichiers, poids, empreinte) [aucune autre]
ok    D7 une URL https:// dans une feuille de style : horsligne [horsligne: externes=0 precache=12 manquants=0 en_trop=0 -> horsligne: externes=1 precache=12 manquants=0 en_trop=0]
ok    D7 seule cette ligne a bougé (hors fichiers, poids, empreinte) [aucune autre]
ok    D8 un fichier servi retiré de PRECACHE : horsligne [horsligne: externes=0 precache=12 manquants=0 en_trop=0 -> horsligne: externes=0 precache=11 manquants=1 en_trop=0]
ok    D8 seule cette ligne a bougé (hors fichiers, poids, empreinte) [aucune autre]
ok    D9 VERSION changée sans le CHANGELOG : version [version: code=v0.0 changelog=v0.0 cache=flh-v0.0 coherente=oui -> version: code=v0.1 changelog=v0.0 cache=flh-v0.1 coherente=non]
ok    D9 seule cette ligne a bougé (hors fichiers, poids, empreinte) [aucune autre]
ok    D10 à compléter ajouté au CHANGELOG : changelog [changelog: a_completer=0 -> changelog: a_completer=1]
ok    D10 seule cette ligne a bougé (hors fichiers, poids, empreinte) [aucune autre]
ok    D11 débords = rendus du cas [debords=8 pour 8 rendus]
ok    D11 les autres mesures sont saines
ok    D12 console = nombre de rendus [console=16 pour 16 rendus]
ok    D12 les autres mesures sont saines
ok    D13 externes >= nombre de rendus [externes=16 pour 16 rendus]
ok    D13 les autres mesures sont saines (la console peut signaler l'échec du chargement)
ok    D14 horsligne_reel=sans-sw [sans-sw]
ok    D14 les autres mesures sont saines
ok    D15 vérifications ratées sur des rendus FR, et eux seuls [4 rendus ratés, tous FR : true]
ok    D15 les autres mesures sont saines
ok    D16 un ajouté, un modifié, un retiré : lignes A, M, D justes et résumé [M CHANGELOG.md | A ajout.txt | D manifest.webmanifest | ecart: ajoutes=1 modifies=1 retires=1]
autotest: 50/50
```

## 6 · Écarts au cadrage

- **Bloc « base », ligne 9** : `cache=absente` dans le cadrage, `cache=absent` produit (le §C-15 fait foi) ; réglé par
  l'addendum 1. Aucun changement de code.
- **Contrôle de syntaxe** : `node --input-type=module --check` sur l'entrée standard plutôt que `node --check <fichier>`
  (qui laisse passer des erreurs sur les modules sans `package.json` `type: module`). La ligne `syntaxe` mesure ce que le
  cadrage veut qu'elle mesure ; confirmé par l'addendum.
- **Un Chromium par rendu** : les arguments du paquet (`--single-process`) font que fermer un contexte arrête le navigateur.
  Confirmé par l'addendum.
- **Précisions de mesure** (confirmées) : `externes` en adresses distinctes par rendu ; attente de réseau calme (5 s au plus)
  avant mesure ; l'état est importé sur une page puis le rendu repart d'une page vierge (console et requêtes mesurées sur
  la page finale).
- **Fichiers non nommés au §4** : `banc/lib/args.mjs`, `fichiers.mjs`, `serveur.mjs`, `contrat.mjs` (couverts par « `banc/lib/…`
  au besoin ») ; `banc/essai/` compte 13 fichiers (dont `css/style.css`, `js/app.js`, `js/i18n.js`, `js/personnages.js`).
- La mini-application d'essai stocke son état en `localStorage` (suffisant pour l'essai ; le produit utilisera IndexedDB).

## 7 · La méthode

- Début : 23 octobre 2026, 15:58 (CEST) ; livraison poussée vers 16:15 ; arrêt 1 puis reprise ; fin : 16:25 environ.
- Interventions : une erreur d'usage du premier rituel de `caches` dans l'auto-essai (corrigée) ; D2/D3 d'abord en ECHEC (voir
  ci-dessous) ; D13 instable sur `console` avant l'attente de réseau calme.
- Ce qui m'a ralenti : (1) le Chromium du paquet s'arrête quand un contexte se ferme (`--single-process`) ; (2) `node --check`
  muet sur les modules sans `type: module`, qui faisait échouer D2 à la première passe ; (3) D3 faisait bouger `syntaxe` quand
  le test échouant était un nouveau fichier. Les trois ont été réglés en changeant le lieu de plantation ou l'outil, jamais
  en relâchant une vérification.
- Rien n'a été poussé sur `main`, aucun tag, aucun `--force`. Dossiers de travail : `/home/claude/dev_banc-v1/`.
