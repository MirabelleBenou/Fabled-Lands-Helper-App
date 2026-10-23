# RAPPORT DU DEV — lot `v0.1` (Le socle et l'accueil)

## 1 · Ce dont je ne suis pas sûr

Rien de bloquant. Des choix là où le cadrage se taisait, à valider ou à corriger :

1. **Une couleur littérale dans un composant** : `.page` porte `box-shadow: 0 18px 40px -18px rgba(0, 0, 0, .45), …` tel que l'écrit le §2-27. Le §2-24 interdit toute couleur littérale hors jetons. Aucun jeton « ombre » n'existe dans la table ; je n'en ai pas créé. Si tu veux zéro littéral, un jeton `--ombre` est une ligne de CSS.
2. **`lire()` : l'ordre des contrôles.** `SCHEMA_RECENT` est levé dès que `format` est bon et que `schema` est un entier ≥ 1 supérieur à `SCHEMA`, **avant** de contrôler `personnages` (un schéma plus récent peut avoir une autre forme). Pour un fichier de schéma courant, l'ordre du §2-12 est suivi.
3. **`personnageNeuf()` est dans `js/sauvegarde.js`** (pur, testable, avec `construireExport` et `nomFichierExport`) : ce n'est ni un module ni une clé de plus, mais le §4 ne le nommait pas.
4. **Champs de personnage mal typés** (par exemple `niveau: 0`, `section_en_cours` malformée, `profession` non chaîne) : `lire()` les remplace par la valeur par défaut, comme s'ils manquaient. Une `section` à `null` est acceptée telle quelle ; le lieu s'écrit alors « Livre 1 » seul (le cadrage ne dit pas le cas).
5. **Langue et thème forcés par l'adresse** : si l'utilisateur change ensuite la langue ou l'ambiance dans les Réglages, son choix prend la main (enregistré et appliqué), le forçage de l'adresse est abandonné pour cette dimension jusqu'au rechargement.
6. **Écran « personnage inconnu »** : `fiche.introuvable` est le `<h1>` de l'écran (une seule `<h1>` par écran, et pas de 47e clé), suivi du lien `fiche.retour`.
7. **Onglet courant** : `#/nouveau` et `#/perso/<id>` marquent l'onglet « Personnages » (`aria-current="page"`).
8. **`<title data-i18n="app.nom">`** garde dans le HTML le texte « Fabled Lands Helper » (nom propre, identique en FR et EN) pour éviter un titre vide avant l'exécution ; les trois onglets et le nom de l'en-tête sont vides dans le HTML et remplis par le dictionnaire.
9. **Échec d'IndexedDB** (navigation privée stricte, stockage bloqué) : l'application ne lève rien en console, l'accueil se montre vide, une création échoue en silence. Le cadrage n'a pas de clé de texte pour ce cas (les 46 sont fixes).
10. **Mise à jour du service worker** : cache d'abord, `skipWaiting` + `clients.claim` comme demandé ; une page déjà ouverte garde son ancien code jusqu'au rechargement. J'ai ajouté `cache: 'reload'` à l'installation pour ne pas remplir le cache avec une copie périmée du cache HTTP de GitHub Pages (détail du §2-3 non écrit).
11. **Icônes** : `icon.svg` et les deux PNG « any » ont un dé plus grand que le cercle à 80 % (distance maximale mesurée 217,7 px sur 512, cercle à 204,8) ; seul le maskable est rétréci (échelle 0,9 dans le script jetable, distance maximale 195,9 px). Le dessin n'a pas été regardé (consigne) : il est vérifié par comptage de pixels (coins sépia `#3a2918`, aucun pixel clair hors du cercle pour le maskable).
12. **Rien de ce que je ne pouvais mesurer ici** : le workflow Pages (non testable), le rendu réel du trait à la plume (le filtre est bien appliqué au seul pseudo-élément, `filter: url("#plume")`, mesuré par `getComputedStyle` ; l'allure est pour l'œil du CdP), l'installation PWA sur Android.
13. **Code existant qui ferait déjà le travail demandé** : aucun (la base ne contient que le `CHANGELOG`). `banc/sauvegardes/README.md` dit encore « vide pour l'instant » : non touché (§3).

## 2 · Le commit de livraison et les portes

Commit de livraison : `dcd51d447da976b4e3553b9d128177dea788c0ea` (parent : `b61466e971312573d7b79caac1fb6d698621deeb`). Le commit du rapport vient après, à part.

