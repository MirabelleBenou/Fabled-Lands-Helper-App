# CADRAGE — Le socle et l'accueil · `v0.1`
### 23 octobre 2026 · CdP-1 · branche `lot/v0.1` de `MirabelleBenou/Fabled-Lands-Helper-App` · base `b953750`

**Dev : Sonnet · High · session neuve**

---

## §0 · Les pièces

- **La base** : `main` au `b953750ebfa1839b64a693a94bb0a677a2c9d464`. Si la tête de `main` n'est pas ce commit : arrêt.
- **Sur cette branche** : ce cadrage ; `lots/v0.1/controles.json` (les contrôles d'écran du lot) ;
  `lots/v0.1/etats/exemple.json` (une sauvegarde au schéma 1, deux personnages fictifs).
- **À lire avant de construire** : `PROMPT_DEV_FLH.md` (v2), `banc/README.md` — **surtout le § 4, le contrat**, que
  l'application doit respecter entièrement.

## §1 · Ce que fait le lot, et pourquoi

Fabled Lands Helper est un compagnon du livre-jeu *Fabled Lands* (tome 1, édition française) sur une tablette Android :
il remplace les feuilles et le crayon, jamais le livre. Ce premier lot de produit pose **le socle** :
- l'application installable et utilisable **hors ligne** (PWA), servie par GitHub Pages depuis `git archive` de `main` ;
- **le français et l'anglais** ;
- **deux ambiances**, « Jour » et « Chandelle », dans la direction visuelle validée, le « Carnet de route » ;
- **les personnages** : les créer, les voir en liste, les supprimer ;
- **la sauvegarde** au schéma 1, avec l'export et l'import d'un fichier ;
- **la page « Droits et sources »**.

La feuille d'aventure elle-même, les dés et le journal viendront aux lots suivants : la fiche d'un personnage n'affiche
ici que son nom et l'annonce de la feuille.

## §2 · Les décisions et les règles

### A · La technique

1. **Pas de build, aucune dépendance à l'exécution** : HTML, CSS, JavaScript en modules ES ; chaque `.js` est un module.
   **Tous les chemins sont relatifs** (`js/app.js`, jamais `/js/app.js`) : le site est servi sous un sous-chemin
   (`…github.io/Fabled-Lands-Helper-App/`).
2. **Le contrat du banc** (`banc/README.md` § 4) est tenu entièrement : `js/version.js` (`VERSION = "v0.1"`),
   `js/precache.js` (`CACHE_NAME` construit à partir de `VERSION`, `PRECACHE`), `js/sauvegarde.js` (`SCHEMA`, `lire`),
   `i18n/fr.json` et `i18n/en.json`, `?langue=` et `?theme=`, `data-pret="1"`, `window.__FLH__.importer(objet)`,
   `sw.js` à la racine.
3. **Le service worker** est un module (`navigator.serviceWorker.register('sw.js', { type: 'module' })`) qui importe
   `js/precache.js`.
   - À l'installation, il met en cache `PRECACHE` sous `CACHE_NAME`, puis `skipWaiting()`.
   - À l'activation, il supprime les autres caches dont le nom commence par `flh-`, puis `clients.claim()`.
   - Pour une requête, il répond d'abord depuis le cache, sinon depuis le réseau ; **une navigation vers la racine du
     site** (`./`, avec ou sans `?…`) reçoit `index.html` du cache.
4. **`PRECACHE`** nomme exactement les fichiers que le contrat lui fait couvrir (tous sauf `tests/`, les `*.md` et les
   `LICENSE*`) : **21 entrées** avec la liste du §4. Aucune entrée `./`.
5. **Les données vivent dans IndexedDB**, base `flh`, et **seul `js/stockage.js` y touche**.
   - Un magasin `personnages`, de clé `id`.
   - Un magasin `reglages`, qui garde la langue et l'ambiance.
   - Au premier enregistrement d'un personnage, l'application appelle `navigator.storage.persist()`.
6. **`js/sauvegarde.js` et `js/i18n.js` s'importent dans Node sans navigateur** (aucun accès à `window`, `document`,
   `indexedDB` au chargement du module) : ce sont eux que testent `tests/`. Le reste peut supposer un navigateur.
