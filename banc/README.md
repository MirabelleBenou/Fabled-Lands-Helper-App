# Le banc d'essai

Outillage du dépôt, hors de l'archive de déploiement (`.gitattributes`). Lot `banc-v1`.

## 1 · À quoi sert le banc

L'application est servie par GitHub Pages depuis `git archive` de `main`. Avant de croire qu'un lot est bon, on mesure
**cette archive, déballée, à froid** : combien de fichiers, si les tests passent, si les traductions se recoupent, si
rien ne sort sur le réseau, si le cache hors ligne couvre tout, si l'écran tient à deux largeurs, deux langues et deux
thèmes.

Quatre instruments, chacun une commande `node …` :

| instrument | rôle |
|---|---|
| `rituel.mjs` | mesure un dossier : onze lignes |
| `ecart.mjs` | liste ce qui change entre deux dossiers (la base et la livraison) |
| `ecran.mjs` | rend l'application dans Chromium et vérifie l'écran |
| `autotest.mjs` | prouve que les trois autres attrapent chacun le défaut qu'ils doivent attraper |

**Un instrument ne juge pas** : il mesure. La comparaison aux valeurs attendues (le cadrage, la prédiction) est faite
par le chef de projet et par le dev. Le code de sortie est `0` quand la mesure a pu se faire, quoi qu'elle mesure ;
il est non nul (`2`) seulement quand l'instrument lui-même échoue (dossier introuvable, Chromium qui ne démarre pas,
fichier de contrôles illisible), avec la raison sur la sortie d'erreur.

Règles communes : sorties en français, déterministes (mêmes entrées, mêmes lignes, même ordre, sans chemin absolu,
sans date, sans durée) ; chemins relatifs au dossier mesuré, séparateur `/`, triés par ordre d'octets
(comme `LC_ALL=C sort`) ; **aucune écriture dans le dossier mesuré** (ce qui s'exécute, les tests, s'exécute sur une
copie temporaire, supprimée ensuite) ; aucun réseau à l'usage.

## 2 · L'installation

Le banc s'installe **dans une copie, hors du clone** : jamais de `node_modules/` dans le clone ni dans l'archive.

```sh
cp -r <clone>/banc <dossier de travail>/banc
cd <dossier de travail>/banc && npm ci
```

Node 22 ou plus. Deux dépendances, épinglées à la version exacte (`package.json`) et figées (`package-lock.json`) :
`playwright-core` 1.64.1 et `@sparticuz/chromium` 153.0.0.

**La parade Chromium.** `npx playwright install` télécharge le navigateur depuis un CDN, refusé dans le bac à sable :
ne pas l'essayer. Le navigateur vient du paquet npm `@sparticuz/chromium`, lancé par `playwright-core` avec
`executablePath: await chromium.executablePath()` et `args: chromium.args`, sans affichage. Ces arguments le font
tourner **en un seul processus** : fermer un contexte arrête alors tout le navigateur. Le contrôle d'écran lance donc
**un navigateur par rendu** et le ferme à la fin ; chaque rendu part ainsi d'un contexte neuf, stockage vide compris.
Si Chromium ne démarre pas, l'instrument s'arrête (code 2) avec la raison.

Les instruments se lancent ensuite depuis n'importe où, par le chemin du script : `node <dossier de travail>/banc/rituel.mjs …`.

## 3 · Les quatre instruments

### Le rituel

```sh
node banc/rituel.mjs <dossier> [--sauvegardes <dossier>] [--detail]
```

Mesure `<dossier>` (une archive déballée) et écrit **exactement** ces onze lignes, dans cet ordre (`<…>` = une valeur) :

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
- **syntaxe** : un contrôle de syntaxe sur chaque `.js` et `.mjs` du dossier, **lu comme un module ES** ; `ok` = ceux
  qui passent. Les échecs se listent sur la sortie d'erreur. *Piège connu : `node --check fichier.js`, sur un `.js` d'un
  dossier sans `package.json` à `"type": "module"`, laisse passer une erreur de syntaxe dès que le fichier utilise
  `import` ou `export`. Le rituel passe donc chaque fichier par l'entrée standard avec `--input-type=module --check`.*
