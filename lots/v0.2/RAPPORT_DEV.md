# RAPPORT DU DEV — lot `v0.2` (l'installation et les mises à jour)

## 1 · Ce dont je ne suis pas sûr

Rien de bloquant. Cinq choix d'exécution que le cadrage laissait ouverts, à relire :

1. **« Installer » (règle 4)** : `installer()` oublie l'événement aussitôt après l'avoir pris (pas deux appels possibles à `prompt()`), attend la réponse de `prompt()`, puis rend l'écran à nouveau. Après un refus, l'état est donc « manuelle » (le geste revient).
2. **« Masquer » (règle 6)** : pour tenir « retirée quand même, pour cette ouverture de l'application » si l'écriture échoue, `js/vues.js` garde une variable de module `aideMasqueeCetteFois`, lue par l'accueil. Le cadrage ne nomme pas ce mécanisme.
3. **Classes ajoutées** : `.aide-installation` (la marge de 24 px au-dessus de l'aide, règle 19) et, dans l'aide et la section « Application », des `div.actions` existantes pour ranger les boutons. Aucune autre règle visuelle.
4. **Le message de vérification** (`maj-message`) n'a que la classe `message` (pas `succes` / `echec`) : le cadrage n'en demande pas d'autre.
5. **Nouveau personnage (règle 14)** : tout échec d'`enregistrerPersonnages` affiche `stockage.bloque`, pas seulement un blocage du navigateur.

Aucun code existant ne jouait le rôle de `js/pwa.js` ni de `stockageDisponible()` (vérifié avant de les créer).

## 2 · Le commit de livraison et les portes

Commit de livraison : `e88f773a6c97495e85674724c93cfb8343e649f9` (« Lot v0.2 — livraison »). Base : `672644aae31dea16ddb4b96a1de12782b029117d`, tête de `main` constatée.

| porte | mesuré | attendu |
|---|---|---|
| P0 base | rituel sur `base/` = bloc « base » ligne pour ligne ; tête de `main` = `672644a…` ; autotest `50/50` | idem |
| P1 version | code=v0.2 changelog=v0.2 cache=flh-v0.2 coherente=oui | idem |
| P2 fichiers | 29 fichiers, 222970 octets, caches=0 | 29, 0 cache |
| P3 syntaxe | 12/12 | 12/12 |
| P4 tests | 30 passed, 0 failed ; sauvegardes lues=1/1 schema=1 | ≥ 26 |
| P5 traductions | fr=61 en=61 manquantes=0 orphelines=0 inconnues=0 | idem |
| P6 hors ligne | externes=0 precache=22 manquants=0 en_trop=0 | idem |
| P7 écran | `ecran: rendus=48 verifs=296/296 console=0 externes=0 debords=0 horsligne_reel=ok` | idem |
| P8 sauvegarde | schéma 1 inchangé (`js/sauvegarde.js` intact) ; lues=1/1 schema=1 | idem |
| P9 CHANGELOG | a_completer=0 ; première entrée = v0.2 | idem |
| P10 écart | `ecart: ajoutes=2 modifies=14 retires=0`, la liste du §4 | idem |
| P11 empreinte | `577b35c25c2d9b262d0cdbe919ccf7d547a7b5ccd93ee5a666ef0e4a24432f89` | à annoncer |
| P12 hors du code | `git diff --stat origin/main HEAD -- banc PROMPT_DEV_FLH.md .gitattributes .gitignore .github` : vide | vide |

## 3 · Les critères

- **C1 tenu** : les deux blocs du rituel égalent le cadrage à l'octet, aux comptes annoncés près : poids 222970, tests 30, empreinte ci-dessus.
- **C2 tenu** : `ecran: rendus=48 verifs=296/296 console=0 externes=0 debords=0 horsligne_reel=ok`.
- **C3 tenu** : `tests/pwa.test.js`, **10 tests** : `etatInstallation` (4 : installee, autonome l'emporte, proposable, manuelle) ; `issueVerification` (6 : a_jour, telechargement, impossible pour chacune de ses trois causes, impossible l'emporte sur nouvelle).
- **C4 tenu** : les quatre sha256 de `mesure/icons/` égalent ceux du §2-20 (copie à l'octet de `lots/v0.2/icones/`).
- **C5 tenu** : 0 `innerHTML` / `outerHTML` / `insertAdjacentHTML` dans `js/` et `index.html` ; 0 appel `t(` à clé non littérale ; 0 chaîne d'interface hors dictionnaires (les 15 clés neuves sont utilisées par appels littéraux : orphelines=0, inconnues=0) ; plus aucune couleur littérale dans `css/app.css` hors des définitions de jetons.
- **C6 tenu** : le rituel passé deux fois sur `mesure/` : sorties identiques (`cmp`) ; le contrôle d'écran passé deux fois (sur `livre/` puis sur `mesure/`, même contenu) : toutes les lignes identiques.
- **C7 tenu** : voir §5.
- **C8 tenu** : `autotest: 50/50` au début, et deux fois encore à la fin, 0 ligne `ECHEC`.

## 4 · La maquette

Sans objet (le cadrage n'en demande pas).

## 5 · Les sorties brutes (sur `mesure/`)

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

```
M CHANGELOG.md
M css/app.css
M i18n/en.json
M i18n/fr.json
M icons/icon-192.png
M icons/icon-512.png
M icons/icon-maskable-512.png
M icons/icon.svg
M index.html
M js/app.js
M js/precache.js
A js/pwa.js
M js/stockage.js
M js/version.js
M js/vues.js
A tests/pwa.test.js
ecart: ajoutes=2 modifies=14 retires=0
```

Dernière ligne du contrôle d'écran :

```
ecran: rendus=48 verifs=296/296 console=0 externes=0 debords=0 horsligne_reel=ok
```

C7 (script dans `/tmp/dev_v0.2/c7.mjs`, hors dépôt ; copie de `mesure/` servie par un serveur `node:http` sous `/Fabled-Lands-Helper-App/`, avec `Cache-Control: max-age=600` comme GitHub Pages ; Chromium du banc ; un navigateur par scénario) :

```
ok    1 premier chargement : service worker prêt et contrôleur pris — caches=flh-v0.2
ok    1 premier chargement : bandeau caché
ok    3 à jour : maj.a_jour
ok    3 à jour : bandeau toujours caché
ok    4 hors ligne : maj.impossible — navigator.onLine=false
ok    2 mise à jour : version.js servi change seul
ok    2 mise à jour : maj.telechargement — message="Une nouvelle version se télécharge : elle vous sera proposée dans un instant."
ok    2 mise à jour : bandeau visible en moins de 10 s — 166 ms
ok    2 mise à jour : bandeau montré (visible à l'écran)
ok    2 mise à jour : recharger → « Version v0.2.99 » — "Version v0.2.99"
ok    2 mise à jour : cache flh-v0.2.99 seul — flh-v0.2.99
ok    5 installation proposée : bouton à la place du geste — installer=1 geste=0
ok    5 installation proposée : un toucher appelle prompt() une fois — appels=1
ok    5 installation proposée : l'événement est oublié (le geste revient) — geste=1
ok    6 installée : l'accueil n'a pas d'aide
ok    6 installée : les réglages montrent « installee »
ok    7 masquer : la section disparaît — avant=1 apres=0
ok    7 masquer : après rechargement, elle reste absente — compte=0
ok    8 stockage bloqué : accueil — typeof indexedDB=undefined bloque=1 nouveau=0 aide=0
ok    8 stockage bloqué : « Créer » → stockage.bloque sous le champ, adresse #/nouveau — hash=#/nouveau
ok    9 aucune erreur de console sur les points 1 à 7
(point 8 : erreurs de console 0)
c7: lignes=21 echecs=0
```

## 6 · Écarts au cadrage

Aucun. (Le cadrage dit « 29 fichiers en tout (27 + 2) » ; mesuré 29.)

## 7 · La méthode

- Début 16:32 UTC, fin 16:47 UTC. Environnement constaté : `/bin/bash`, Node v22.22.0, npm 10.9.4, git 2.43.0.
- Aucune intervention ; aucun arrêt. Le clone a pris moins d'une minute, `npm ci` du banc 15 s, un contrôle d'écran complet environ 75 s.
- Éditions par petits scripts de remplacement à correspondance unique (une absence de correspondance aurait interrompu l'édition) ; les deux dictionnaires ont été écrits par script pour garantir les caractères U+00A0, U+22EE et U+2026 du §2-F.