7. **Le texte saisi n'est jamais injecté comme HTML** (pas de `innerHTML` avec une donnée du personnage ou d'un fichier
   importé) : `textContent` ou création d'éléments.
8. **Aucune chaîne affichée en dur** : tout texte de l'interface vient des dictionnaires, par `data-i18n` ou `t('…')`
   avec une clé littérale ; `t('clé', { n: 3 })` remplace `{n}` dans le texte.
9. **Une erreur ne s'écrit jamais en console comme `error`** dans un parcours normal (le banc les compte).

### B · La sauvegarde, schéma 1

10. **Le fichier exporté** est un objet JSON :
    `{"format": "fabled-lands-helper", "schema": 1, "exporte_le": "<date ISO>", "personnages": [ … ]}`.
11. **Un personnage, au schéma 1** :
    `{"id": "<chaîne>", "nom": "<chaîne>", "profession": "<chaîne>", "niveau": <entier>, "section_en_cours":
    {"livre": <entier>, "section": <entier ou null>}, "cree_le": "<date ISO>", "modifie_le": "<date ISO>"}`.
    - Un personnage neuf a pour `id` le résultat de `crypto.randomUUID()`, le `niveau` 1, et la
      `section_en_cours` `{"livre": 1, "section": 1}`.
    - **Les champs que le lot ne connaît pas sont conservés tels quels** à la lecture comme à l'enregistrement : les
      lots suivants ajouteront des champs sans changer de schéma.
12. **`lire(objet)`** :
    - **lève une exception** si `format` n'est pas `"fabled-lands-helper"`, si `schema` n'est pas un entier ≥ 1, si
      `personnages` n'est pas un tableau, ou si un personnage n'a pas un `id` et un `nom` en chaînes non vides ;
    - **lève une exception reconnaissable** (un champ `code: "SCHEMA_RECENT"`) si `schema` > `SCHEMA` ;
    - sinon, rend `{ schema: SCHEMA, personnages: [...] }`, chaque personnage complété des valeurs par défaut
      manquantes : `profession` `""`, `niveau` 1, `section_en_cours` `{"livre": 1, "section": 1}`, `cree_le` et
      `modifie_le` égaux à `exporte_le` (ou à l'époque zéro, en ISO, s'il manque).
13. **L'import** (bouton, et `window.__FLH__.importer`) passe par `lire()`. Chaque personnage lu remplace celui de même
    `id` ou s'ajoute. Après un import par le bouton, un message dit le nombre (`reglages.importe`), ou l'erreur
    (`reglages.import_erreur`, ou `reglages.import_recent` pour `SCHEMA_RECENT`).
14. **L'export** télécharge `fabled-lands-helper-AAAA-MM-JJ.flh.json` (la date du jour, locale), avec tous les
    personnages, JSON indenté de 2 espaces.
15. **`banc/sauvegardes/v0.1-exemple.json`** est ajouté : une copie **à l'octet** de `lots/v0.1/etats/exemple.json`.

### C · Les écrans

*Une seule `<h1>` par écran : le titre de l'écran. Le nom de l'application, dans l'en-tête, n'est pas un titre.*

16. **L'en-tête**, sur tous les écrans, porte :
    - le nom de l'application (`app.nom`) ;
    - une barre de trois onglets dans un élément `<nav>`, chacun marqué `data-test="onglet"` : Personnages (`#/`), Réglages (`#/reglages`),
      Droits et sources (`#/apropos`) ;
    - l'onglet de l'écran courant porte `aria-current="page"`.
