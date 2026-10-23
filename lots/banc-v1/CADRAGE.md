# CADRAGE — Le banc d'essai · `banc-v1` (lot d'outillage, sans version)
### 23 octobre 2026 · CdP-1 · branche `lot/banc-v1` de `MirabelleBenou/Fabled-Lands-Helper-App` · base `6ce323c`

**Dev : Sonnet · High · session neuve**

---

## §0 · Les pièces

- **La base** : `main` au `6ce323c3eb9edf3a5f70c8cd3b16a6f6da9ee31c`. Si la tête de `main` n'est pas ce commit : arrêt.
- **Sur cette branche** : ce cadrage, et rien d'autre.
- **À lire avant de construire** : `PROMPT_DEV_FLH.md` (racine), puis ce cadrage. `.gitattributes` (ce qui sort de
  l'archive).
- **Particularité de ce lot** : le banc n'existe pas encore, et la base ne contient aucune application (son archive ne
  porte que `CHANGELOG.md`). Le prompt du dev le prévoit : P0 se réduit à ce que nomme le §5. Le banc s'éprouve sur une
  **mini-application d'essai** qu'il porte lui-même.

## §1 · Ce que fait le lot, et pourquoi

Fabled Lands Helper sera une application web autoportée (HTML, CSS, JavaScript natifs en modules ES, sans build, PWA
hors ligne, FR et EN), servie par GitHub Pages depuis `git archive` de `main`. Avant tout lot de produit, il faut
l'outillage qui **mesure une archive déballée, à froid** : c'est le banc. Ce lot le construit dans `banc/` (hors de
l'archive de déploiement) et prouve que **chaque mesure attrape le défaut qu'elle est censée attraper**, sur une
mini-application d'essai. À la fin, la réception de chaque lot futur se joue par trois commandes : le rituel, la mesure
commune base → livraison, le contrôle d'écran.

## §2 · Les décisions et les règles

### A · Généralités

1. **Tout vit dans `banc/`.** Node 22, modules ES (`"type": "module"` dans `banc/package.json`). Aucun Python, aucun
   script shell nécessaire à l'usage (une commande `node …` par instrument).
2. **Deux dépendances, et deux seulement**, épinglées **à la version exacte** dans `banc/package.json` et figées par
   `banc/package-lock.json` : `playwright-core` **1.64.1** et `@sparticuz/chromium` **153.0.0**. Chromium se lance par
   `playwright-core` avec `executablePath: await chromium.executablePath()` et `args: chromium.args`, sans affichage.
   `npx playwright install` est interdit (le CDN est refusé dans ce bac à sable). L'installation se fait par `npm ci`
   dans une copie du banc ; `node_modules/` n'est jamais commité.
3. **Les sorties sont en français, déterministes et stables** : mêmes entrées → mêmes lignes, dans le même ordre, sans
   chemin absolu, sans date, sans durée (sauf sur la sortie d'erreur). Un chemin affiché est relatif au dossier mesuré,
   séparateur `/`, sans `./` en tête. Les listes se trient par ordre d'octets (comme `LC_ALL=C sort`).
4. **Code de sortie** : `0` quand la mesure a pu se faire, quel que soit ce qu'elle mesure ; non nul seulement quand
   l'instrument lui-même échoue (dossier introuvable, Chromium qui ne démarre pas, fichier de contrôles illisible), avec
   la raison sur la sortie d'erreur. **Un instrument ne juge pas** : il mesure ; la comparaison aux attendus est faite par
   le CdP et le dev.
5. **Aucune écriture dans le dossier mesuré.** Ce qui doit s'exécuter (les tests) s'exécute sur une copie temporaire,
   supprimée ensuite. Les captures vont dans le dossier de sortie, par défaut `banc/sorties/` (déjà ignoré par git).
6. **Le banc ne dépend pas du réseau à l'usage** (après `npm ci`) : le serveur statique est écrit dans le banc avec le
   module `node:http`, sur `127.0.0.1`, port libre choisi par le système.

### B · Le contrat entre le banc et l'application

*Le banc mesure une application qui respecte ce contrat. Il est écrit dans `banc/README.md`, au §« Le contrat », et la
mini-application d'essai le respecte entièrement. Un élément absent du dossier mesuré n'est pas une erreur de
l'instrument : il s'affiche comme `absente` / `absent` / `aucun`, selon les lignes du §C.*

7. **La version** : le module `js/version.js` exporte `VERSION`, une chaîne `vX.Y` ou `vX.Y.Z`.
8. **Le cache hors ligne** : le module `js/precache.js` exporte `CACHE_NAME` (chaîne) et `PRECACHE` (tableau de chemins
   relatifs à la racine, sans `./` ni `/` en tête). La règle de cohérence : `CACHE_NAME === "flh-" + VERSION`.
9. **Les fichiers que le cache doit couvrir** : tous les fichiers de l'archive **sauf** ceux sous `tests/`, les `*.md`
   et les fichiers dont le nom commence par `LICENSE`. Chacun doit figurer dans `PRECACHE`, et `PRECACHE` ne nomme rien
   qui ne soit dans l'archive.
10. **La sauvegarde** : le module `js/sauvegarde.js` exporte `SCHEMA` (entier) et `lire(objet)`, qui prend l'objet JSON
    d'un fichier exporté et rend les données au schéma courant, ou lève une exception si le fichier est illisible.
    **Les sauvegardes de référence** sont des fichiers `*.json` dans un dossier du banc (par défaut `banc/sauvegardes/`,
    vide dans ce lot, avec un `README.md` d'une ligne disant à quoi il sert).
11. **Les traductions** : `i18n/fr.json` et `i18n/en.json`, chacun un objet JSON plat `clé → texte`. **Une clé
    utilisée** est : la valeur d'un attribut `data-i18n="…"` dans un fichier `.html`, ou l'argument littéral d'un appel
    `t('…')` ou `t("…")` dans un fichier `.js` hors de `tests/`. Les clés dynamiques sont interdites par le contrat
    (le banc ne les voit pas).
12. **Les tests** : des fichiers `tests/**/*.test.js`, exécutables par `node --test` depuis la racine d'une copie du
    dossier (ils importent les modules de l'application par chemins relatifs).
13. **Le `CHANGELOG`** : `CHANGELOG.md` à la racine ; sa version est celle du **premier** titre de niveau 2 de la forme
    `## vX.Y` ou `## vX.Y.Z` (suivi de ce qu'on veut).
14. **L'écran** : la page est `index.html` à la racine ; les routes sont des ancres (`#/…`).
    - **Langue et thème** se forcent par l'adresse : `?langue=fr|en` et `?theme=jour|chandelle`, sans être enregistrés.
    - **Prête** : quand l'écran demandé est rendu, l'application pose `data-pret="1"` sur `<html>`.
    - **Un état se pose** par `window.__FLH__.importer(objet)`, qui fait exactement ce que fait le bouton d'import d'un
      fichier de sauvegarde, et rend une promesse résolue quand c'est enregistré.
    - **Le hors-ligne** : un service worker (`sw.js` à la racine, enregistré par l'application) qui met en cache
      `PRECACHE` sous `CACHE_NAME`.

### C · Les instruments

15. **Le rituel** — `node banc/rituel.mjs <dossier> [--sauvegardes <dossier>] [--detail]`. Il mesure le dossier
    (une archive déballée) et écrit **exactement** ces onze lignes, dans cet ordre (`<…>` = une valeur) :

    ```
    fichiers: <n>
    poids: <octets>
    caches: <n>
    syntaxe: <ok>/<total>
    tests: <p> passed, <f> failed
    sauvegardes: lues=<ok>/<total> schema=<SCHEMA|absent>
    i18n: fr=<n> en=<n> manquantes=<n> orphelines=<n> inconnues=<n>
    horsligne: externes=<n> precache=<n|absent> manquants=<n> en_trop=<n>
    version: code=<v|absente> changelog=<v|absente> cache=<nom|absent> coherente=<oui|non|sans-objet>
    changelog: a_completer=<n>
    empreinte: <sha256>
    ```

    - **fichiers / poids** : tous les fichiers du dossier (récursif, fichiers réguliers), et la somme de leurs tailles.
    - **caches** : les fichiers dont un segment de chemin est `node_modules`, `.npm` ou `__pycache__`, ou dont le nom est
      `.DS_Store`, `Thumbs.db`, se termine par `.log` ou `.pyc`.
    - **syntaxe** : `node --check` sur chaque fichier `.js` et `.mjs` du dossier ; `ok` = ceux qui passent. Les échecs
      se listent sur la sortie d'erreur.
    - **tests** : `node --test` lancé sur une copie temporaire du dossier, sur `tests/**/*.test.js` ; les nombres de tests
      passés et échoués. **Sans aucun fichier de test, la ligne est `tests: aucun`.**
    - **sauvegardes** : pour chaque `*.json` du dossier des sauvegardes de référence (§B-10), `lire()` du module
      `js/sauvegarde.js` **de la copie temporaire** ; `ok` = celles lues sans exception. Sans module, `schema=absent`, et
      `lues=0/<total>`.
    - **i18n** : `fr`, `en` = nombre de clés ; `manquantes` = clés présentes dans une langue et pas dans l'autre (somme
      des deux sens) ; `orphelines` = clés de `fr.json` jamais utilisées ; `inconnues` = clés utilisées absentes de
      `fr.json`. **Sans `i18n/fr.json` ni `i18n/en.json`, la ligne est `i18n: absente`.**
    - **horsligne** : `externes` = nombre d'occurrences de `http://` ou `https://` dans les fichiers `.html`, `.js`,
      `.mjs`, `.css`, `.json`, `.webmanifest` hors de `tests/`, **commentaires compris**, à l'exception des URI d'espace de
      noms commençant par `http://www.w3.org/` ; `precache` = longueur de `PRECACHE` (ou `absent`) ; `manquants` =
      fichiers à couvrir (§B-9) absents de `PRECACHE` (comptés aussi quand `PRECACHE` est absent) ; `en_trop` = entrées de
      `PRECACHE` absentes du dossier.
    - **version** : `code` = `VERSION` ; `changelog` = §B-13 ; `cache` = `CACHE_NAME` ; `coherente` = `oui` si les trois
      existent, que `code` égale `changelog` et que `cache` égale `flh-` + `code` ; `non` si l'un existe sans que tout cela
      tienne ; `sans-objet` si aucun des trois n'existe.
    - **changelog** : nombre d'occurrences de `à compléter` (insensible à la casse) dans `CHANGELOG.md` (0 sans
      `CHANGELOG.md`).
    - **empreinte** : le sha256 du texte formé, pour chaque fichier du dossier trié par chemin, de la ligne
      `<sha256 du fichier en hexadécimal minuscule><deux espaces><chemin>` suivie d'un saut de ligne `\n` — exactement la
      sortie de `sha256sum` sur les fichiers triés.
    - **`--detail`** ajoute, après les onze lignes, une ligne vide puis ces lignes `sha256  chemin`, une par fichier.

16. **La mesure commune** — `node banc/ecart.mjs <base> <livre>`. Compare deux dossiers par le sha256 de chaque fichier.
    Une ligne par fichier qui diffère, triées par chemin : `A <chemin>` (ajouté), `M <chemin>` (modifié),
    `D <chemin>` (retiré) ; puis une dernière ligne `ecart: ajoutes=<n> modifies=<n> retires=<n>`.

17. **Le contrôle d'écran** — `node banc/ecran.mjs <dossier> <controles.json> [--sortie <dossier>]`.
    - Il sert le dossier par son serveur statique (types MIME justes pour `.html`, `.js`, `.mjs`, `.css`, `.json`,
      `.webmanifest`, `.svg`, `.png`, `.webp`, `.woff2`, `.ico` ; `index.html` pour `/`) et ouvre Chromium.
    - **Le fichier de contrôles** (JSON) décrit des cas : `{"cas": [{"nom": "…", "route": "#/…", "etat": "<chemin
      relatif au fichier de contrôles, ou null>", "verifs": [ … ]}]}`. Une vérification est l'un de :
      `{"selecteur": "<css>", "compte": <n>}` (nombre exact d'éléments) ;
      `{"selecteur": "<css>", "texte": {"fr": "…", "en": "…"}}` (texte du premier élément, espaces de bord retirés,
      égal à celui de la langue du rendu) ;
      `{"selecteur": "<css>", "visible": true}`.
    - **Chaque cas se rend 8 fois** : deux largeurs (`tablette` = 800 × 1280, `telephone` = 412 × 915 ; facteur de pixel
      1, écran tactile et mobile émulés), deux langues (`fr`, `en`), deux thèmes (`jour`, `chandelle`) ; mouvement
      réduit (`reducedMotion: "reduce"`). Chaque rendu part d'un **contexte de navigateur neuf** (stockage vide) ; si le
      cas a un `etat`, l'instrument charge la page, appelle `window.__FLH__.importer(<objet>)`, attend la promesse, puis
      va sur la route avec `?langue=…&theme=…` ; sinon il va directement sur la route. Il attend `data-pret="1"` (délai
      au plus 10 s, au-delà le rendu compte comme vérifications toutes échouées).
    - **Mesures de chaque rendu** : les vérifications ; les messages de console de type `error` et les exceptions de
      page ; les requêtes vers un autre hôte que celui du serveur (`externes`) ; le **débord** horizontal, en pixels
      (`scrollWidth − clientWidth` de l'élément défilant du document, 0 au mieux).
    - **Une ligne par rendu**, dans l'ordre cas → largeur → langue → thème :
      `<cas> <largeur> <langue> <theme> verifs=<ok>/<n> console=<n> externes=<n> debord=<px>`, chaque vérification ratée
      détaillée en dessous sur une ligne en retrait de deux espaces.
    - **Le hors-ligne réel**, une fois par exécution : contexte neuf, chargement de `/`, attente de
      `navigator.serviceWorker.ready` (10 s au plus), passage du contexte hors ligne, rechargement, attente de
      `data-pret="1"` → `ok` ; pas de service worker prêt → `sans-sw` ; échec du rechargement → `echec`.
    - **La dernière ligne** :
      `ecran: rendus=<n> verifs=<ok>/<n> console=<n> externes=<n> debords=<n> horsligne_reel=<ok|echec|sans-sw>`
      (`debords` = nombre de rendus au débord non nul ; `console`, `externes` = sommes).
    - **Une capture par rendu**, page entière, en PNG, dans le dossier de sortie :
      `<cas>_<largeur>_<langue>_<theme>.png`. Elles sont pour le CdP ; **tu ne les ouvres pas**.

18. **L'auto-essai** — `node banc/autotest.mjs`. La preuve que le banc mesure ce qu'il dit :
    - il copie `banc/essai/` (la mini-application d'essai, §D) dans un dossier temporaire et y passe le rituel (avec les
      sauvegardes de `banc/essai-sauvegardes/`) et le contrôle d'écran (avec `banc/essai-controles.json`) : c'est **l'essai
      sain** ;
    - puis, pour chaque **défaut planté** de la liste ci-dessous, sur une copie neuve de l'essai portant ce seul défaut,
      il repasse l'instrument concerné et vérifie que **la mesure visée bouge comme attendu, et elle seule** parmi les
      lignes du rituel (hors `fichiers`, `poids` et `empreinte`, qui bougent forcément) ;
    - une ligne par vérification, `ok` ou `ECHEC` avec la valeur mesurée, puis une dernière ligne
      `autotest: <ok>/<n>`.

    **L'essai sain doit donner** : `caches: 0` ; `syntaxe` = total/total ; `tests` ≥ 2 passés, 0 échoué ;
    `sauvegardes: lues` = total/total avec au moins 1 sauvegarde et `schema=1` ; `i18n` : `manquantes=0 orphelines=0
    inconnues=0`, au moins 3 clés ; `horsligne: externes=0 … manquants=0 en_trop=0` ; `version: … coherente=oui` ;
    `changelog: a_completer=0` ; à l'écran, toutes les vérifications passées, `console=0 externes=0 debords=0
    horsligne_reel=ok`.

    **Les défauts plantés** (un par copie), et ce qui doit bouger :

    | # | défaut planté | ce qui doit bouger |
    |---|---|---|
    | D1 | un fichier `node_modules/x/index.js` | `caches` +1 |
    | D2 | une erreur de syntaxe dans un `.js` de l'application | `syntaxe` ok −1 |
    | D3 | un test qui échoue, ajouté | `tests` failed +1 |
    | D4 | une sauvegarde de référence illisible (JSON valide que `lire()` refuse), ajoutée | `sauvegardes` ok inchangé, total +1 |
    | D5 | une clé retirée de `en.json` | `i18n` `manquantes` +1, `en` −1 |
    | D6 | une clé utilisée dans le HTML et définie nulle part | `i18n` `inconnues` +1 |
    | D7 | une URL `https://` dans une feuille de style | `horsligne` `externes` +1 |
    | D8 | un fichier servi retiré de `PRECACHE` | `horsligne` `manquants` +1, `precache` −1 |
    | D9 | `VERSION` changée sans le `CHANGELOG` | `version` `coherente=non` |
    | D10 | `à compléter` ajouté au `CHANGELOG` | `changelog` `a_completer` +1 |
    | D11 | un élément de 1200 px de large sur l'écran du cas | écran : `debords` = rendus du cas |
    | D12 | une erreur écrite en console au démarrage | écran : `console` = nombre de rendus |
    | D13 | une image chargée depuis un hôte extérieur | écran : `externes` ≥ nombre de rendus (la requête échoue, elle compte quand même) |
    | D14 | le service worker non enregistré | écran : `horsligne_reel=sans-sw` |
    | D15 | un texte de l'écran changé en FR | écran : vérifications ratées sur les rendus FR seuls |
    | D16 | (mesure commune) l'essai contre une copie où un fichier est ajouté, un modifié, un retiré | `ecart: ajoutes=1 modifies=1 retires=1` et les trois lignes `A`, `M`, `D` justes |

    Une vérification « elle seule » qui échoue parce qu'un défaut fait bouger une autre ligne (ex. D2 qui ferait aussi
    échouer les tests) est réglée **en choisissant où planter le défaut**, pas en relâchant la vérification ; si c'est
    impossible pour un défaut, arrête-toi.

### D · La mini-application d'essai

19. **`banc/essai/`** est une mini-application qui respecte **tout** le contrat du §B, et rien de plus : une page
    `index.html`, une route `#/` qui affiche un titre et un compteur de personnages, une route `#/perso` qui affiche le
    nom du personnage importé ; un service worker ; un manifeste ; `i18n/fr.json` et `i18n/en.json` ; `js/version.js`
    (`VERSION = "v0.0"`), `js/precache.js`, `js/sauvegarde.js` (`SCHEMA = 1`), le module principal ; deux thèmes par
    variables CSS ; au moins 2 tests dans `tests/` ; un `CHANGELOG.md` dont le premier titre est `## v0.0`.
    **Ce n'est pas l'application** : aucun visuel travaillé, aucun nom ni texte de Fabled Lands, des textes neutres
    (« Essai du banc », « Personnages : 0 »…). Elle ne sera jamais copiée dans le code servi.
20. **`banc/essai-sauvegardes/`** : au moins une sauvegarde valide pour `lire()` de l'essai (un personnage fictif nommé
    « Essai »). **`banc/essai-controles.json`** : au moins deux cas — l'accueil sans état, le personnage avec l'état de
    cette sauvegarde — et des vérifications des trois sortes, dont au moins un `texte` en FR et en EN.

### E · Le README du banc

21. **`banc/README.md`**, écrit pour un dev qui arrive sans contexte, en français, dans cet ordre : à quoi sert le banc ;
    l'installation (copie hors du clone, `npm ci`, la parade Chromium) ; les quatre instruments, leur usage et la forme
    exacte de leurs sorties (repris du §C) ; **le contrat** (repris du §B) ; l'auto-essai et la liste des défauts ; le
    **rituel de réception**, en trois commandes (rituel sur `base/` et sur `mesure/`, mesure commune, contrôle d'écran
    avec les contrôles du lot).

## §3 · Ce qui ne bouge pas

- **L'archive de déploiement** : `banc/` et `lots/` sont hors de `git archive` (`.gitattributes`). L'archive du commit
  de livraison doit être **identique à l'octet** à celle de la base (même empreinte).
- **`CHANGELOG.md`** : intact. Un lot d'outillage ne prend pas de version et n'a pas d'entrée.
- **`PROMPT_DEV_FLH.md`, `.gitattributes`, `.gitignore`** : intacts.

## §4 · Les fichiers

**Tout ce que le lot ajoute est sous `banc/`**, plus le rapport sous `lots/banc-v1/`. Rien d'autre n'est modifié,
ajouté ou retiré dans le dépôt.

| fichier | change | ce qui y est |
|---|---|---|
| `banc/README.md` | ajouté | §E |
| `banc/package.json`, `banc/package-lock.json` | ajoutés | §A-1, §A-2 |
| `banc/rituel.mjs` | ajouté | §C-15 |
| `banc/ecart.mjs` | ajouté | §C-16 |
| `banc/ecran.mjs` | ajouté | §C-17 |
| `banc/autotest.mjs` | ajouté | §C-18 |
| `banc/lib/…` | ajoutés, au besoin | le code partagé des instruments (serveur statique, empreinte, lecture des dossiers) |
| `banc/sauvegardes/README.md` | ajouté | §B-10 |
| `banc/essai/…` | ajoutés | §D-19 |
| `banc/essai-sauvegardes/…` | ajoutés | §D-20 |
| `banc/essai-controles.json` | ajouté | §D-20 |
| `lots/banc-v1/RAPPORT_DEV.md` | ajouté (commit à part) | le rapport |

## §5 · Les critères et la prédiction

**Le bloc « base »** — ce que doit écrire le rituel construit par ce lot, passé sur l'archive de la base
(`git archive origin/main`), ligne pour ligne :

```
fichiers: 1
poids: 232
caches: 0
syntaxe: 0/0
tests: aucun
sauvegardes: lues=0/0 schema=absent
i18n: absente
horsligne: externes=0 precache=absent manquants=0 en_trop=0
version: code=absente changelog=absente cache=absente coherente=sans-objet
changelog: a_completer=0
empreinte: 07b6f76cdc25cf99b81333c21ccf0645ac3378eb23894fb00f9e3ce6a9573c72
```

*P0 de ce lot : la tête de `main` est `6ce323c3eb9edf3a5f70c8cd3b16a6f6da9ee31c`, et `git archive` de `main` ne porte
que `CHANGELOG.md`. Le bloc ci-dessus se vérifie à l'étape 9, une fois le rituel construit.*

**Les portes, en deltas contre la base** (lues sur `mesure/`, l'archive du commit de livraison) :

| porte | base | attendu | delta |
|---|---|---|---|
| P1 version | aucune | aucune | 0 |
| P2 fichiers de l'archive | 1 | 1 | 0 |
| P9 `CHANGELOG` | inchangé | inchangé | 0 |
| P10 écart `base` → `mesure` | — | `ecart: ajoutes=0 modifies=0 retires=0` | 0 |
| P11 empreinte | `07b6f76c…3c72` | identique | 0 |
| P12 hors du code | — | seuls `banc/**` ajoutés (et `lots/banc-v1/RAPPORT_DEV.md`) | — |

*P3 à P8 (syntaxe, tests, traductions, hors-ligne, écran, sauvegardes) ne s'appliquent pas à l'archive de ce lot : ils
s'appliquent à l'essai, par les critères C3 à C5.*

**Les critères du lot** :

- **C1** — Le rituel passé sur `mesure/` écrit **exactement** le bloc « base » ci-dessus (onze lignes, à l'octet).
- **C2** — `node banc/ecart.mjs base mesure` écrit la seule ligne `ecart: ajoutes=0 modifies=0 retires=0`.
- **C3** — `node banc/autotest.mjs` se termine par `autotest: <n>/<n>`, sans aucune ligne `ECHEC`, et couvre **l'essai
  sain et les seize défauts D1 à D16** (chacun nommé par son numéro dans la sortie).
- **C4** — L'essai sain vérifie toutes les valeurs du §C-18 (« L'essai sain doit donner »).
- **C5** — Le contrôle d'écran de l'essai rend `2 cas × 8 = 16` rendus au moins, et écrit 16 captures au moins dans le
  dossier de sortie, nommées selon §C-17.
- **C6** — **Déterminisme** : deux exécutions successives du rituel sur le même dossier donnent la même sortie à
  l'octet ; idem pour la mesure commune et pour les lignes de rendu du contrôle d'écran (les captures ne comptent pas).
- **C7** — **Aucune écriture dans le dossier mesuré** : l'empreinte du dossier de l'essai sain est la même avant et
  après un rituel et un contrôle d'écran.
- **C8** — `banc/package.json` déclare exactement `playwright-core` `1.64.1` et `@sparticuz/chromium` `153.0.0`, sans
  `^` ni `~`, et aucune autre dépendance ; `npm ci` passe dans une copie neuve du banc ; aucun `node_modules/` n'est suivi
  par git.
- **C9** — Rien de Fabled Lands dans `banc/` : aucun texte du livre, aucun nom de lieu ou de personnage du livre.

## §6 · Le `CHANGELOG`

**Aucune entrée** : lot d'outillage, sans version. `CHANGELOG.md` ne bouge pas.

## §7 · Les arrêts propres au lot

En plus de ceux du prompt du dev :
- Chromium ne démarre pas par `@sparticuz/chromium` 153.0.0 avec `playwright-core` 1.64.1 : arrête-toi avec la sortie
  d'erreur (ne change pas de version, n'essaie pas un autre navigateur).
- Une règle du contrat (§B) ou une forme de sortie (§C) est impossible à tenir telle qu'écrite, ou deux règles se
  contredisent.
- Un défaut D1 à D16 ne peut pas être planté de façon à ne faire bouger que sa mesure.
- Le rituel sur la base ne donne pas le bloc « base » et tu penses que c'est le cadrage qui se trompe (dis lequel des
  deux, mesure à l'appui).

## §8 · Les preuves

- L'auto-essai **est** la preuve du lot : sa sortie complète va au rapport (§5 du rapport).
- Au rapport aussi : la sortie du rituel sur `base/` et sur `mesure/`, celle de `ecart.mjs`, celle du rituel et du
  contrôle d'écran sur l'essai sain, et deux exécutions du rituel pour C6.
- **Aucune image à montrer, aucune capture à ouvrir.** Les captures restent dans un dossier de sortie hors du clone ; le
  CdP les regarde lui-même en refaisant l'auto-essai.

## §9 · La livraison

- Le commit de livraison (« Lot banc-v1 — livraison »), puis `lots/banc-v1/RAPPORT_DEV.md` dans un commit à part
  (« Lot banc-v1 — rapport »), poussés sur `lot/banc-v1`.
- Le livrable : le dossier `banc/` du commit de livraison ; l'archive de déploiement est inchangée.