| porte | mesuré | attendu | |
|---|---|---|---|
| P0 | tête de `main` = `b953750ebfa1839b64a693a94bb0a677a2c9d464` ; rituel sur `base/` = le bloc « base », ligne pour ligne ; autotest 50/50 avant de commencer | idem | OK |
| P1 | `code=v0.1 changelog=v0.1 cache=flh-v0.1 coherente=oui` | `v0.1` cohérente | OK |
| P2 | 27 fichiers, 214316 octets, `caches: 0` | 27 (+26) | OK |
| P3 | `syntaxe: 10/10` | 10/10 | OK |
| P4 | `tests: 20 passed, 0 failed` ; `sauvegardes: lues=1/1 schema=1` | ≥ 8 passés, 0 échec ; 1/1 | OK |
| P5 | `i18n: fr=46 en=46 manquantes=0 orphelines=0 inconnues=0` | idem | OK |
| P6 | `horsligne: externes=0 precache=21 manquants=0 en_trop=0` | idem | OK |
| P7 | `ecran: rendus=48 verifs=192/192 console=0 externes=0 debords=0 horsligne_reel=ok` | idem | OK |
| P8 | `SCHEMA = 1` ; la sauvegarde de référence se relit (`lues=1/1 schema=1`) | inchangé | OK |
| P9 | `a_completer=0` ; première entrée `v0.1` | idem | OK |
| P10 | `ecart: ajoutes=26 modifies=1 retires=0` ; liste = celle du §4 (le seul `M` est `CHANGELOG.md`) | idem | OK |
| P11 | empreinte `579b19775ed4c7f190362bcfe52fada7eaf1d8c2b53abc8db07143e3035f2d91` (pas de maquette) | — | annoncée |
| P12 | `git diff --stat origin/main HEAD -- banc PROMPT_DEV_FLH.md .gitattributes .gitignore .github` : seuls `.github/workflows/pages.yml` et `banc/sauvegardes/v0.1-exemple.json` | ces deux fichiers | OK |

Mes comptes : **poids 214316**, **20 tests** (14 sur la sauvegarde, 6 sur les dictionnaires), **empreinte** ci-dessus, **46 clés**, **21 entrées** de `PRECACHE`.

## 3 · Les critères

- **C1** — tenu. Les deux blocs égalent le cadrage ligne pour ligne, aux comptes annoncés près (`poids`, `tests`, `empreinte`).
- **C2** — tenu. `ecran: rendus=48 verifs=192/192 console=0 externes=0 debords=0 horsligne_reel=ok`, avec `lots/v0.1/controles.json` sur `mesure/`.
- **C3** — tenu. `lire()` : fichier valide, mauvais format, schéma supérieur avec `code === 'SCHEMA_RECENT'`, personnage sans `nom` (et sans `id`), valeurs par défaut complétées, champs inconnus conservés (et copie indépendante). `t()` : clé simple, remplacement de `{n}` (y compris répété), clé inconnue, dictionnaires FR et EN aux mêmes clés et mêmes marqueurs.
- **C4** — tenu. `sha256 7025fb9c718fd5ed6aee49d578813ea62a0a9a304eda7749efec5728da7de530` pour `lots/v0.1/etats/exemple.json` et pour `banc/sauvegardes/v0.1-exemple.json`.
- **C5** — tenu. `i18n` à zéro partout ; aucun `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval` dans `js/` ni `sw.js` (grep) ; les 46 textes du dictionnaire sont comparés par script au tableau du §2-F : 0 écart sur 92 chaînes. Le `README.md` et la phrase du `CHANGELOG` sont comparés par script au cadrage : identiques. Contrôle de bout en bout : un nom saisi `Zéphyrine <b>x</b>` s'affiche tel quel, sans balise interprétée.
- **C6** — tenu. Le rituel passé deux fois : sorties identiques (`cmp`). Le contrôle d'écran passé deux fois : 49 lignes identiques (`cmp`, hors captures).
- **C7** — tenu. `autotest: 50/50`, 0 ligne `ECHEC`, dans mon banc qui contient `v0.1-exemple.json`.

## 4 · La maquette