17. **L'accueil** `#/` (et toute route inconnue) :
    - le titre `accueil.titre` ;
    - le bouton `accueil.nouveau` (`data-test="nouveau"`), qui mène à `#/nouveau` ;
    - **la liste des personnages**, du plus récemment modifié au plus ancien. Chacun est une carte cliquable
      (`data-test="perso"`) vers `#/perso/<id>`, qui porte :
      - le nom (`data-test="nom"`) ;
      - la ligne `<profession> · <perso.niveau> <niveau>` (sans profession : `<perso.niveau> <niveau>`) ;
      - le lieu (`data-test="lieu"`), écrit exactement `<perso.livre> <livre> · <perso.section> <section>`, par exemple
        « Livre 1 · Section 183 » ou « Book 1 · Section 183 » ;
    - sans personnage, le message `accueil.vide` (`data-test="liste-vide"`) remplace la liste.
18. **Nouveau personnage** `#/nouveau` :
    - le titre `nouveau.titre` ;
    - un champ `input#nom` (libellé `nouveau.nom`, obligatoire) ;
    - un champ `input#profession` (libellé `nouveau.profession`, libre, facultatif) ;
    - le bouton `nouveau.creer` (`data-test="creer"`) et le lien `nouveau.annuler` vers `#/` ;
    - un nom vide (espaces seuls compris) affiche `nouveau.nom_requis` sous le champ et ne crée rien ;
    - créer enregistre le personnage et mène à l'accueil.
19. **La fiche** `#/perso/<id>` :
    - le nom en titre ;
    - la ligne profession · niveau, et le lieu, comme sur la carte ;
    - le texte `fiche.bientot` (`data-test="bientot"`) ;
    - le lien `fiche.retour` vers `#/` ;
    - le bouton `fiche.supprimer` (`data-test="supprimer"`, couleur `--echec`). Un premier toucher change son texte en
      `fiche.confirmer` pendant 5 secondes ; un second toucher dans ce délai supprime le personnage et mène à
      l'accueil ; au-delà, le bouton revient à son texte ;
    - un `id` inconnu affiche `fiche.introuvable` et le lien `fiche.retour`.
