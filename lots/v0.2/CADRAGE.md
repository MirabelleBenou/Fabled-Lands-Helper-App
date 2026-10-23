# CADRAGE — L'installation et les mises à jour · `v0.2`
### 23 octobre 2026 · CdP-2 · branche `lot/v0.2` de `MirabelleBenou/Fabled-Lands-Helper-App` · base `672644a`

**Dev : Sonnet · High · session neuve**

---

## §0 · Les pièces

- **La base** : `main` au `672644aae31dea16ddb4b96a1de12782b029117d` (la `v0.1` publiée). Si la tête de `main` n'est pas
  ce commit : arrêt.
- **Sur cette branche** :
  - ce cadrage ;
  - `lots/v0.2/controles.json`, les contrôles d'écran du lot ;
  - `lots/v0.2/etats/exemple.json`, la sauvegarde de deux personnages fictifs (copie de celle du lot `v0.1`) ;
  - `lots/v0.2/icones/`, **les quatre fichiers d'icône validés**, à reprendre tels quels (§2-D).
- **À lire avant de construire** : `PROMPT_DEV_FLH.md` (v2), `banc/README.md` — **surtout le § 4, le contrat**.

## §1 · Ce que fait le lot, et pourquoi

La `v0.1` est en production. Sur la tablette, dans Brave, le menu n'offre pas « Installer l'application » : Brave ne
propose que « Ajouter à l'écran d'accueil ». L'application elle-même est installable : dans Chromium, le service worker
est actif, le manifeste n'a aucune erreur et le navigateur ne signale aucune erreur d'installabilité. Ce lot rend
l'application facile à installer et à garder à jour **quel que soit le navigateur** :

- **une aide « Installer l'application »** sur l'accueil : un bouton quand le navigateur sait installer d'un geste
  (Chrome, Edge, Samsung Internet…), sinon le geste à faire dans son menu ; elle disparaît une fois l'application
  installée, et se masque ;
- **les mises à jour** : un bandeau « Une nouvelle version est prête » quand une version neuve vient d'arriver, et, dans
  les réglages, la version avec un bouton « Vérifier les mises à jour » ;
- **une nouvelle icône**, le monogramme « FL » du Carnet de route ;
- **deux dettes de la `v0.1`** : l'ombre de la page devient un jeton de couleur, et un stockage bloqué par le navigateur
  se dit à l'écran au lieu d'échouer en silence.

## §2 · Les décisions et les règles

### A · L'installation

1. **Un module neuf, `js/pwa.js`**, porte l'installation et les mises à jour. **Il s'importe dans Node sans navigateur**
   (aucun accès à `window`, `document`, `navigator` au chargement) : ses deux fonctions pures sont testées. Il exporte au
   moins :
   - **`etatInstallation({ autonome, evenementDisponible })`**, pure, qui rend `"installee"` si `autonome` est vrai,
     sinon `"proposable"` si `evenementDisponible` est vrai, sinon `"manuelle"` ;
   - **`issueVerification({ priseEnCharge, enLigne, erreur, nouvelle })`**, pure, qui rend `"impossible"` si
     `priseEnCharge` est faux, si `enLigne` est faux ou si `erreur` est vrai ; sinon `"telechargement"` si `nouvelle`
     est vrai ; sinon `"a_jour"` ;
   - les fonctions du navigateur que décrivent les règles 2 à 4 et 9 à 11, que `js/app.js` et `js/vues.js` appellent.
2. **L'écoute** commence au démarrage, dans `js/app.js`, avant le premier écran, par une fonction de `js/pwa.js` :
   - **`beforeinstallprompt`** : l'application appelle `preventDefault()` et garde l'événement ; l'état devient
     `"proposable"` ;
   - **`appinstalled`** : l'événement gardé est oublié ; l'état devient `"installee"` ;
   - **l'application est « installée »** (`autonome`) quand `matchMedia('(display-mode: standalone)')`,
     `(display-mode: fullscreen)` ou `(display-mode: minimal-ui)` est vrai, ou que `navigator.standalone === true`.
3. **Quand l'état change** et que l'écran affiché est l'accueil ou les réglages, cet écran se rend à nouveau. Les autres
   écrans ne se rendent pas à nouveau (un formulaire en cours ne se vide pas).