- **tests** : `node --test` lancé sur une copie temporaire du dossier, sur `tests/**/*.test.js` ; nombres de tests
  passés et échoués (un fichier de test qui ne se charge pas compte pour un échec). Sans aucun fichier de test :
  `tests: aucun`.
- **sauvegardes** : pour chaque `*.json` (premier niveau) du dossier des sauvegardes de référence — par défaut
  `banc/sauvegardes/`, sinon `--sauvegardes` —, `lire()` du module `js/sauvegarde.js` **de la copie temporaire** ;
  `ok` = celles lues sans exception. Sans module, `schema=absent` et `lues=0/<total>`.
- **i18n** : `fr`, `en` = nombre de clés ; `manquantes` = clés présentes dans une langue et pas dans l'autre (somme des
  deux sens) ; `orphelines` = clés de `fr.json` jamais utilisées ; `inconnues` = clés utilisées (distinctes) absentes
  de `fr.json`. Sans `i18n/fr.json` ni `i18n/en.json` : `i18n: absente`. Une clé utilisée est la valeur d'un attribut
  `data-i18n="…"` dans un `.html`, ou l'argument littéral d'un appel `t('…')` / `t("…")` dans un `.js`, hors de `tests/`.
- **horsligne** : `externes` = occurrences de `http://` ou `https://` dans les `.html`, `.js`, `.mjs`, `.css`, `.json`,
  `.webmanifest` hors de `tests/`, commentaires compris, sauf les espaces de noms commençant par `http://www.w3.org/`
  et, dans `js/liens.js` seulement, les occurrences qui commencent une des valeurs (chaînes) de son export `LIENS`
  (la même adresse dans un autre fichier compte) ;
  `precache` = longueur de `PRECACHE` (ou `absent`) ; `manquants` = fichiers à couvrir absents de `PRECACHE` (comptés
  aussi quand `PRECACHE` est absent) ; `en_trop` = entrées de `PRECACHE` absentes du dossier.
- **version** : `code` = `VERSION` ; `changelog` = la version du premier titre `## vX.Y` ou `## vX.Y.Z` de
  `CHANGELOG.md` ; `cache` = `CACHE_NAME`. `coherente` = `oui` si les trois existent, que `code` égale `changelog` et
  que `cache` égale `flh-` + `code` ; `non` si l'un existe sans que tout cela tienne ; `sans-objet` si aucun n'existe.
- **changelog** : occurrences de `à compléter` (insensible à la casse) dans `CHANGELOG.md` (0 sans `CHANGELOG.md`).
- **empreinte** : le sha256 du texte formé, pour chaque fichier trié par chemin, de la ligne
  `<sha256 du fichier><deux espaces><chemin>` suivie de `\n` — exactement la sortie de `sha256sum` sur les fichiers triés.
- **`--detail`** ajoute, après les onze lignes, une ligne vide puis les lignes `sha256  chemin`, une par fichier.

### La mesure commune

```sh
node banc/ecart.mjs <base> <livre>
```

Compare deux dossiers par le sha256 de chaque fichier. Une ligne par fichier qui diffère, triées par chemin :
`A <chemin>` (ajouté), `M <chemin>` (modifié), `D <chemin>` (retiré) ; puis la dernière ligne :

```
ecart: ajoutes=<n> modifies=<n> retires=<n>
```

### Le contrôle d'écran

```sh
node banc/ecran.mjs <dossier> <controles.json> [--sortie <dossier>]
```

Sert `<dossier>` par un serveur statique du banc (`node:http`, `127.0.0.1`, port libre ; `index.html` pour `/`) et
rend chaque cas **8 fois** : deux largeurs (`tablette` 800 × 1280, `telephone` 412 × 915 ; pixel 1, écran tactile et
mobile émulés), deux langues (`fr`, `en`), deux thèmes (`jour`, `chandelle`) ; mouvement réduit. Chaque rendu part d'un
contexte de navigateur neuf (stockage vide).

**Le fichier de contrôles** (JSON) :

```json
{"cas": [{"nom": "accueil", "route": "#/", "etat": null, "verifs": [ … ]},
         {"nom": "perso", "route": "#/perso", "etat": "chemin/relatif/au/fichier-de-controles.json", "verifs": [ … ]}]}
```