Sans objet (le cadrage n'en demande pas). Aucune capture ouverte ; les icônes sont vérifiées par leurs dimensions (192×192, 512×512, 512×512), leur poids (4461, 13101, 12771 octets) et le comptage de pixels décrit plus haut.

## 5 · Les sorties brutes (sur `mesure/`, l'archive du commit de livraison)

### Environnement
```
/bin/bash
v22.22.0
10.9.4
git version 2.43.0
```

### Rituel sur `base/` (avec le dossier de sauvegardes de la base, vide : `--sauvegardes` sur un dossier vide)
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

### Rituel sur `mesure/`
```
fichiers: 27
poids: 214316
caches: 0
syntaxe: 10/10
tests: 20 passed, 0 failed
sauvegardes: lues=1/1 schema=1
i18n: fr=46 en=46 manquantes=0 orphelines=0 inconnues=0
horsligne: externes=0 precache=21 manquants=0 en_trop=0
version: code=v0.1 changelog=v0.1 cache=flh-v0.1 coherente=oui
changelog: a_completer=0
empreinte: 579b19775ed4c7f190362bcfe52fada7eaf1d8c2b53abc8db07143e3035f2d91
```

### Mesure commune
```
M CHANGELOG.md
A README.md
A css/app.css
A fonts/LICENSE-Alegreya.txt
A fonts/LICENSE-IM-Fell-English-SC.txt
A fonts/alegreya-latin-400-italic.woff2
A fonts/alegreya-latin-400-normal.woff2
A fonts/alegreya-latin-700-normal.woff2
A fonts/im-fell-english-sc-latin-400-normal.woff2
A i18n/en.json
A i18n/fr.json
A icons/icon-192.png
A icons/icon-512.png
A icons/icon-maskable-512.png
A icons/icon.svg
A index.html
A js/app.js
A js/i18n.js
A js/precache.js
A js/sauvegarde.js
A js/stockage.js
A js/version.js
A js/vues.js
A manifest.webmanifest
A sw.js
A tests/i18n.test.js
A tests/sauvegarde.test.js
ecart: ajoutes=26 modifies=1 retires=0
```

### Contrôle d'écran
```
accueil-vide tablette fr jour verifs=5/5 console=0 externes=0 debord=0
accueil-vide tablette fr chandelle verifs=5/5 console=0 externes=0 debord=0
accueil-vide tablette en jour verifs=5/5 console=0 externes=0 debord=0
accueil-vide tablette en chandelle verifs=5/5 console=0 externes=0 debord=0
accueil-vide telephone fr jour verifs=5/5 console=0 externes=0 debord=0
accueil-vide telephone fr chandelle verifs=5/5 console=0 externes=0 debord=0
accueil-vide telephone en jour verifs=5/5 console=0 externes=0 debord=0
accueil-vide telephone en chandelle verifs=5/5 console=0 externes=0 debord=0
accueil-exemple tablette fr jour verifs=4/4 console=0 externes=0 debord=0
accueil-exemple tablette fr chandelle verifs=4/4 console=0 externes=0 debord=0
accueil-exemple tablette en jour verifs=4/4 console=0 externes=0 debord=0
accueil-exemple tablette en chandelle verifs=4/4 console=0 externes=0 debord=0
accueil-exemple telephone fr jour verifs=4/4 console=0 externes=0 debord=0
accueil-exemple telephone fr chandelle verifs=4/4 console=0 externes=0 debord=0
accueil-exemple telephone en jour verifs=4/4 console=0 externes=0 debord=0
accueil-exemple telephone en chandelle verifs=4/4 console=0 externes=0 debord=0
nouveau tablette fr jour verifs=4/4 console=0 externes=0 debord=0
nouveau tablette fr chandelle verifs=4/4 console=0 externes=0 debord=0
nouveau tablette en jour verifs=4/4 console=0 externes=0 debord=0
nouveau tablette en chandelle verifs=4/4 console=0 externes=0 debord=0
nouveau telephone fr jour verifs=4/4 console=0 externes=0 debord=0
nouveau telephone fr chandelle verifs=4/4 console=0 externes=0 debord=0
nouveau telephone en jour verifs=4/4 console=0 externes=0 debord=0
nouveau telephone en chandelle verifs=4/4 console=0 externes=0 debord=0
fiche tablette fr jour verifs=3/3 console=0 externes=0 debord=0
fiche tablette fr chandelle verifs=3/3 console=0 externes=0 debord=0
fiche tablette en jour verifs=3/3 console=0 externes=0 debord=0
fiche tablette en chandelle verifs=3/3 console=0 externes=0 debord=0
fiche telephone fr jour verifs=3/3 console=0 externes=0 debord=0
fiche telephone fr chandelle verifs=3/3 console=0 externes=0 debord=0
fiche telephone en jour verifs=3/3 console=0 externes=0 debord=0
fiche telephone en chandelle verifs=3/3 console=0 externes=0 debord=0
reglages tablette fr jour verifs=6/6 console=0 externes=0 debord=0
reglages tablette fr chandelle verifs=6/6 console=0 externes=0 debord=0
reglages tablette en jour verifs=6/6 console=0 externes=0 debord=0
reglages tablette en chandelle verifs=6/6 console=0 externes=0 debord=0
reglages telephone fr jour verifs=6/6 console=0 externes=0 debord=0
reglages telephone fr chandelle verifs=6/6 console=0 externes=0 debord=0
reglages telephone en jour verifs=6/6 console=0 externes=0 debord=0
reglages telephone en chandelle verifs=6/6 console=0 externes=0 debord=0
apropos tablette fr jour verifs=2/2 console=0 externes=0 debord=0
apropos tablette fr chandelle verifs=2/2 console=0 externes=0 debord=0
apropos tablette en jour verifs=2/2 console=0 externes=0 debord=0
apropos tablette en chandelle verifs=2/2 console=0 externes=0 debord=0
apropos telephone fr jour verifs=2/2 console=0 externes=0 debord=0
apropos telephone fr chandelle verifs=2/2 console=0 externes=0 debord=0
apropos telephone en jour verifs=2/2 console=0 externes=0 debord=0
apropos telephone en chandelle verifs=2/2 console=0 externes=0 debord=0
ecran: rendus=48 verifs=192/192 console=0 externes=0 debords=0 horsligne_reel=ok
```

### Auto-essai (dernière ligne)
```
autotest: 50/50
```

### P12
```
 .github/workflows/pages.yml        | 36 ++++++++++++++++++++++++++++++++++++
 banc/sauvegardes/v0.1-exemple.json | 25 +++++++++++++++++++++++++
 2 files changed, 61 insertions(+)
```

### Contrôle de bout en bout hors dépôt (script jetable, hors du dépôt)
Chromium du banc, téléphone 412 px, site servi sous le sous-chemin `/Fabled-Lands-Helper-App/` : **47/47**. Il couvre ce que les tests et le contrôle d'écran ne voient pas :
création (nom vide refusé, nom rogné, HTML non interprété), liste triée du plus récemment modifié, fiche, suppression en deux touchers avec retour du texte après 5 s, id inconnu, import par le bouton (valide, illisible, mauvais format, schéma plus récent, même fichier deux fois), export (nom du fichier à la date locale, contenu au schéma 1, indenté de 2 espaces), langue et ambiance enregistrées, adresse prioritaire et non enregistrée, une seule `<h1>` par écran, toute cible touchable ≥ 44 px, marges ≥ 16 px, aucun débord, cache `flh-v0.1` à 21 entrées, page contrôlée par le service worker, hors ligne sur la racine avec `?…`, racine nue et `index.html` avec 0 requête au serveur, 0 message de console (erreur ou avertissement), 0 requête hors du sous-chemin. Polices chargées : Alegreya 400, 700 et IM Fell English SC 400 ; l'italique est déclarée et en cache, mais aucun texte ne l'emploie encore (état « unloaded »).

## 6 · Écarts au cadrage

Aucun écart de règle. Les choix du § 1 (nos 1 à 11) sont les seuls endroits où j'ai dû décider d'un détail que le cadrage ne fixe pas.

## 7 · La méthode

- Début : 16:35 (clone) ; fin : 17:02 (environ 27 minutes), le 23 octobre 2026.
- Interventions : une correction en cours de route — `changerAmbiance` appliquait le thème après l'écriture IndexedDB ; il l'applique maintenant avant (« appliquée aussitôt », §2-20), révélé par mon contrôle de bout en bout (un faux échec de ce même script, dû à une course dans le script lui-même, a été corrigé dans le script). Le commit de livraison a été refait en un seul commit sur le commit du cadrage avant le premier `push`.
- Rien ne m'a ralenti : le banc a marché du premier coup (auto-essai 50/50, contrôle d'écran 192/192 dès la première exécution).
- Les PNG sont rendus par un script jetable (`/home/claude/dev_v0.1/outils/`), non commité, depuis `icons/icon.svg` par le Chromium du banc.