4. **Le bouton « Installer »** appelle `prompt()` sur l'événement gardé, puis l'oublie, quelle que soit la réponse
   (un événement ne sert qu'une fois) ; l'écran se rend à nouveau selon l'état.
5. **L'aide de l'accueil** : une section `data-test="aide-installation"`, encadrée à la plume (classe `cadre`), **après**
   la liste des personnages (ou après `accueil.vide`). Elle porte, dans cet ordre :
   - le titre `<h2>` `installation.titre` ;
   - le texte `installation.texte` ;
   - à l'état `"proposable"`, le bouton principal `installation.bouton` (`data-test="installer"`) ; à l'état
     `"manuelle"`, le paragraphe `installation.geste` (`data-test="installer-geste"`, classe `legende`) ;
   - le bouton `installation.masquer` (`data-test="masquer-aide"`), à l'allure d'un lien (classe `lien`).
   
   **Elle n'apparaît pas** à l'état `"installee"`, ni quand le réglage `aide_installation` vaut `"masquee"`, ni quand le
   stockage est bloqué (règle 14).
6. **« Masquer cette aide »** écrit le réglage `aide_installation` = `"masquee"` (magasin `reglages`, par
   `ecrireReglage`) et retire la section. Si l'écriture échoue, la section est retirée quand même, pour cette ouverture
   de l'application. **Ce réglage n'est pas dans le fichier de sauvegarde** : le format exporté ne change pas.

### B · Les mises à jour

7. **L'enregistrement du service worker** devient
   `navigator.serviceWorker.register('sw.js', { type: 'module', updateViaCache: 'none' })`.
   **Mesuré par le CdP** dans le Chromium du banc : avec le `sw.js` inchangé à l'octet, un changement du seul
   `js/version.js` est vu par `registration.update()` (`updatefound`, puis `controllerchange`, et le cache `flh-<neuve>`
   remplace l'ancien). `updateViaCache: 'none'` évite que les modules importés par `sw.js` passent par le cache HTTP
   (dix minutes sur GitHub Pages). **`sw.js` ne change pas.**
8. **Le bandeau** vit dans `index.html`, après la `div.page` :
   `<div class="bandeau" data-test="bandeau-maj" role="status" hidden>` contenant un paragraphe
   `data-i18n="maj.bandeau"` et un bouton principal `<button type="button" class="bouton" data-test="recharger"
   data-i18n="maj.recharger">`.
9. **Il s'affiche** (l'attribut `hidden` est retiré) à un `controllerchange` **seulement si la page avait déjà un
   contrôleur** : au premier chargement de l'application, la prise de contrôle par le premier service worker ne montre
   pas le bandeau. Après un `controllerchange`, la page « a un contrôleur » : un changement suivant le montre.
10. **« Recharger »** recharge la page (`location.reload()`).
11. **« Vérifier les mises à jour »** (réglages, règle 13) :
    - affiche aussitôt `maj.verification` dans le message `data-test="maj-message"` ;
    - puis calcule l'issue par `issueVerification` : `priseEnCharge` = le navigateur a des service workers et une
      inscription existe ; `enLigne` = `navigator.onLine` ; `erreur` = `registration.update()` a été rejeté ;
      `nouvelle` = après `update()`, `registration.installing` ou `registration.waiting` existe (**on n'appelle pas
      `update()`** si `priseEnCharge` ou `enLigne` est faux) ;
    - affiche `maj.a_jour`, `maj.telechargement` ou `maj.impossible`, **chacun par un appel littéral `t('…')`** (aucune
      clé construite) ;
    - le bandeau de la règle 9 apparaît ensuite de lui-même quand la nouvelle version prend la main.

### C · Les écrans

12. **L'accueil** `#/` : le §2-17 de la `v0.1` ne change pas, sauf l'aide de la règle 5 ajoutée à la fin, et la
    règle 14.
13. **Réglages** `#/reglages` : après la section de sauvegarde, une seconde section encadrée (classe `cadre`)
    `data-test="application"`, qui porte, dans cet ordre :
    - le titre `<h2>` `reglages.application` ;
    - **la ligne de version** (`data-test="version"`, classe `legende`), écrite comme en `v0.1` :
      `<reglages.version> <VERSION>`, soit « Version v0.2 » ; elle **quitte le bas de l'écran** pour venir ici, et
      reste unique ;
    - le bouton principal `maj.verifier` (`data-test="verifier-maj"`) ;
    - le message `data-test="maj-message"` (`role="status"`, classe `message`), vide au départ ;
    - l'installation, selon l'état : `"installee"` → le paragraphe `installation.installee` (`data-test="installee"`,
      classe `legende`) ; `"proposable"` → le bouton principal `installation.bouton` (`data-test="installer"`) ;
      `"manuelle"` → le paragraphe `installation.geste` (`data-test="installer-geste"`, classe `legende`). **Ici,
      l'aide ne se masque pas.**
14. **Le stockage bloqué** (dette `dette-stockage-bloque`) :
    - `js/stockage.js` exporte **`stockageDisponible()`**, qui rend une promesse de `true` si la base s'ouvre, de
      `false` sinon (IndexedDB absent, ouverture refusée) ; **il reste le seul module qui touche IndexedDB** ;
    - **l'accueil**, si le stockage n'est pas disponible, affiche sous le titre le paragraphe `stockage.bloque`
      (`data-test="stockage-bloque"`, classe `erreur`), **et rien d'autre** : ni bouton « Nouveau personnage », ni liste,
      ni aide à l'installation ;
    - **Nouveau personnage** : si l'enregistrement échoue, le message `stockage.bloque` s'affiche dans le paragraphe
      d'erreur du formulaire, et l'écran reste sur le formulaire (aujourd'hui, l'échec est avalé et l'écran revient à
      l'accueil).
15. **La fiche** : le texte de `fiche.bientot` change (§2-F) — la feuille n'arrive plus « dans la prochaine version ».

### D · Le visuel

16. **Le jeton `--ombre`** (dette `dette-ombre-jeton`) : `css/app.css` définit `--ombre: rgba(0, 0, 0, .45)` sur
    `:root` **et** dans le bloc de l'ambiance Chandelle (même valeur) ; l'ombre de la page devient
    `0 18px 40px -18px var(--ombre), 0 0 120px var(--halo) inset`. **Le rendu de la page ne change pas.** Il ne reste
    plus aucune couleur littérale hors des définitions de jetons.
17. **Le bandeau** (`.bandeau`) :
    - `position: fixed`, en bas de l'écran : `bottom: calc(16px + env(safe-area-inset-bottom, 0px))`,
      `left: max(16px, env(safe-area-inset-left, 0px))`, `right: max(16px, env(safe-area-inset-right, 0px))` ;
      largeur maximale 828 px, centré (`margin-inline: auto`) ; `z-index: 10` ;
    - `display: flex`, `flex-wrap: wrap`, `align-items: center`, `justify-content: space-between`, `gap: 8px 16px`,
      marge interne 12 px 16 px ;
    - fond `--page`, texte `--encre`, bordure 2 px `--filet`, rayon 3 px, ombre `0 8px 24px -8px var(--ombre)` ;
      son paragraphe sans marge ;
    - **`.bandeau[hidden] { display: none; }`** (sinon `display: flex` l'emporte sur l'attribut).
18. **Le bouton à l'allure d'un lien** (`button.lien`) a exactement l'allure de `a.lien` : sans fond ni bordure, même
    police, même couleur, même soulignement, 44 px de haut au moins, le focus de `v0.1`.
19. **L'aide et la section « Application »** reprennent le cadre à la plume et les boutons existants ; une marge de
    24 px au-dessus de l'aide, comme `.sauvegarde`. Aucune autre règle visuelle.
20. **Les icônes** (validées par Benoit, piste A) : copie **à l'octet** des fichiers de `lots/v0.2/icones/` sur ceux de
    `icons/`, mêmes noms. **Aucun rendu, aucune retouche.**

    | fichier | sha256 |
    |---|---|
    | `icons/icon.svg` | `4de81825da120cfc989bea404bfa33a373a2b3f260a98c1c7e075daf7b83bef1` |
    | `icons/icon-192.png` | `7036aaf0bb9dbcef88d5888e2edbf25790137c131bc81bf10f1cb3aa1c2062d7` |
    | `icons/icon-512.png` | `f5c9097709b77f9422098cfda52c614e35d5ed373228b0f9828a4d569286c1d5` |
    | `icons/icon-maskable-512.png` | `cbc35d32fa5e79f06143690692a0c0c2517cf539f61b74fc05f58d039d313df0` |

    `manifest.webmanifest` ne change pas.

### E · La technique, rappels

21. Les règles A de la `v0.1` tiennent : modules ES, chemins relatifs, aucune dépendance, contrat du banc, aucune chaîne
    en dur, aucun `innerHTML` alimenté par une donnée, **aucune erreur en console** dans un parcours normal.
22. **`PRECACHE`** gagne `js/pwa.js`, à sa place dans l'ordre alphabétique : **22 entrées**.
23. **La version** : `VERSION = "v0.2"` ; le cache devient `flh-v0.2`.
24. **Le format de sauvegarde ne change pas** (schéma 1, mêmes champs).

### F · Les textes affichés, au caractère près

*61 clés, les mêmes dans les deux dictionnaires : les 46 de la `v0.1`, dont une modifiée, et 15 neuves. Chacune est
utilisée au moins une fois, par une clé littérale.*

**Modifiée** :

| clé | FR | EN |
|---|---|---|
| `fiche.bientot` | La feuille d'aventure arrive dans une prochaine version. | The adventure sheet arrives in a coming version. |

**Neuves** :

| clé | FR | EN |
|---|---|---|
| `installation.titre` | Installer l'application | Install the app |
| `installation.texte` | Installée, elle s'ouvre depuis l'écran d'accueil comme une application et fonctionne sans réseau. | Once installed, it opens from the home screen like an app and works without a network. |
| `installation.bouton` | Installer | Install |
| `installation.geste` | Ouvrez le menu du navigateur (⋮), puis choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil ». Sur iPhone et iPad : bouton Partager, puis « Sur l'écran d'accueil ». | Open the browser menu (⋮), then choose "Install app" or "Add to Home screen". On iPhone and iPad: the Share button, then "Add to Home Screen". |
| `installation.masquer` | Masquer cette aide | Hide this help |
| `installation.installee` | L'application est installée sur cet appareil. | The app is installed on this device. |
| `reglages.application` | Application | App |
| `maj.verifier` | Vérifier les mises à jour | Check for updates |
| `maj.verification` | Vérification en cours… | Checking… |
| `maj.a_jour` | L'application est à jour. | The app is up to date. |
| `maj.telechargement` | Une nouvelle version se télécharge : elle vous sera proposée dans un instant. | A new version is downloading: it will be offered to you in a moment. |
| `maj.impossible` | Vérification impossible sans réseau. Réessayez une fois connecté à Internet. | Cannot check without a network. Try again once you are online. |
| `maj.bandeau` | Une nouvelle version est prête. | A new version is ready. |
| `maj.recharger` | Recharger | Reload |
| `stockage.bloque` | Le navigateur bloque l'enregistrement : les personnages ne peuvent pas être gardés sur cet appareil. Quittez la navigation privée ou autorisez les données de ce site, puis rouvrez l'application. | The browser is blocking storage: characters cannot be kept on this device. Leave private browsing or allow this site's data, then reopen the app. |

*Le caractère « ⋮ » est U+22EE (points de suspension verticaux) ; en français, les guillemets sont « » (U+00AB, U+00BB)
avec une espace insécable U+00A0 à l'intérieur, de part et d'autre du texte cité ; en anglais, des guillemets droits
`"` ; les points de suspension de `maj.verification` sont le caractère U+2026. Partout ailleurs, les espaces sont des
espaces ordinaires, comme dans les textes de la `v0.1`.*

## §3 · Ce qui ne bouge pas

- **`banc/`**, **`PROMPT_DEV_FLH.md`**, **`.gitattributes`**, **`.gitignore`**, **`.github/`** : intacts.
- **`sw.js`**, **`manifest.webmanifest`**, **`js/sauvegarde.js`**, **`js/i18n.js`**, **`README.md`**, les polices et les
  tests existants : intacts.
- **Le format de sauvegarde** (schéma 1).
- **Le livre** : rien de neuf.

## §4 · Les fichiers

**Dans l'archive** — 29 fichiers en tout (27 + 2) :

| fichier | change | ce qui y est |
|---|---|---|
| `js/pwa.js` | ajouté | §2-1 à 4, 7, 9 à 11 |
| `tests/pwa.test.js` | ajouté | §8 |
| `index.html` | modifié | le bandeau (§2-8) |
| `css/app.css` | modifié | `--ombre`, le bandeau, `button.lien`, la marge de l'aide (§2-D) |
| `js/app.js` | modifié | l'écoute, l'enregistrement du service worker, le bandeau, le rendu à nouveau (§2-2, 3, 7 à 10) |
| `js/vues.js` | modifié | l'aide de l'accueil, la section « Application », le stockage bloqué (§2-5, 6, 11, 13, 14) |
| `js/stockage.js` | modifié | `stockageDisponible()` (§2-14) |
| `js/precache.js` | modifié | `js/pwa.js` (§2-22) |
| `js/version.js` | modifié | `v0.2` |
| `i18n/fr.json`, `i18n/en.json` | modifiés | §2-F |
| `icons/icon.svg`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-maskable-512.png` | modifiés | §2-20 |
| `CHANGELOG.md` | modifié | §6 |

**Hors de l'archive** : `lots/v0.2/RAPPORT_DEV.md` (commit à part). **Rien d'autre.** Un fichier ou un module de plus te
paraît nécessaire : arrête-toi.

## §5 · Les critères et la prédiction

**Le bloc « base »** (rituel sur `git archive` de `672644a`, avec les sauvegardes du banc de `main`), ligne pour ligne :

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

**Le rituel sur `mesure/`** — `<…>` = un compte que tu annonces :

```
fichiers: 29
poids: <octets>
caches: 0
syntaxe: 12/12
tests: <n> passed, 0 failed
sauvegardes: lues=1/1 schema=1
i18n: fr=61 en=61 manquantes=0 orphelines=0 inconnues=0
horsligne: externes=0 precache=22 manquants=0 en_trop=0
version: code=v0.2 changelog=v0.2 cache=flh-v0.2 coherente=oui
changelog: a_completer=0
empreinte: <sha256>
```

**Les portes, en deltas** :

| porte | base | attendu | delta |
|---|---|---|---|
| P1 version | `v0.1` | `v0.2`, cohérente | +1 cran mineur |
| P2 fichiers | 27 | 29 | +2 |
| P3 syntaxe | 10/10 | 12/12 | +2 |
| P4 tests | 20 | ≥ 26 passés, 0 échec | ≥ +6 |
| P5 traductions | 46 | 61 = 61, 0 manquante, 0 orpheline, 0 inconnue | +15 |
| P6 hors ligne | `PRECACHE` 21 | 0 externe, `PRECACHE` = 22, 0 manquant, 0 en trop | +1 |
| P7 écran | — | `ecran: rendus=48 verifs=296/296 console=0 externes=0 debords=0 horsligne_reel=ok` | — |
| P8 sauvegarde | `lues=1/1 schema=1` | `lues=1/1 schema=1` | 0 |
| P10 écart | — | `ecart: ajoutes=2 modifies=14 retires=0`, la liste exacte du §4 | — |
| P12 hors du code | — | seul `lots/v0.2/RAPPORT_DEV.md` | — |

**Les critères du lot** :

- **C1** — Les deux blocs ci-dessus, à l'octet, aux comptes annoncés près (`poids`, `tests`, `empreinte`).
- **C2** — `node ecran.mjs <mesure> <lots/v0.2/controles.json>` (depuis ta copie du banc) finit sur la ligne de P7
  exactement.
- **C3** — Les tests de `tests/pwa.test.js` couvrent au moins : `etatInstallation` dans ses trois issues (dont
  `autonome` qui l'emporte sur `evenementDisponible`) ; `issueVerification` dans ses trois issues, dont `"impossible"`
  pour chacune de ses trois causes. Annonce leur nombre.
- **C4** — Les quatre icônes ont les sha256 du §2-20.
- **C5** — Aucune chaîne de l'interface hors des dictionnaires ; aucune clé construite ; aucun `innerHTML` alimenté par
  une donnée.
- **C6** — Le rituel et le contrôle d'écran, passés deux fois, donnent les mêmes lignes à l'octet (hors captures).
- **C7** — **Le parcours de bout en bout**, hors dépôt (dans `/tmp`, jamais commité), par un script Playwright sur une
  copie de `mesure/` servie en local sous un sous-chemin (`/Fabled-Lands-Helper-App/`), avec le Chromium du banc. Sa
  sortie va au rapport, une ligne `ok` / `ECHEC` par point :
  1. **premier chargement** : contexte neuf, accueil chargé, service worker prêt → le bandeau reste caché ;
  2. **une mise à jour** : la page chargée et contrôlée, **le seul `js/version.js` de la copie servie** passe à
     `v0.2.99` ; sur `#/reglages`, « Vérifier les mises à jour » → le message `maj.telechargement`, puis le bandeau
     visible en moins de 10 s ; « Recharger » → la ligne de version dit « Version v0.2.99 » ;
  3. **à jour** : sans rien changer, « Vérifier » → `maj.a_jour` ;
  4. **hors ligne** : `context.setOffline(true)`, « Vérifier » → `maj.impossible` ;
  5. **l'installation proposée** : un événement `beforeinstallprompt` simulé (un `Event` portant une fonction
     `prompt()` espion) → l'accueil montre `data-test="installer"` à la place du geste ; un toucher appelle `prompt()`
     une fois ;
  6. **l'application installée** : `matchMedia('(display-mode: standalone)')` forcé à vrai par un script d'initialisation
     → l'accueil n'a pas d'aide ; les réglages montrent `data-test="installee"` ;
  7. **masquer l'aide** : un toucher sur « Masquer cette aide » → la section disparaît ; après un rechargement, elle
     reste absente ;
  8. **le stockage bloqué** : `indexedDB` retiré par un script d'initialisation → l'accueil montre
     `data-test="stockage-bloque"` et aucun `data-test="nouveau"` ; sur `#/nouveau`, « Créer » avec un nom → le message
     `stockage.bloque` sous le champ, l'adresse reste `#/nouveau` ;
  9. **aucune erreur de console** sur l'ensemble des points 1 à 7.
- **C8** — L'auto-essai du banc (`node autotest.mjs`) reste à `50/50`.

## §6 · Le `CHANGELOG`

Texte de l'entrée, mot pour mot, au-dessus de l'entrée `v0.1`, sous l'en-tête existant :

```
## v0.2 — 2026-10-23

- L'installation et les mises à jour : une aide pour installer l'application sur l'écran d'accueil, quel que soit le navigateur ; un bandeau quand une nouvelle version est prête, et « Vérifier les mises à jour » dans les réglages ; une nouvelle icône, le monogramme « FL » du Carnet de route ; un message clair quand le navigateur bloque l'enregistrement.
```

## §7 · Les arrêts propres au lot

En plus de ceux du prompt du dev :
- Un fichier ou un module de plus que la liste du §4 te paraît nécessaire.
- Une règle du §2-A ou du §2-B ne peut pas être tenue dans Chromium 153 telle qu'écrite (par exemple, la vérification
  de C7-2 ne voit pas la nouvelle version, ou le premier chargement montre le bandeau).
- Un contrôle de `lots/v0.2/controles.json` contredit une règle du §2.
- Une des 61 clés ne trouve pas d'usage par une clé littérale.
- Un sha256 d'icône du §2-20 ne correspond pas au fichier de `lots/v0.2/icones/`.

## §8 · Les preuves

- **Les tests** : les 20 existants, plus au moins 6 dans `tests/pwa.test.js` (C3).
- **Le contrôle d'écran** : les 6 cas de `lots/v0.2/controles.json`, soit 48 rendus et 296 vérifications.
- **Le parcours de bout en bout** (C7), sa sortie au rapport.
- **Aucune image à montrer, aucune capture à ouvrir.** Le CdP regarde lui-même les captures et publie un aperçu pour
  Benoit.

## §9 · La livraison

- Le commit de livraison (« Lot v0.2 — livraison »), puis `lots/v0.2/RAPPORT_DEV.md` dans un commit à part (« Lot v0.2
  — rapport »), poussés sur `lot/v0.2`.
- Le livrable : `git archive` du commit de livraison, que GitHub Pages servira après la fusion.