20. **Réglages** `#/reglages`, sous le titre `reglages.titre` :
    - **la langue** : `select` `data-test="langue"`, options `langue.fr` et `langue.en` ; enregistrée ; change
      l'interface aussitôt ; par défaut, celle de l'appareil si elle commence par `fr`, sinon l'anglais ;
    - **l'ambiance** : `select` `data-test="ambiance"`, options `reglages.ambiance_auto` (par défaut, suit
      `prefers-color-scheme`), `reglages.ambiance_jour`, `reglages.ambiance_chandelle` ; enregistrée ; appliquée
      aussitôt ;
    - **la sauvegarde** : le titre `reglages.sauvegarde`, le texte `reglages.sauvegarde_aide`, le bouton
      `reglages.exporter` (`data-test="exporter"`), le bouton `reglages.importer` (`data-test="importer"`, qui ouvre le
      choix d'un fichier `.json`), la ligne `reglages.stockage` suivie de `reglages.stockage_oui` ou
      `reglages.stockage_non` (selon `navigator.storage.persisted()`) ;
    - **la version** (`data-test="version"`), écrite exactement `<reglages.version> <VERSION>` : « Version v0.1 ».
21. **Droits et sources** `#/apropos` : le titre `apropos.titre`, puis un bloc `data-test="apropos"` de **cinq**
    paragraphes `<p>`, dans cet ordre : `apropos.outil`, `apropos.oeuvre`, `apropos.sources`, `apropos.polices`,
    `apropos.donnees`. Aucun lien externe (aucune URL dans le code servi).
22. **Langue et thème forcés par l'adresse** (`?langue=`, `?theme=jour|chandelle`) s'appliquent sans être enregistrés,
    et l'emportent sur les réglages.
23. **L'attribut `lang` de `<html>`** suit la langue affichée ; `<html>` porte `data-theme="jour"` ou
    `data-theme="chandelle"` (l'ambiance résolue).

### D · Le visuel — « Carnet de route » (validé par Benoit)

24. **Les couleurs** : des jetons CSS sur `:root`, redéfinis en bloc pour `[data-theme="chandelle"]` ; aucun composant
    ne porte de couleur littérale.

    | jeton | Jour | Chandelle |
    |---|---|---|
    | `--fond` | `#d9cba8` | `#120d09` |
    | `--page` | `#ece0c4` | `#241b13` |
    | `--encre` | `#3a2918` | `#ead9b6` |
    | `--encre-douce` | `#6f5a40` | `#b29d76` |
    | `--filet` | `#5b4329` | `#a88a5c` |
    | `--accent` | `#2f6b5e` | `#e0a944` |
    | `--accent-encre` | `#f3ead6` | `#1c140d` |
    | `--succes` | `#2f6b5e` | `#9fd0bd` |
    | `--echec` | `#8f2f22` | `#ef8f78` |
    | `--halo` | `transparent` | `rgba(224,169,68,.10)` |

    **Aucun texte ne se pose directement sur `--fond`** (contraste insuffisant) : tout le contenu est sur la page.
25. **Les polices**, embarquées, prises dans les paquets npm `@fontsource/im-fell-english-sc` et `@fontsource/alegreya`
    (5.3.0, licence OFL-1.1), sous-ensemble latin :
    - **IM Fell English SC** 400 pour les titres, les onglets et les boutons ;
    - **Alegreya** 400, 400 italique et 700 pour tout le reste ;
    - pile de repli `"Iowan Old Style", Georgia, serif`, `font-display: swap` ;
    - le fichier `LICENSE` de chaque paquet est copié tel quel sous le nom du §4.
26. **L'échelle** (px) :
    - texte 17, interligne 1,45 ; légende 15 ;
    - titre d'écran `clamp(30px, 6vw, 44px)`, avec `text-wrap: balance` ; titre de rubrique 24 ; onglet 18 ;
    - bouton 19, interlettrage `.04em` ;
    - les chiffres en `font-variant-numeric: tabular-nums lining-nums`.
27. **La page** :
    - fond `--page`, largeur maximale 860 px, centrée sur `--fond` ;
    - marge interne `clamp(18px, 4vw, 40px)` ;
    - rayon 3 px, ombre `0 18px 40px -18px rgba(0,0,0,.45)` ;
    - à la chandelle, halo intérieur `0 0 120px var(--halo) inset` ;
    - **les marges latérales du corps sont de 16 px au moins.**
28. **Le cadre à la plume** (les cartes de personnage et le bloc de sauvegarde) :
    - une bordure de 2 px `--filet` portée par un pseudo-élément ;
    - ce pseudo-élément est déformé par un filtre SVG `feTurbulence` (`type="fractalNoise"`, `baseFrequency="0.035"`,
      `numOctaves="2"`, `seed="7"`) suivi de `feDisplacementMap` (`scale="1.5"`) ;
    - **le texte n'est jamais filtré**.
29. **Les onglets** : petites capitales, `--encre-douce` ; l'actif en `--encre`, souligné de 2 px `--accent`.
30. **Les boutons et les champs** :
    - **le bouton principal** : fond `--accent`, texte `--accent-encre`, rayon 3 px ;
    - **le bouton de suppression** : texte et bordure `--echec`, fond transparent ;
    - **les champs et les `select`** : fond `--page`, bordure 1 px `--filet`, rayon 3 px ;
    - **toute cible touchable fait au moins 44 px de haut** ;
    - **le focus** : contour 2 px `--accent`, décalé de 2 px.
31. **Aucune illustration, aucune image** autre que les icônes de l'application ; pas d'émoji.
32. **Les icônes de l'application**, à partir de `icons/icon.svg` (source, servie aussi) :
    - **le dessin** : un dé à six faces vu de face, la face « cinq », en os `#f2e8d2` à points sépia `#3a2918`, coins
      arrondis, légèrement incliné (−8°), sur un fond plein sépia `#3a2918` ;
    - **les tailles** : `icon-192.png` (192 × 192) et `icon-512.png` (512 × 512) ; `icon-maskable-512.png` (512 × 512),
      où le dé tient dans le cercle central de 80 % du côté ;
    - **le rendu** : les PNG se rendent depuis le SVG par le Chromium du banc, dans ton dossier de travail, par un script
      jetable qui n'est pas commité.
33. **Le manifeste** (`manifest.webmanifest`) :
    - `name` « Fabled Lands Helper », `short_name` « FL Helper », `lang` `fr` ;
    - `start_url` `./`, `scope` `./`, `display` `standalone` ;
    - `background_color` `#ece0c4`, `theme_color` `#3a2918` ;
    - les trois PNG (`purpose` `any` pour les deux premiers, `maskable` pour le troisième).

    `index.html` porte `<meta name="theme-color" content="#3a2918">`.

### E · Le déploiement

34. **`.github/workflows/pages.yml`** publie le site sur GitHub Pages **depuis `git archive` du commit poussé**.
    - **Le déclenchement** : un push sur `main`, et `workflow_dispatch`.
    - **Les permissions** : `contents: read`, `pages: write`, `id-token: write` ; concurrence `pages`, sans annulation.
    - **Un seul job** dans l'environnement `github-pages`, dont les étapes sont :
      - `actions/checkout@v4` ;
      - une commande qui crée `_site` et y déballe `git archive HEAD` ;
      - `actions/configure-pages@v5` ;
      - `actions/upload-pages-artifact@v3` sur `_site` ;
      - `actions/deploy-pages@v4`.

    Il ne se teste pas dans le bac à sable : le CdP le constate après la fusion.

### F · Les textes affichés, au caractère près

*46 clés, les mêmes dans les deux dictionnaires ; chacune est utilisée au moins une fois, par une clé littérale.*

| clé | FR | EN |
|---|---|---|
| `app.nom` | Fabled Lands Helper | Fabled Lands Helper |
| `nav.personnages` | Personnages | Characters |
| `nav.reglages` | Réglages | Settings |
| `nav.apropos` | Droits et sources | Rights and sources |
| `accueil.titre` | Mes personnages | My characters |
| `accueil.vide` | Aucun personnage pour l'instant. Créez le premier, puis ouvrez votre livre à la section 1. | No characters yet. Create the first one, then open your book at section 1. |
| `accueil.nouveau` | Nouveau personnage | New character |
| `perso.niveau` | Niveau | Rank |
| `perso.livre` | Livre | Book |
| `perso.section` | Section | Section |
| `nouveau.titre` | Nouveau personnage | New character |
| `nouveau.nom` | Nom | Name |
| `nouveau.profession` | Profession | Profession |
| `nouveau.creer` | Créer | Create |
| `nouveau.annuler` | Annuler | Cancel |
| `nouveau.nom_requis` | Donnez un nom au personnage. | Give the character a name. |
| `fiche.bientot` | La feuille d'aventure arrive dans la prochaine version. | The adventure sheet arrives in the next version. |
| `fiche.supprimer` | Supprimer ce personnage | Delete this character |
| `fiche.confirmer` | Confirmer la suppression | Confirm deletion |
| `fiche.retour` | Retour aux personnages | Back to characters |
| `fiche.introuvable` | Ce personnage n'existe pas sur cet appareil. | This character does not exist on this device. |
| `reglages.titre` | Réglages | Settings |
| `reglages.langue` | Langue | Language |
| `langue.fr` | Français | Français |
| `langue.en` | English | English |
| `reglages.ambiance` | Ambiance | Theme |
| `reglages.ambiance_auto` | Selon l'appareil | Follow the device |
| `reglages.ambiance_jour` | Jour | Day |
| `reglages.ambiance_chandelle` | Chandelle | Candlelight |
| `reglages.sauvegarde` | Sauvegarde | Backup |
| `reglages.sauvegarde_aide` | Vos personnages restent sur cet appareil. Exportez-les de temps en temps : le fichier vous permet de les retrouver sur un autre appareil ou après un nettoyage du navigateur. | Your characters stay on this device. Export them from time to time: the file lets you recover them on another device or after the browser is cleared. |
| `reglages.exporter` | Exporter mes personnages | Export my characters |
| `reglages.importer` | Importer un fichier | Import a file |
| `reglages.importe` | Personnages importés : {n} | Characters imported: {n} |
| `reglages.import_erreur` | Ce fichier n'est pas une sauvegarde lisible de Fabled Lands Helper. | This file is not a readable Fabled Lands Helper backup. |
| `reglages.import_recent` | Cette sauvegarde vient d'une version plus récente de l'application : mettez l'application à jour, puis réessayez. | This backup comes from a newer version of the app: update the app, then try again. |
| `reglages.stockage` | Stockage protégé par le navigateur : | Storage protected by the browser: |
| `reglages.stockage_oui` | oui | yes |
| `reglages.stockage_non` | non — exportez régulièrement vos personnages | no — export your characters regularly |
| `reglages.version` | Version | Version |
| `apropos.titre` | Droits et sources | Rights and sources |
| `apropos.outil` | Fabled Lands Helper est un outil de fan, gratuit et non officiel. Il accompagne le livre papier sans le remplacer : aucun texte de section, aucune carte et aucune illustration des livres n'y figure. | Fabled Lands Helper is a free, unofficial fan tool. It accompanies the printed book without replacing it: it contains no section text, no maps and no illustrations from the books. |
| `apropos.oeuvre` | Fabled Lands est une série de livres-jeux de Dave Morris et Jamie Thomson. L'édition française est publiée par Alkonost. | Fabled Lands is a gamebook series by Dave Morris and Jamie Thomson. The French edition is published by Alkonost. |
| `apropos.sources` | Les libellés de la feuille d'aventure, la liste des codes et celle des cases de section à cocher suivent le livret d'aventure de l'édition française, en téléchargement libre sur le site d'Alkonost. Tous les droits sur ces contenus restent à leurs auteurs et à l'éditeur. | The adventure sheet labels, the list of codewords and the list of tick-box sections follow the adventure booklet of the French edition, freely downloadable from Alkonost's website. All rights to this material remain with its authors and publisher. |
| `apropos.polices` | Polices : IM Fell English SC (Igino Marini) et Alegreya (Huerta Tipográfica), sous licence SIL Open Font License 1.1. | Typefaces: IM Fell English SC (Igino Marini) and Alegreya (Huerta Tipográfica), under the SIL Open Font License 1.1. |
| `apropos.donnees` | Vos personnages restent sur cet appareil : l'application n'envoie rien sur Internet. | Your characters stay on this device: the app sends nothing over the Internet. |

**Le `README.md`** (à la racine, public), mot pour mot :

```markdown
# Fabled Lands Helper

Un compagnon pour jouer aux livres-jeux *Fabled Lands* sur tablette : feuille d'aventure, dés et journal de la partie,
hors ligne. Il accompagne le livre papier et ne le remplace pas.

A companion for playing the *Fabled Lands* gamebooks on a tablet: adventure sheet, dice and game log, offline. It
accompanies the printed book and does not replace it.

Outil de fan, gratuit et non officiel. *Fabled Lands* est une série de Dave Morris et Jamie Thomson ; l'édition
française est publiée par Alkonost. — Free, unofficial fan tool. *Fabled Lands* is a series by Dave Morris and Jamie
Thomson; the French edition is published by Alkonost.
```

## §3 · Ce qui ne bouge pas

- **`banc/`**, sauf l'ajout de `banc/sauvegardes/v0.1-exemple.json` ; **`PROMPT_DEV_FLH.md`**, **`.gitattributes`**,
  **`.gitignore`** : intacts.
- **Le livre** : aucun texte de section, aucune carte, aucune illustration ; les seuls noms du jeu sont ceux des
  textes du §2-F.

## §4 · Les fichiers

**Dans l'archive** (ajoutés, sauf `CHANGELOG.md`) — 27 fichiers en tout :

| fichier | change | ce qui y est |
|---|---|---|
| `index.html` | ajouté | la page, l'en-tête et ses onglets, le conteneur des écrans |
| `manifest.webmanifest` | ajouté | §2-33 |
| `sw.js` | ajouté | §2-3 |
| `css/app.css` | ajouté | §2-D, les `@font-face` |
| `js/app.js` | ajouté | le démarrage, les routes, `data-pret`, `window.__FLH__`, l'enregistrement du service worker |
| `js/version.js` | ajouté | `VERSION` |
| `js/precache.js` | ajouté | `CACHE_NAME`, `PRECACHE` |
| `js/sauvegarde.js` | ajouté | `SCHEMA`, `lire`, la construction du fichier exporté |
| `js/stockage.js` | ajouté | IndexedDB, `persist()` |
| `js/i18n.js` | ajouté | `t`, le chargement des dictionnaires, l'application des `data-i18n` |
| `js/vues.js` | ajouté | les cinq écrans |
| `i18n/fr.json`, `i18n/en.json` | ajoutés | §2-F |
| `icons/icon.svg`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-maskable-512.png` | ajoutés | §2-32 |
| `fonts/im-fell-english-sc-latin-400-normal.woff2` | ajouté | §2-25 |
| `fonts/alegreya-latin-400-normal.woff2`, `fonts/alegreya-latin-400-italic.woff2`, `fonts/alegreya-latin-700-normal.woff2` | ajoutés | §2-25 |
| `fonts/LICENSE-IM-Fell-English-SC.txt`, `fonts/LICENSE-Alegreya.txt` | ajoutés | les licences, telles quelles |
| `tests/sauvegarde.test.js`, `tests/i18n.test.js` | ajoutés | §8 |
| `README.md` | ajouté | §2-F |
| `CHANGELOG.md` | modifié | §6 |

**Hors de l'archive** : `.github/workflows/pages.yml` (ajouté, §2-34) ; `banc/sauvegardes/v0.1-exemple.json` (ajouté,
§2-15) ; `lots/v0.1/RAPPORT_DEV.md` (commit à part). **Rien d'autre.** Un module de plus te paraît nécessaire :
arrête-toi.

## §5 · Les critères et la prédiction

**Le bloc « base »** (rituel sur `git archive` de `b953750`), ligne pour ligne :

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

*Avec les sauvegardes par défaut du banc (`banc/sauvegardes/`) de la base, qui n'en contient aucune.*

**Le rituel sur `mesure/`**, avec les sauvegardes de **ton** banc (qui contient `v0.1-exemple.json`) — `<…>` = un
compte que tu annonces :

```
fichiers: 27
poids: <octets>
caches: 0
syntaxe: 10/10
tests: <n> passed, 0 failed
sauvegardes: lues=1/1 schema=1
i18n: fr=46 en=46 manquantes=0 orphelines=0 inconnues=0
horsligne: externes=0 precache=21 manquants=0 en_trop=0
version: code=v0.1 changelog=v0.1 cache=flh-v0.1 coherente=oui
changelog: a_completer=0
empreinte: <sha256>
```

**Les portes, en deltas** :

| porte | base | attendu | delta |
|---|---|---|---|
| P1 version | aucune | `v0.1`, cohérente | — |
| P2 fichiers | 1 | 27 | +26 |
| P3 syntaxe | 0/0 | 10/10 | +10 |
| P4 tests | aucun | ≥ 8 passés, 0 échec | ≥ +8 |
| P5 traductions | absente | 46 = 46, 0 manquante, 0 orpheline, 0 inconnue | +46 |
| P6 hors ligne | — | 0 externe, `PRECACHE` = 21, 0 manquant, 0 en trop | — |
| P7 écran | — | `ecran: rendus=48 verifs=192/192 console=0 externes=0 debords=0 horsligne_reel=ok` | — |
| P8 sauvegarde | — | `lues=1/1 schema=1` | — |
| P10 écart | — | `ecart: ajoutes=26 modifies=1 retires=0`, la liste exacte du §4 | — |
| P12 hors du code | — | seuls `.github/workflows/pages.yml`, `banc/sauvegardes/v0.1-exemple.json` et `lots/v0.1/RAPPORT_DEV.md` | — |

**Les critères du lot** :

- **C1** — Les deux blocs ci-dessus, à l'octet, aux comptes annoncés près (`poids`, `tests`, `empreinte`).
- **C2** — `node banc/ecran.mjs mesure lots/v0.1/controles.json` (lancé depuis la copie du banc, chemins ajustés) finit
  sur la ligne de P7 exactement.
- **C3** — Les tests couvrent au moins :
  - pour `lire()` : un fichier valide ; un mauvais `format` ; un `schema` supérieur à `SCHEMA` (avec le code
    `SCHEMA_RECENT`) ; un personnage sans `nom` ; les valeurs par défaut complétées ; un champ inconnu conservé ;
  - pour `t()` : une clé simple et le remplacement de `{n}`.
- **C4** — `banc/sauvegardes/v0.1-exemple.json` a le même sha256 que `lots/v0.1/etats/exemple.json`.
- **C5** — Aucune chaîne de l'interface hors des dictionnaires (la ligne `i18n` du rituel, et la relecture du diff par
  le CdP) ; aucun `innerHTML` alimenté par une donnée saisie ou importée.
- **C6** — Le rituel et le contrôle d'écran, passés deux fois, donnent les mêmes lignes à l'octet (hors captures).
- **C7** — L'auto-essai du banc (`node autotest.mjs`) reste à `n/n` après l'ajout de la sauvegarde de référence.

## §6 · Le `CHANGELOG`

Texte de l'entrée, mot pour mot, au-dessus de tout, sous l'en-tête existant :

```
## v0.1 — 2026-10-23

- Le socle de Fabled Lands Helper : application installable et utilisable hors ligne, en français et en anglais, avec les ambiances Jour et Chandelle ; création, liste et suppression des personnages ; export et import d'un fichier de sauvegarde ; page « Droits et sources ».
```

## §7 · Les arrêts propres au lot

En plus de ceux du prompt du dev :
- Un fichier ou un module de plus que la liste du §4 te paraît nécessaire.
- Le contrat du banc ne peut pas être tenu tel qu'écrit (le service worker en module, `PRECACHE` à 21 entrées, une clé
  de traduction impossible à utiliser littéralement).
- Une des 46 clés ne trouve pas d'usage dans les écrans décrits (elle serait orpheline).
- Un contrôle de `lots/v0.1/controles.json` contredit une règle du §2.
- Les paquets `@fontsource` ne donnent pas les fichiers nommés au §4.

## §8 · Les preuves

- **Les tests** : au moins 8, sur `lire()` et `t()` (C3). Annonce leur nombre.
- **Le contrôle d'écran** : les 6 cas de `lots/v0.1/controles.json`, soit 48 rendus.
- **Aucune image à montrer, aucune capture à ouvrir.** Le CdP regarde lui-même les captures et publie un aperçu pour
  Benoit.

## §9 · La livraison

- Le commit de livraison (« Lot v0.1 — livraison »), puis `lots/v0.1/RAPPORT_DEV.md` dans un commit à part (« Lot v0.1
  — rapport »), poussés sur `lot/v0.1`.
- Le livrable : `git archive` du commit de livraison, que GitHub Pages servira après la fusion.