Une vérification est l'une de :

```json
{"selecteur": "<css>", "compte": 2}
{"selecteur": "<css>", "texte": {"fr": "…", "en": "…"}}
{"selecteur": "<css>", "visible": true}
```

`compte` : nombre exact d'éléments. `texte` : texte du premier élément, espaces de bord retirés, égal à celui de la langue
du rendu. `visible` : le premier élément est visible. Le `nom` d'un cas ne doit pas contenir d'espace (il sert à lire
les lignes et à nommer les captures).

Si le cas a un `etat` (une sauvegarde, lue comme objet JSON), l'instrument charge la page, appelle
`window.__FLH__.importer(<objet>)`, attend la promesse, repart d'une page vierge, puis va sur la route avec
`?langue=…&theme=…` ; sinon il va directement sur la route. Il attend `data-pret="1"` sur `<html>` (10 s au plus ; au-delà,
toutes les vérifications du rendu comptent comme ratées). Les mesures de console et de requêtes sont celles de la page
rendue (après l'import, pas pendant).

**Mesures de chaque rendu** : les vérifications ; les messages de console de type `error` et les exceptions de page
(`console`) ; les adresses distinctes demandées à un autre hôte que le serveur du banc (`externes`) — une requête qui
échoue compte quand même ; le débord horizontal en pixels (`scrollWidth − clientWidth` de l'élément défilant du
document, 0 au mieux). Avant de mesurer, l'instrument laisse le réseau se calmer (au plus 5 s) pour que les erreurs
tardives soient vues.

**Une ligne par rendu**, dans l'ordre cas → largeur → langue → thème ; chaque vérification ratée est détaillée dessous,
sur une ligne en retrait de deux espaces :

```
<cas> <largeur> <langue> <theme> verifs=<ok>/<n> console=<n> externes=<n> debord=<px>
  <selecteur> <détail de l'écart>
```

**Le hors-ligne réel**, une fois par exécution : contexte neuf, chargement de `/`, attente de
`navigator.serviceWorker.ready` (10 s au plus), passage hors ligne, rechargement, attente de `data-pret="1"` → `ok` ;
pas de service worker prêt → `sans-sw` ; rechargement en échec → `echec`.

**La dernière ligne** :

```
ecran: rendus=<n> verifs=<ok>/<n> console=<n> externes=<n> debords=<n> horsligne_reel=<ok|echec|sans-sw>
```

(`debords` = nombre de rendus au débord non nul ; `console` et `externes` sont des sommes.)

**Les captures** : une par rendu, page entière, en PNG, dans le dossier de sortie (par défaut `banc/sorties/`, ignoré
par git) : `<cas>_<largeur>_<langue>_<theme>.png` (les caractères autres que lettres, chiffres, `.`, `_`, `-` du nom
du cas y sont remplacés par `_`). Elles sont pour le chef de projet ; un dev ne les ouvre pas, il lit les lignes.

### L'auto-essai

```sh
node banc/autotest.mjs [--sortie <dossier>]
```

Voir le §5. Les captures de l'essai sain vont par défaut dans `banc/sorties/autotest/`.

## 4 · Le contrat entre le banc et l'application

Le banc mesure une application qui respecte ce contrat. Un élément absent du dossier mesuré n'est pas une erreur de
l'instrument : il s'affiche `absente`, `absent` ou `aucun` selon les lignes du §3.

1. **La version** : `js/version.js` exporte `VERSION`, une chaîne `vX.Y` ou `vX.Y.Z`.
2. **Le cache hors ligne** : `js/precache.js` exporte `CACHE_NAME` (chaîne) et `PRECACHE` (tableau de chemins relatifs à
   la racine, sans `./` ni `/` en tête). Règle de cohérence : `CACHE_NAME === "flh-" + VERSION`.
3. **Les fichiers que le cache doit couvrir** : tous les fichiers de l'archive **sauf** ceux sous `tests/`, les `*.md` et
   les fichiers dont le nom commence par `LICENSE`. Chacun figure dans `PRECACHE`, et `PRECACHE` ne nomme rien qui ne soit
   dans l'archive.
4. **La sauvegarde** : `js/sauvegarde.js` exporte `SCHEMA` (entier) et `lire(objet)`, qui prend l'objet JSON d'un fichier
   exporté et rend les données au schéma courant, ou lève une exception si le fichier est illisible. Les **sauvegardes de
   référence** sont des fichiers `*.json` dans un dossier du banc (par défaut `banc/sauvegardes/`).
5. **Les traductions** : `i18n/fr.json` et `i18n/en.json`, chacun un objet JSON plat `clé → texte`. Une clé utilisée est
   la valeur d'un attribut `data-i18n="…"` dans un `.html`, ou l'argument littéral d'un appel `t('…')` ou `t("…")` dans un
   `.js` hors de `tests/`. **Les clés dynamiques sont interdites** (le banc ne les voit pas).
6. **Les tests** : des fichiers `tests/**/*.test.js`, exécutables par `node --test` depuis la racine d'une copie du
   dossier (ils importent les modules de l'application par chemins relatifs).
7. **Le `CHANGELOG`** : `CHANGELOG.md` à la racine ; sa version est celle du **premier** titre de niveau 2 de la forme
   `## vX.Y` ou `## vX.Y.Z` (suivi de ce qu'on veut).
8. **L'écran** : la page est `index.html` à la racine ; les routes sont des ancres (`#/…`).
   - Langue et thème se forcent par l'adresse : `?langue=fr|en` et `?theme=jour|chandelle`, sans être enregistrés.
   - **Prête** : quand l'écran demandé est rendu, l'application pose `data-pret="1"` sur `<html>`.
   - **Un état se pose** par `window.__FLH__.importer(objet)`, qui fait exactement ce que fait le bouton d'import d'un
     fichier de sauvegarde, et rend une promesse résolue quand c'est enregistré.
   - **Le hors-ligne** : un service worker (`sw.js` à la racine, enregistré par l'application) qui met en cache `PRECACHE`
     sous `CACHE_NAME`.
9. **Les liens déclarés** : `js/liens.js` exporte `LIENS`, un objet nom → adresse `https://…` : les adresses que
   l'utilisateur ouvre d'un toucher, jamais demandées par l'application ; le rituel ne les compte pas, le contrôle
   d'écran vérifie qu'aucune n'est demandée.

Les fichiers `.js` sont des modules ES (le rituel les contrôle comme tels).

## 5 · L'auto-essai et ses défauts plantés

`banc/essai/` est une **mini-application d'essai** qui respecte tout le contrat et rien de plus (deux écrans, un
compteur, un nom, un service worker, un manifeste, deux dictionnaires, deux thèmes, cinq tests). Ce n'est pas
l'application : elle n'est jamais copiée dans le code servi. `banc/essai-sauvegardes/` porte sa sauvegarde de référence
(un personnage fictif « Essai »), `banc/essai-controles.json` ses deux cas d'écran (l'accueil sans état ; le
personnage avec l'état de la sauvegarde).

`node banc/autotest.mjs` copie l'essai dans un dossier temporaire et y passe le rituel et le contrôle d'écran : **l'essai
sain**. Il doit donner : `caches: 0` ; `syntaxe` total/total ; `tests` au moins 2 passés, 0 échoué ; `sauvegardes` toutes
lues, au moins une, `schema=1` ; `i18n` à zéro partout, au moins 3 clés ; `horsligne` à zéro partout ; `coherente=oui` ;
`a_completer=0` ; à l'écran, toutes les vérifications passées, `console=0 externes=0 debords=0 horsligne_reel=ok`. Il
vérifie aussi le déterminisme (deux exécutions identiques) et que le dossier mesuré n'a pas bougé (empreinte avant =
après).

Puis, pour chaque défaut, sur une **copie neuve de l'essai portant ce seul défaut**, il repasse l'instrument concerné et
vérifie que la mesure visée bouge comme attendu **et elle seule** (pour le rituel : toutes les autres lignes, hors
`fichiers`, `poids` et `empreinte`, restent égales à celles de l'essai sain ; pour l'écran : les autres compteurs de la
ligne `ecran:` restent à leur valeur saine). Une ligne par vérification, `ok` ou `ECHEC` avec la valeur mesurée entre
crochets, et la dernière ligne `autotest: <ok>/<n>`. Comme les autres instruments, il ne juge pas par son code de sortie :
on lit la dernière ligne et on cherche `ECHEC`.

| # | défaut planté | ce qui doit bouger | où il est planté |
|---|---|---|---|
| D1 | un fichier sous `node_modules/` | `caches` +1 | `node_modules/x/README.md` (un `.js` ferait aussi bouger `syntaxe` et `manquants`) |
| D2 | une erreur de syntaxe dans un `.js` de l'application | `syntaxe` ok −1 | `js/app.js`, que les tests n'importent pas |
| D3 | un test qui échoue, ajouté | `tests` failed +1 | un test ajouté dans `tests/personnages.test.js` (un nouveau fichier ferait bouger `syntaxe`) |
| D4 | une sauvegarde de référence illisible (JSON valide que `lire()` refuse) | `sauvegardes` ok inchangé, total +1 | une copie du dossier des sauvegardes |
| D5 | une clé retirée de `en.json` | `i18n` `manquantes` +1, `en` −1 | `i18n/en.json` |
| D6 | une clé utilisée dans le HTML et définie nulle part | `i18n` `inconnues` +1 | `index.html` |
| D7 | une URL `https://` dans une feuille de style | `horsligne` `externes` +1 | `css/style.css` |
| D8 | un fichier servi retiré de `PRECACHE` | `horsligne` `manquants` +1, `precache` −1 | `js/precache.js` |
| D9 | `VERSION` changée sans le `CHANGELOG` | `version` `coherente=non` | `js/version.js` |
| D10 | `à compléter` ajouté au `CHANGELOG` | `changelog` `a_completer` +1 | `CHANGELOG.md` |
| D11 | un élément de 1200 px de large sur l'écran du cas | écran : `debords` = rendus du cas | `js/app.js`, route `#/perso` |
| D12 | une erreur écrite en console au démarrage | écran : `console` = nombre de rendus | `js/app.js` |
| D13 | une image chargée depuis un hôte extérieur | écran : `externes` ≥ nombre de rendus | `js/app.js` ; Chromium signale aussi l'échec en console |
| D14 | le service worker non enregistré | écran : `horsligne_reel=sans-sw` | `js/app.js` |
| D15 | un texte de l'écran changé en FR | écran : vérifications ratées sur les rendus FR seuls | `i18n/fr.json` |
| D16 | (mesure commune) un fichier ajouté, un modifié, un retiré | `ecart: ajoutes=1 modifies=1 retires=1` et les trois lignes `A`, `M`, `D` justes | l'essai contre sa copie |

Le choix de **l'endroit** où planter un défaut est ce qui garantit « et elle seule » : un défaut qui ferait bouger une
deuxième ligne se replante ailleurs, on ne relâche pas la vérification.

## 6 · Le rituel de réception

Pour un lot livré sur la branche `lot/<lot>`, avec `base/` (l'archive de `main`) et `mesure/` (l'archive du commit de
livraison, `git archive HEAD`), déballées hors du clone :

1. **Le rituel, sur la base et sur la livraison.**
   ```sh
   node banc/rituel.mjs base
   node banc/rituel.mjs mesure
   ```
   La sortie sur `base/` égale le bloc « base » du cadrage, ligne pour ligne ; celle sur `mesure/` se compare à la
   prédiction (les deltas du cadrage).
2. **La mesure commune.**
   ```sh
   node banc/ecart.mjs base mesure
   ```
   La liste des fichiers ajoutés, modifiés, retirés égale celle du cadrage.
3. **Le contrôle d'écran, avec les contrôles du lot.**
   ```sh
   node banc/ecran.mjs mesure <controles du lot>.json --sortie <dossier hors du clone>
   ```
   Les lignes de rendu et la dernière ligne se comparent aux critères du cadrage ; les captures sont pour le chef de projet.

Avant un premier usage, ou quand on doute du banc : `node banc/autotest.mjs` doit finir par `autotest: <n>/<n>`, sans
aucune ligne `ECHEC`.
