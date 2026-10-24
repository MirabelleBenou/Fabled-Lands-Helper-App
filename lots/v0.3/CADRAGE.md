# CADRAGE — La feuille d'aventure · `v0.3`
### 24 octobre 2026 · CdP-3 · branche `lot/v0.3` de `MirabelleBenou/Fabled-Lands-Helper-App` · base `ec237af`

**Dev : Opus · High · session neuve** (migration du format de sauvegarde, plusieurs écrans, règles de calcul)

---

## §0 · Les pièces

- **La base** : `main` au `ec237aff40c75e0cec9a73ec4c1c03772be6d426` (la `v0.2` publiée). Si la tête de `main` n'est pas
  ce commit : arrêt.
- **Sur cette branche**, à côté de ce cadrage :

  | pièce | rôle | sha256 |
  |---|---|---|
  | `lots/v0.3/app.css` | **la feuille de style du lot, à reprendre telle quelle** comme `css/app.css` (§2-J) | `b39a5065660dbec4acc248f8b37c37c4c31e41f436aab176bd8994c5f5dd1356` |
  | `lots/v0.3/etats/feuille.json` | sauvegarde au schéma 2 : trois personnages (deux pré-tirés en cours de partie, un personnage libre aux 12 possessions) ; **à copier telle quelle** en `banc/sauvegardes/v0.3-exemple.json` (§2-K) | `650acb664bd998ef1190e2568be4c5da86214efdedeeaf52d49bba78b7f272d5` |
  | `lots/v0.3/etats/ancien.json` | la sauvegarde de référence du schéma 1 (copie de `banc/sauvegardes/v0.1-exemple.json`) | `7025fb9c718fd5ed6aee49d578813ea62a0a9a304eda7749efec5728da7de530` |
  | `lots/v0.3/controles.json` | les contrôles d'écran du lot (12 cas) | `b864a7ec32a46ad7ac5a55c103299e6104829556d8824ee2ad0bac807e6898d0` |

- **La maquette** de ces écrans a été rendue par le CdP sur le banc et **validée par Benoit** : ce cadrage en reprend
  la structure, les classes, la feuille de style et les textes. Tu ne montres aucune image ; le CdP compare lui-même tes
  rendus aux siens à la réception.
- **À lire avant de construire** : `PROMPT_DEV_FLH.md` (v2), `banc/README.md` — **surtout le § 4, le contrat**.

## §1 · Ce que fait le lot, et pourquoi

La fiche d'un personnage n'affiche aujourd'hui que son nom et « La feuille d'aventure arrive dans une prochaine
version ». Ce lot pose **la feuille d'aventure du tome 1**, celle du livret de l'édition française, pour jouer sans
papier :

- **la création** de deux manières : à partir d'un des **9 personnages pré-tirés** que l'éditeur publie pour les livres
  1 et 2 (chiffres et possessions de départ, avec un lien vers la fiche de l'éditeur), ou **par saisie libre** des
  valeurs du livre ;
- **la feuille**, en trois rubriques :
  - **Statistiques** : l'Endurance au compteur ; le Niveau et l'Endurance maximale ; les six compétences, chacune avec
    sa base et ses bonus et malus, chacun avec sa raison ; la Défense calculée ; les titres et honneurs ; un champ
    « Histoire » libre ;
  - **Possessions** : la Bourse, en chardes ; les 12 possessions transportées ;
  - **Cultes** : bénédictions ; malédictions, maladies et sortilèges ; résurrection ;
- **le format de sauvegarde passe au schéma 2**, avec la migration depuis le schéma 1 : un personnage existant garde
  tout et reçoit une feuille aux valeurs neutres ;
- **le banc** apprend qu'un lien que l'utilisateur ouvre n'est pas une requête externe (§2-K) ;
- **une dette** : le `README` des sauvegardes de référence (§2-K).

Les bonus se saisissent **à la main**, avec leur raison, comme sur le livret papier : un objet ne porte pas encore son
bonus (ce sera un lot ultérieur).

## §2 · Les décisions et les règles

### A · Le format de sauvegarde, schéma 2

1. **`SCHEMA = 2`.** `lire()` accepte les schémas 1 et 2 et rend toujours les données au schéma 2 ; un schéma 3 ou plus
   lève `SCHEMA_RECENT`, comme aujourd'hui. `construireExport()` écrit `schema: 2`. Le reste du contrat de `lire()` ne
   change pas (format, refus d'un personnage sans `id` ou sans `nom`, complétion de `profession`, `niveau`,
   `section_en_cours`, `cree_le`, `modifie_le`, **champs inconnus conservés**, copie qui ne partage rien).
2. **Les champs du schéma 2**, en plus de ceux du schéma 1, et **la valeur neutre** que reçoit un champ absent ou
   invalide (c'est aussi la migration du schéma 1) :

   | champ | forme | absent ou invalide |
   |---|---|---|
   | `endurance` | `{ max, actuelle }`, entiers, `0 ≤ actuelle ≤ max` | `max` : 0 si ce n'est pas un entier ≥ 0 ; `actuelle` : ramenée dans `[0, max]`, 0 si ce n'est pas un entier |
   | `competences` | objet aux six clés `charisme`, `combat`, `magie`, `piete`, `exploration`, `adresse` ; chacune `{ initiale, actuelle, bonus }` | chaque clé absente ou invalide : `{ initiale: 0, actuelle: 0, bonus: [] }` ; `initiale` et `actuelle` : 0 si ce n'est pas un entier ≥ 0 ; une clé inconnue est conservée |
   | `…bonus` (d'une compétence, et de `defense`) | tableau de `{ valeur, raison }` : `valeur` entier non nul, `raison` chaîne non vide | `[]` si ce n'est pas un tableau ; une entrée invalide est retirée |
   | `defense` | `{ bonus }` | `{ bonus: [] }` |
   | `bourse` | entier ≥ 0 | 0 |
   | `possessions` | tableau de chaînes non vides | `[]` ; une entrée invalide est retirée ; **plus de 12 entrées sont conservées** |
   | `titres` | tableau de chaînes non vides | `[]` ; une entrée invalide est retirée |
   | `benedictions`, `maledictions` | tableau de `{ origine, consequences }` (chaînes) | `[]` ; une entrée qui n'est pas un objet est retirée ; un champ qui n'est pas une chaîne devient `""` |
   | `resurrections` | tableau de `{ origine, lieu, livre, section }` : chaînes, puis entiers ou `null` | `[]` ; une entrée qui n'est pas un objet est retirée ; `origine`, `lieu` : `""` si ce n'est pas une chaîne ; `livre`, `section` : `null` si ce n'est pas un entier |
   | `histoire` | chaîne | `""` |
   | `pretire` | identifiant d'un pré-tiré (chaîne non vide), ou `null` | `null` |

3. **Un personnage lu du stockage** (`lirePersonnage`, `tousLesPersonnages` de `js/stockage.js`) passe par **la même
   complétion** que l'import : un personnage enregistré par la `v0.2` (schéma 1) s'ouvre en schéma 2 sans être réécrit.
   Une fiche stockée que la complétion refuse (sans `id` ni `nom`) est ignorée par la liste et vaut « introuvable » pour
   la fiche. **La complétion vit dans `js/sauvegarde.js`**, exportée, et sert aux deux.
4. **`personnageNeuf(nom, profession, maintenant, id)`** garde sa signature et rend un personnage complet du schéma 2,
   aux valeurs neutres.
5. **Les tests existants** de `tests/sauvegarde.test.js` qui écrivent en dur le schéma 1 ou la forme d'un personnage du
   schéma 1 s'adaptent au schéma 2 ; **aucun test n'est retiré**.

### B · Les règles de calcul — `js/regles.js`

6. **Un module neuf, pur**, importable dans Node sans navigateur. Il exporte au moins :
   - `COMPETENCES` = `['charisme', 'combat', 'magie', 'piete', 'exploration', 'adresse']` (l'ordre d'affichage) ;
   - `MAX_POSSESSIONS` = 12 ;
   - `totalCompetence(personnage, code)` = `actuelle` + la somme des `valeur` de ses bonus ;
   - `defense(personnage)` = `niveau` + `competences.combat.actuelle` + la somme des bonus de `defense` — **les bonus de
     Combat n'y entrent pas** ;
   - `signe(n)` : `"+n"` si n > 0, `"−n"` si n < 0 (le signe moins U+2212), `"0"` sinon.
7. **Les bornes**, tenues par le code de l'écran et couvertes par les tests (par des fonctions de `js/regles.js` que tu
   nommes) :
   - l'Endurance actuelle reste dans `[0, max]` : « + » au maximum et « − » à 0 ne font rien ;
   - l'Endurance maximale reste ≥ 0 ; la baisser sous l'actuelle ramène l'actuelle au maximum ;
   - le Niveau reste ≥ 1 ; la base actuelle d'une compétence reste ≥ 0 ; **l'initiale ne change jamais** après la
     création ;
   - un bonus ne s'ajoute que si sa valeur est un entier non nul et sa raison non vide (espaces de bord retirés) ;
     sinon rien ne s'ajoute, aucun message, les champs gardent leur contenu ;
   - la Bourse reste ≥ 0 ; « Gagner » et « Dépenser » prennent un montant entier ≥ 1, sinon rien ; **dépenser plus que
     la Bourse est refusé** : la Bourse ne change pas et le message `feuille.bourse_insuffisante` (`{n}` = la Bourse)
     s'affiche ; une opération réussie vide le montant et le message ;
   - une possession ne s'ajoute que si son texte est non vide (bords retirés) et qu'il y en a moins de 12 ; les doublons
     sont permis ; l'ordre est celui de l'ajout ;
   - un titre ne s'ajoute que si son texte est non vide.
8. **Un total peut être négatif** : il s'affiche avec le signe moins U+2212.

### C · Les pré-tirés — `js/pretires.js`, `js/liens.js`

9. **`js/pretires.js`** exporte `PRETIRES`, les 9 personnages, **dans cet ordre**, et une fonction pure qui fabrique le
   personnage du schéma 2 à partir d'un pré-tiré et d'un nom (sur la base de `personnageNeuf`). Chaque pré-tiré a :
   Endurance 9 (maximale et actuelle), Bourse 16, l'initiale et l'actuelle de chaque compétence égales à la valeur du
   tableau, les possessions et les bonus du tableau, et `pretire` = son identifiant.

   | id | nom | profession | niv. | cha | com | mag | pié | exp | adr | possessions | exclusif | Défense publiée |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|
   | `liana` | Liana la Vive | Voyageuse | 1 | 2 | 5 | 2 | 3 | 6 | 4 | Lance · Gilet en cuir | non | 7 |
   | `andriel` | Andriel le Marteau | Guerrier | 1 | 3 | 6 | 2 | 4 | 3 | 2 | Hache de guerre · Gilet en cuir | non | 8 |
   | `chalor` | Chalor l'Exilé | Mage | 1 | 2 | 2 | 6 | 1 | 5 | 3 | Bâton · Gilet en cuir | non | 4 |
   | `marana` | Marana Cœur de Feu | Voleuse | 1 | 5 | 4 | 4 | 1 | 2 | 6 | Épée · Gilet en cuir | non | 6 |
   | `ignace` | Ignace le Dévot | Prêtre | 1 | 4 | 2 | 3 | 6 | 4 | 2 | Gourdin · Gilet en cuir | non | 4 |
   | `astariel` | Astariel Chanteciel | Troubadour | 1 | 6 | 3 | 4 | 3 | 2 | 4 | Épée · Gilet en cuir | non | 5 |
   | `rordon` | Rordon Boisvert | Prêtre | 1 | 4 | 2 | 3 | 6 | 4 | 2 | Gourdin · Gilet en cuir | oui | 4 |
   | `madrigua` | Madrigua aux mille histoires | Voyageuse | 1 | 2 | 5 | 2 | 3 | 6 | 4 | Dague · Gilet en cuir | oui | 7 |
   | `tjell` | Tjell Lao-Me | Troubadour / Danseuse | 2 | 6 | 4 | 4 | 1 | 2 | 5 | Bâton de combat · Boussole · Gilet en cuir | oui | 6 |

   **Les bonus** : chaque pré-tiré a un bonus de Défense `+1`, raison `Gilet en cuir`. **Tjell** a en plus un bonus
   d'Exploration `+1`, raison `Boussole`, et un second bonus de Défense `−1`, raison `Fiche de l'éditeur` (sa fiche
   publiée dit 6 ; la formule donnerait 7 ; Benoit a choisi de suivre la fiche, l'écart restant visible). Les bonus de
   Défense sont dans l'ordre `Gilet en cuir` puis `Fiche de l'éditeur`.

   Les noms, professions, possessions et raisons sont **des données en français**, comme ce que saisit l'utilisateur :
   ils ne passent pas par les dictionnaires. L'apostrophe de `Chalor l'Exilé` et de `Fiche de l'éditeur` est
   l'apostrophe droite U+0027, comme dans tous les textes de l'application.
10. **`js/liens.js`** exporte `LIENS`, un objet nom → adresse, avec une seule entrée :
    `pretires` = `https://alkonost-editions.com/collections/livres-jeux/fabled-lands/personnages-pretires/livres-1-2/`.
    C'est **le seul endroit** du code servi où une adresse `http(s)://` apparaît. Les liens qui y mènent ont
    `target="_blank"` et `rel="noopener"` ; **l'application ne demande jamais ces adresses** (ni `fetch`, ni image, ni
    préchargement) : seul le toucher de l'utilisateur les ouvre.

### D · La création — `#/nouveau`

11. **Les routes** : `#/nouveau` et `#/nouveau/pretire` montrent le mode pré-tiré sans choix ; `#/nouveau/pretire/<id>`,
    le pré-tiré `<id>` choisi (un identifiant inconnu : aucun choix) ; `#/nouveau/libre`, la saisie libre.
12. **L'écran**, dans cet ordre :
    - `<h1>` `nouveau.titre` ;
    - `nav.sous-onglets` (`aria-label` = `nouveau.mode`) : deux liens, `a[data-test=mode-pretire]` vers
      `#/nouveau/pretire` (`nouveau.mode_pretire`) et `a[data-test=mode-libre]` vers `#/nouveau/libre`
      (`nouveau.mode_libre`) ; le mode affiché porte `aria-current="page"`.
13. **Le mode pré-tiré** :
    - `p.legende.source-pretires` (`pretire.source`), puis `a.lien[data-test=lien-pretires]` (`pretire.lire_toutes`)
      vers `LIENS.pretires` ;
    - `ul.pretires` : un `li` par pré-tiré, dans l'ordre du tableau, qui porte `a.pretire.cadre[data-test=pretire]` vers
      `#/nouveau/pretire/<id>` ; le pré-tiré choisi porte `aria-current="true"` (les autres n'ont pas l'attribut). Le lien
      contient, dans cet ordre :
      - `span.nom` (le nom) ;
      - `span.ligne` : `<profession> · <perso.niveau> <niveau>` ;
      - `span.mini` : six `span`, dans l'ordre de `COMPETENCES`, chacun `<abbr title="<comp.…>">` (le texte de
        `abr.…`) suivi d'une espace et de la valeur ;
      - pour un pré-tiré exclusif : `span.puce` (`pretire.exclusif`).
    - **Un pré-tiré choisi** : le formulaire (`novalidate`) suit la liste, avec `div.champ` (`label[for=nom]`
      `nouveau.nom`, `input#nom` de type texte **prérempli du nom du pré-tiré**, `p.erreur[role=alert]`), puis
      `div.actions` (`button.bouton[type=submit][data-test=creer]` `nouveau.creer`, `a.lien` vers `#/` `nouveau.annuler`).
      **Sans choix, ni formulaire ni bouton « Créer ».**
14. **Le mode saisie libre** : le formulaire (`novalidate`) porte, dans cet ordre :
    - `div.champ` du nom (comme ci-dessus, vide) ; `div.champ` de la profession (`label[for=profession]`
      `nouveau.profession`, `input#profession` texte) ;
    - `div.grille-nombres` : trois `div.champ` — `#niveau` (`perso.niveau`, valeur 1, `min` 1), `#endurance`
      (`feuille.endurance_max`, valeur 0), `#bourse` (`feuille.bourse`, valeur 0) ;
    - `h2.rubrique` `feuille.competences` ; `div.grille-nombres` : six `div.champ`, `#c-charisme` … `#c-adresse`
      (libellés `comp.…`, valeur 0) ;
    - `p.legende` `nouveau.libre_aide` ; `div.actions` comme ci-dessus.

    Les neuf champs de nombre sont `input[type=number][inputmode=numeric]` (`min` 0, sauf le Niveau). À la création,
    une valeur vide, négative ou non entière vaut 0 (le Niveau : au moins 1) ; l'Endurance actuelle égale la maximale ;
    l'initiale et l'actuelle de chaque compétence égalent la valeur saisie ; aucun bonus.
15. **« Créer »** : un nom vide (bords retirés) → `nouveau.nom_requis` dans `p.erreur`, `aria-invalid="true"`, le focus
    sur le champ ; un enregistrement qui échoue → `stockage.bloque` dans `p.erreur`. Sinon le personnage s'enregistre
    et l'application va **sur sa fiche**, `#/perso/<id>`.

### E · La fiche — `#/perso/<id>`

16. **Les routes** : `#/perso/<id>` = `#/perso/<id>/statistiques` ; `#/perso/<id>/possessions` ;
    `#/perso/<id>/cultes` ; une rubrique inconnue montre Statistiques. Statistiques prend un quatrième segment, **ce qui
    est déplié** : un code de `COMPETENCES`, `defense` ou `endurance` (`#/perso/<id>/statistiques/combat`) ; une valeur
    inconnue ne déplie rien. Un personnage introuvable : `<h1>` `fiche.introuvable` et le lien `fiche.retour`, comme
    aujourd'hui.
17. **Le défilement** : un changement de route remet la page en haut **seulement si la page change** — le personnage
    ou la rubrique de la fiche, le mode de la création, ou un autre écran. Déplier, replier ou choisir un pré-tiré garde
    la position.
18. **L'en-tête de la fiche**, dans cet ordre :
    - `h1[data-test=nom]` (le nom) ;
    - `p.ligne` : `<profession> · <perso.niveau> <niveau>` (sans profession : `<perso.niveau> <niveau>`), puis, pour un
      pré-tiré, ` · ` et `a.lien[data-test=fiche-alkonost]` (`pretire.lire_fiche`) vers `LIENS.pretires` ;
    - `nav.sous-onglets` (`aria-label` = `feuille.rubriques`) : trois `a[data-test=sous-onglet]` vers
      `#/perso/<id>/statistiques`, `…/possessions`, `…/cultes` (`feuille.statistiques`, `feuille.possessions`,
      `feuille.cultes`) ; la rubrique affichée porte `aria-current="page"`.
19. **Chaque changement s'enregistre aussitôt** (le personnage entier, `modifie_le` = maintenant), puis l'écran se rend à
    nouveau depuis le personnage enregistré. **Après un toucher, le focus revient** à l'élément qui porte le même
    `data-test` s'il existe encore. **Un enregistrement qui échoue** laisse le personnage tel qu'il était et affiche
    `p.erreur[data-test=erreur-ecriture]` (`stockage.bloque`) juste sous les sous-onglets.

### F · Statistiques

20. **L'Endurance** : `section.cadre.endurance[data-test=endurance]` porte, dans cet ordre :
    - `h2.petit-titre` `feuille.endurance` ;
    - `div.compteur` : `button.rond[data-test=endurance-moins]` (texte `−` U+2212, `aria-label` =
      `feuille.endurance_moins`), puis `span.gros` dont le texte est l'actuelle suivie de `span.sur` (` / <max>`), puis
      `button.rond[data-test=endurance-plus]` (`+`, `feuille.endurance_plus`) — le texte de `span.gros` se lit donc
      `6 / 9` ;
    - `div.jauge` contenant un `span` de largeur `actuelle / max` en pour cent, arrondie à l'entier (0 si `max` = 0) ;
    - `p.legende` : `<feuille.endurance_max> <max> · <perso.niveau> <niveau> · ` puis `a.lien` (`feuille.modifier`) vers
      `…/statistiques/endurance` (vers `…/statistiques` quand c'est déplié).
21. **Déplié `endurance`** : juste après, `section.cadre.editeur-stats[data-test=editeur-endurance]` porte deux
    `div.groupe-edition` — `h2.petit-titre` `feuille.endurance_max` et son compteur (`span.gros` = le maximum ;
    `data-test` `endurance-max-moins` / `endurance-max-plus` ; `feuille.max_moins` / `feuille.max_plus`), puis
    `h2.petit-titre` `perso.niveau` et son compteur (`span.gros` = le niveau ; `niveau-moins` / `niveau-plus` ;
    `feuille.niveau_moins` / `feuille.niveau_plus`) — et enfin `a.lien` (`feuille.fermer`) vers `…/statistiques`.
22. **Les compétences** : `h2.rubrique` `feuille.competences`, puis `ul.stats` : six `li.ligne-stat[data-test=ligne-<code>]`
    dans l'ordre de `COMPETENCES`, puis `li.ligne-stat[data-test=ligne-defense]`. La ligne dépliée porte en plus la classe
    `ouverte`. Chaque ligne porte :
    - `a.entete-stat` vers la route qui la déplie (vers `…/statistiques` quand elle l'est déjà), `aria-expanded` =
      `"true"` / `"false"`, qui contient :
      - `span.nom-stat` : `comp.<code>` ou `feuille.defense` ;
      - `span.detail-stat` : `span.formule` — `feuille.base` (`{n}` = la base actuelle) pour une compétence,
        `feuille.formule_defense` (`{niveau}`, `{combat}` = la base actuelle de Combat) pour la Défense — puis un
        `span.puce` par bonus, dans l'ordre, au texte `<signe(valeur)> <raison>`, avec la classe `malus` si la valeur est
        négative ;
      - `span.total[data-test=total-<code>]` (ou `[data-test=defense]`) : le total.
    - **Dépliée** : après le lien, `div.editeur[data-test=editeur]` :
      - pour une compétence seulement, `div.base-edition` : `span.petit-titre` `feuille.base_actuelle`, son compteur
        (`span.moyen` = la base actuelle ; `base-moins` / `base-plus` ; `feuille.base_moins` / `feuille.base_plus`),
        `span.legende` `feuille.base_initiale` (`{n}` = l'initiale) ;
      - `p.petit-titre` `feuille.bonus_malus` ;
      - sans bonus, `p.legende` `feuille.bonus_vide` ; sinon `ul.bonus-liste`, un `li` par bonus : `span.valeur` (le
        signe, classe `malus` si négatif), `span.raison`, `button.lien` `feuille.retirer` (`aria-label` =
        `feuille.retirer_nom`, `{nom}` = la raison) ;
      - `div.ajout-bonus` : `input[type=number][inputmode=numeric][data-test=bonus-valeur]` (valeur `0`, `aria-label` =
        `feuille.valeur`), `input[type=text][data-test=bonus-raison]` (`placeholder` et `aria-label` = `feuille.raison`),
        `button.bouton[data-test=bonus-ajouter]` `feuille.ajouter`.
23. **Titres et honneurs** : `section.bloc[data-test=titres]` : `h2.rubrique` `feuille.titres` ; sans titre, `p.legende`
    `feuille.titres_vide`, sinon `ul.puces`, un `li.puce` par titre : le texte, puis `button.retirer` (texte `×` U+00D7,
    `aria-label` = `feuille.retirer_nom`) ; puis `div.ajout` : `input[type=text][data-test=titre-champ]` (`placeholder`
    et `aria-label` = `feuille.titre_ajouter`), `button.bouton[data-test=titre-ajouter]` `feuille.ajouter`. La touche
    Entrée dans le champ ajoute aussi.
24. **Histoire** : `section.bloc` : `h2.rubrique` contenant `label[for=histoire]` `feuille.histoire` ; `p.legende`
    `feuille.histoire_aide` ; `textarea#histoire[data-test=histoire][rows=4]`. Le texte s'enregistre à l'événement
    `change` (sans rendre l'écran à nouveau).
25. **Le pied** : `div.actions.pied-fiche` : `a.lien` vers `#/` (`fiche.retour`) et
    `button.bouton.bouton-danger[data-test=supprimer]` (`fiche.supprimer`), **la suppression en deux touchers comme
    aujourd'hui** (`fiche.confirmer`, retour à l'état initial après 5 s).

### G · Possessions

26. **La Bourse** : `section.cadre.bourse[data-test=bourse]` : `h2.petit-titre` `feuille.bourse` ; son compteur
    (`span.gros` = la Bourse suivie de `span.sur` (` <feuille.chardes>`), qui se lit `41 chardes` ; `bourse-moins` /
    `bourse-plus` ; `feuille.bourse_moins` / `feuille.bourse_plus`) ; `div.ajout` :
    `input[type=number][inputmode=numeric][min=1][data-test=montant]` (`placeholder` et `aria-label` =
    `feuille.montant`), `button.bouton[data-test=gagner]` `feuille.gagner`,
    `button.bouton.bouton-second[data-test=depenser]` `feuille.depenser` ; puis
    `p.message.echec[data-test=bourse-message][role=status]`, vide sauf refus (§2-7).
27. **Les possessions transportées** : `h2.rubrique` : le texte `feuille.transportees` suivi de
    `span.compte[data-test=compte-possessions]` (` <n> / 12`) ; sans possession, `p.legende` `feuille.possessions_vide`,
    sinon `ol.possessions[data-test=possessions]`, un `li` par possession : `span.objet` (le texte), `button.lien`
    `feuille.retirer` (`aria-label` = `feuille.retirer_nom`) ; puis `div.ajout` :
    `input[type=text][data-test=possession-champ]` (`placeholder` et `aria-label` = `feuille.possession_ajouter`),
    `button.bouton[data-test=possession-ajouter]` `feuille.ajouter` (Entrée ajoute aussi). **À 12 possessions ou plus**,
    le champ et le bouton sont `disabled` et `p.legende[data-test=plein]` (`feuille.possessions_plein`) suit.

### H · Cultes

28. **Trois sections** `section.bloc`, dans cet ordre, `data-test` = `benedictions`, `maledictions`, `resurrections`.
    Chacune : `h2.rubrique` (`feuille.benedictions`, `feuille.maledictions`, `feuille.resurrections`) ; sans entrée,
    `p.legende` (`feuille.benedictions_vide`, `feuille.maledictions_vide`, `feuille.resurrections_vide`), sinon
    `ul.entrees`, un `li.cadre.entree` par entrée :
    - `p.nom` : l'origine, ou `—` (U+2014) si elle est vide ;
    - pour chaque autre champ non vide, dans l'ordre du formulaire, un `p` : `span.legende` (`feuille.etiquette`,
      `{libelle}` = le libellé du champ), une espace, puis la valeur ;
    - `button.lien` `feuille.retirer` (`aria-label` = `feuille.retirer_nom`, `{nom}` = l'origine, ou `—`).

    Puis `details.ajout-entree` : `summary.lien` `feuille.ajouter`, et `div.champs-entree` : les champs
    (`input[type=text]`, `placeholder` et `aria-label` = leur libellé), puis `button.bouton` `feuille.ajouter`.
    - bénédictions et malédictions : `origine` (`feuille.origine`), `consequences` (`feuille.consequences`) ;
    - résurrection : `origine` (`feuille.origine`), `lieu` (`feuille.lieu`), `livre` (`perso.livre`) et `section`
      (`perso.section`), ces deux-là en `input[type=number][inputmode=numeric][min=1]`.

    Une entrée ne s'ajoute que si au moins un champ est rempli ; un livre ou une section vide ou non entier vaut `null`.
29. **Droits et sources** : un sixième paragraphe, `apropos.pretires`, après `apropos.sources`.

### J · La feuille de style

30. **`css/app.css` devient `lots/v0.3/app.css`, à l'octet** (sha256 du §0) : la feuille de la `v0.2` inchangée, suivie
    du bloc « Lot v0.3 ». **Aucune autre règle CSS, aucun attribut `style`**, sauf la largeur du `span` de la jauge
    (§2-20). Les classes de ce cadrage sont celles de cette feuille ; une classe dont tu as besoin et qu'elle n'a pas :
    arrêt.

### K · Le banc

31. **Les liens déclarés** : dans la ligne `horsligne` du rituel, une occurrence de `http(s)://` **située dans
    `js/liens.js`** et qui commence une des valeurs (chaînes) de son export `LIENS` **ne compte pas** dans `externes`.
    Toute autre occurrence compte, y compris la même adresse dans un autre fichier. Sans `js/liens.js`, rien ne change.
    Le format des onze lignes ne change pas. Le rituel lit `LIENS` comme il lit `PRECACHE` et `VERSION`.
32. **Le contrat** (`banc/README.md`) : la définition de `horsligne` au § 3 et un point de plus au § 4 — « `js/liens.js`
    exporte `LIENS`, un objet nom → adresse `https://…` : les adresses que l'utilisateur ouvre d'un toucher, jamais
    demandées par l'application ; le rituel ne les compte pas, le contrôle d'écran vérifie qu'aucune n'est demandée ».
33. **L'auto-essai** gagne deux défauts plantés : une adresse ajoutée à `LIENS` dans un `js/liens.js` planté → `externes`
    reste à 0 et les autres lignes ne bougent pas ; la même adresse écrite dans un autre fichier → `externes` monte de 1,
    et lui seul. Il finit sur `autotest: n/n` ; annonce `n`.
34. **Les sauvegardes de référence** : `banc/sauvegardes/v0.3-exemple.json` = `lots/v0.3/etats/feuille.json` à l'octet ;
    `banc/sauvegardes/README.md` devient, mot pour mot (une ligne, suivie d'un saut de ligne) :

    ```
    Sauvegardes de référence : des fichiers *.json relus par lire() à chaque rituel. v0.1-exemple.json est au schéma 1, v0.3-exemple.json au schéma 2. Ne jamais y mettre de sauvegarde réelle.
    ```

### L · La technique, rappels

35. Les règles de la `v0.1` et de la `v0.2` tiennent : modules ES, chemins relatifs, aucune dépendance, contrat du banc,
    **aucune chaîne de l'interface en dur**, **aucune clé de traduction construite** (`t('comp.' + code)` est interdit :
    chaque clé s'écrit en entier, par exemple dans une table code → fonction), aucun `innerHTML` alimenté par une donnée,
    **aucune erreur en console** dans un parcours normal.
36. **`js/vues.js`** perd la création et la fiche (elles passent dans `js/feuille.js`) et ce qui ne sert qu'à elles ;
    l'accueil, les réglages et « Droits et sources » y restent. `js/app.js` route vers les vues de `js/feuille.js`.
37. **`PRECACHE`** gagne `js/feuille.js`, `js/liens.js`, `js/pretires.js`, `js/regles.js`, chacun à sa place dans
    l'ordre alphabétique : **26 entrées**.
38. **La version** : `VERSION = "v0.3"` ; le cache devient `flh-v0.3`.
39. **L'accueil, les réglages, l'export et l'import** gardent leur comportement ; l'export écrit le schéma 2 ; l'import
    d'un fichier du schéma 1 le migre.

### M · Les textes affichés, au caractère près

*137 clés, les mêmes dans les deux dictionnaires : les 61 de la `v0.2`, moins `fiche.bientot` (retirée), plus 77
neuves. Aucune clé existante ne change de texte. Chacune est utilisée au moins une fois, par une clé littérale.*

*En français, les guillemets « » portent une espace insécable U+00A0 à l'intérieur ; ailleurs, les espaces sont des
espaces ordinaires (y compris avant « : ») ; le signe moins des compteurs est U+2212 ; « · » est U+00B7 ; en anglais,
des guillemets droits. `feuille.etiquette` n'a pas d'espace finale : l'espace qui le sépare de la valeur est dans le
`p` (§2-28).*

| clé | FR | EN |
|---|---|---|
| `nouveau.mode` | Manière de créer | How to create |
| `nouveau.mode_pretire` | Pré-tiré | Pre-generated |
| `nouveau.mode_libre` | Saisie libre | Free entry |
| `nouveau.libre_aide` | Recopiez les valeurs de départ de votre livre. Tout se modifie ensuite depuis la feuille. | Copy the starting values from your book. Everything can be changed later from the sheet. |
| `comp.charisme` | Charisme | Charisma |
| `comp.combat` | Combat | Combat |
| `comp.magie` | Magie | Magic |
| `comp.piete` | Piété | Sanctity |
| `comp.exploration` | Exploration | Scouting |
| `comp.adresse` | Adresse | Thievery |
| `abr.charisme` | Cha | Cha |
| `abr.combat` | Com | Com |
| `abr.magie` | Mag | Mag |
| `abr.piete` | Pié | San |
| `abr.exploration` | Exp | Sco |
| `abr.adresse` | Adr | Thi |
| `pretire.exclusif` | Exclusif édition française | French edition exclusive |
| `pretire.source` | Les personnages pré-tirés des livres 1 et 2, publiés par Alkonost. Leur portrait et leur histoire sont sur la page de l'éditeur. | The pre-generated characters for books 1 and 2, published by Alkonost. Their portrait and story are on the publisher's page. |
| `pretire.lire_toutes` | Voir les fiches chez Alkonost | See the sheets at Alkonost |
| `pretire.lire_fiche` | Lire la fiche chez Alkonost | Read the sheet at Alkonost |
| `feuille.rubriques` | Rubriques de la feuille | Sheet sections |
| `feuille.statistiques` | Statistiques | Statistics |
| `feuille.possessions` | Possessions | Possessions |
| `feuille.cultes` | Cultes | Gods |
| `feuille.endurance` | Endurance | Stamina |
| `feuille.endurance_max` | Endurance maximale | Maximum Stamina |
| `feuille.modifier` | Modifier | Change |
| `feuille.fermer` | Fermer | Close |
| `feuille.competences` | Compétences | Abilities |
| `feuille.base` | base {n} | base {n} |
| `feuille.base_actuelle` | Base actuelle | Current base |
| `feuille.base_initiale` | Initiale : {n} | Initial: {n} |
| `feuille.bonus_malus` | Bonus et malus | Bonuses and penalties |
| `feuille.bonus_vide` | Aucun bonus ni malus. | No bonus or penalty. |
| `feuille.valeur` | Valeur | Value |
| `feuille.raison` | Raison | Reason |
| `feuille.ajouter` | Ajouter | Add |
| `feuille.retirer` | Retirer | Remove |
| `feuille.retirer_nom` | Retirer « {nom} » | Remove "{nom}" |
| `feuille.defense` | Défense | Defence |
| `feuille.formule_defense` | niveau {niveau} + combat {combat} | rank {niveau} + combat {combat} |
| `feuille.titres` | Titres et honneurs | Titles and honours |
| `feuille.titres_vide` | Aucun titre pour l'instant. | No title yet. |
| `feuille.titre_ajouter` | Nouveau titre ou honneur | New title or honour |
| `feuille.histoire` | Histoire | Story |
| `feuille.histoire_aide` | Vos notes sur le personnage : elles restent sur cet appareil. | Your notes on the character: they stay on this device. |
| `feuille.bourse` | Bourse | Money |
| `feuille.chardes` | chardes | Shards |
| `feuille.montant` | Montant | Amount |
| `feuille.gagner` | Gagner | Gain |
| `feuille.depenser` | Dépenser | Spend |
| `feuille.transportees` | Possessions transportées | Possessions carried |
| `feuille.possessions_vide` | Vous ne transportez rien. | You carry nothing. |
| `feuille.possession_ajouter` | Nouvelle possession | New possession |
| `feuille.possessions_plein` | Douze possessions au plus : retirez-en une pour en prendre une autre. | Twelve possessions at most: remove one to take another. |
| `feuille.benedictions` | Bénédictions | Blessings |
| `feuille.benedictions_vide` | Aucune bénédiction. | No blessing. |
| `feuille.maledictions` | Malédictions, maladies et sortilèges | Curses, diseases and spells |
| `feuille.maledictions_vide` | Aucune malédiction, maladie ni sortilège. | No curse, disease or spell. |
| `feuille.resurrections` | Résurrection | Resurrection |
| `feuille.resurrections_vide` | Aucune résurrection prévue. | No resurrection arranged. |
| `feuille.origine` | Divinité ou origine | God or origin |
| `feuille.consequences` | Conséquences | Effects |
| `feuille.lieu` | Lieu | Place |
| `feuille.endurance_moins` | Retirer un point d'Endurance | Remove one Stamina point |
| `feuille.endurance_plus` | Ajouter un point d'Endurance | Add one Stamina point |
| `feuille.max_moins` | Baisser l'Endurance maximale | Lower maximum Stamina |
| `feuille.max_plus` | Monter l'Endurance maximale | Raise maximum Stamina |
| `feuille.niveau_moins` | Baisser le niveau | Lower rank |
| `feuille.niveau_plus` | Monter le niveau | Raise rank |
| `feuille.base_moins` | Baisser la base | Lower the base |
| `feuille.base_plus` | Monter la base | Raise the base |
| `feuille.bourse_moins` | Retirer une charde | Remove one Shard |
| `feuille.bourse_plus` | Ajouter une charde | Add one Shard |
| `apropos.pretires` | Les personnages pré-tirés reprennent les chiffres et les possessions de départ des fiches publiées par Alkonost pour les livres 1 et 2 : six personnages de Dave Morris et Jamie Thomson, et trois créés pour l'édition française. Leur portrait et leur histoire restent sur la page de l'éditeur. Tous les droits sur ces personnages restent à leurs auteurs et à l'éditeur. | The pre-generated characters use the starting scores and possessions from the sheets Alkonost publishes for books 1 and 2: six characters by Dave Morris and Jamie Thomson, and three created for the French edition. Their portrait and story stay on the publisher's page. All rights in these characters remain with their authors and the publisher. |
| `feuille.bourse_insuffisante` | La bourse ne contient que {n} chardes. | Your money holds only {n} Shards. |
| `feuille.etiquette` | {libelle} : | {libelle}: |

## §3 · Ce qui ne bouge pas

- **`PROMPT_DEV_FLH.md`**, **`.gitattributes`**, **`.gitignore`**, **`.github/`** : intacts.
- **`banc/`** : intact, **sauf** ce que nomme le § 4.
- **`index.html`**, **`sw.js`**, **`manifest.webmanifest`**, **`js/i18n.js`**, **`js/pwa.js`**, **`README.md`**, les
  polices, les icônes, `tests/i18n.test.js`, `tests/pwa.test.js` : intacts.
- **Le livre** : rien de neuf. Les pré-tirés ne portent ni portrait, ni histoire, ni motivation.

## §4 · Les fichiers

**Dans l'archive** — 35 fichiers en tout (29 + 6) :

| fichier | change | ce qui y est |
|---|---|---|
| `js/feuille.js` | ajouté | la création et la fiche (§2-D à H) |
| `js/regles.js` | ajouté | §2-B |
| `js/pretires.js` | ajouté | §2-9 |
| `js/liens.js` | ajouté | §2-10 |
| `tests/regles.test.js` | ajouté | §8 |
| `tests/pretires.test.js` | ajouté | §8 |
| `js/sauvegarde.js` | modifié | le schéma 2 et sa complétion (§2-A) |
| `js/stockage.js` | modifié | la complétion à la lecture (§2-3) |
| `js/app.js` | modifié | les routes, le défilement (§2-11, 16, 17, 36) |
| `js/vues.js` | modifié | sans la création ni la fiche ; le paragraphe des pré-tirés (§2-29, 36) |
| `js/precache.js` | modifié | §2-37 |
| `js/version.js` | modifié | `v0.3` |
| `css/app.css` | modifié | `lots/v0.3/app.css` à l'octet (§2-30) |
| `i18n/fr.json`, `i18n/en.json` | modifiés | §2-M |
| `tests/sauvegarde.test.js` | modifié | le schéma 2 (§2-5, §8) |
| `CHANGELOG.md` | modifié | §6 |

**Hors de l'archive** — le banc (§2-K), au plus :

| fichier | change |
|---|---|
| `banc/rituel.mjs` | modifié (§2-31) |
| `banc/lib/contrat.mjs` | modifié **seulement** s'il le faut pour lire `LIENS` |
| `banc/autotest.mjs` | modifié (§2-33) |
| `banc/README.md` | modifié (§2-32) |
| `banc/sauvegardes/README.md` | modifié (§2-34) |
| `banc/sauvegardes/v0.3-exemple.json` | ajouté (§2-34) |

et `lots/v0.3/RAPPORT_DEV.md` (commit à part). **Rien d'autre.** Un fichier ou un module de plus te paraît
nécessaire : arrête-toi.

## §5 · Les critères et la prédiction

**Le bloc « base »** (le rituel de `main` sur `git archive` de `ec237af`, avec les sauvegardes du banc de `main`), ligne
pour ligne :

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

**Le rituel sur `mesure/`**, **avec le banc de ta livraison** et ses sauvegardes (`banc/sauvegardes/`, deux fichiers) —
`<…>` = un compte que tu annonces :

```
fichiers: 35
poids: <octets>
caches: 0
syntaxe: 18/18
tests: <n> passed, 0 failed
sauvegardes: lues=2/2 schema=2
i18n: fr=137 en=137 manquantes=0 orphelines=0 inconnues=0
horsligne: externes=0 precache=26 manquants=0 en_trop=0
version: code=v0.3 changelog=v0.3 cache=flh-v0.3 coherente=oui
changelog: a_completer=0
empreinte: <sha256>
```

**Les portes, en deltas** :

| porte | base | attendu | delta |
|---|---|---|---|
| P1 version | `v0.2` | `v0.3`, cohérente | +1 cran mineur |
| P2 fichiers | 29 | 35 | +6 |
| P3 syntaxe | 12/12 | 18/18 | +6 |
| P4 tests | 30 | ≥ 55 passés, 0 échec | ≥ +25 |
| P5 traductions | 61 | 137 = 137, 0 manquante, 0 orpheline, 0 inconnue | −1 +77 |
| P6 hors ligne | `PRECACHE` 22 | 0 externe, `PRECACHE` = 26, 0 manquant, 0 en trop | +4 |
| P7 écran | — | `ecran: rendus=96 verifs=568/568 console=0 externes=0 debords=0 horsligne_reel=ok` | — |
| P8 sauvegarde | `lues=1/1 schema=1` | `lues=2/2 schema=2` | schéma +1, une référence de plus |
| P10 écart | — | `ecart: ajoutes=6 modifies=11 retires=0`, la liste exacte du §4 | — |
| P12 hors du code | — | les fichiers du banc du §4, et `lots/v0.3/RAPPORT_DEV.md` | — |

**Les critères du lot** :

- **C1** — Les deux blocs ci-dessus, à l'octet, aux comptes annoncés près (`poids`, `tests`, `empreinte`).
- **C2** — `node ecran.mjs <mesure> <lots/v0.3/controles.json>` (depuis une copie, hors du clone, du `banc/` de ton commit
  de livraison, `npm ci` fait) finit sur la ligne de
  P7 exactement. Le contrôle dure plusieurs minutes : lance-le en arrière-plan, avec un fichier témoin.
- **C3** — **Le banc livré sur la base** : son rituel sur `base/` (avec les sauvegardes du banc de `main`) redonne le bloc
  « base » à l'octet.
- **C4** — L'auto-essai du banc livré finit sur `autotest: n/n`, `n` annoncé, `n` > 50.
- **C5** — `css/app.css` et `banc/sauvegardes/v0.3-exemple.json` ont les sha256 du §0.
- **C6** — Aucune chaîne de l'interface hors des dictionnaires ; aucune clé construite ; aucun `innerHTML` alimenté par
  une donnée ; aucune adresse `http(s)://` hors de `js/liens.js` dans le code servi.
- **C7** — Les tests couvrent au moins (annonce le nombre par fichier) :
  - **`tests/regles.test.js`** : `totalCompetence` (sans bonus, avec un bonus et un malus, total négatif) ; `defense`
    (dont : un bonus de Combat n'y entre pas) ; `signe` dans ses trois cas ; chaque borne du §2-7 ;
  - **`tests/pretires.test.js`** : 9 pré-tirés, identifiants uniques, ordre du tableau ; pour chacun, **`defense()` du
    personnage fabriqué égale la Défense publiée** du tableau ; le personnage fabriqué passe `lire(construireExport([…]))`
    sans changer ; `LIENS.pretires` est l'adresse du §2-10 ;
  - **`tests/sauvegarde.test.js`** : la migration d'un personnage du schéma 1 (toutes les valeurs neutres du §2-2) ; un
    personnage complet du schéma 2 relu sans changer ; chaque ligne du tableau du §2-2 dans son cas invalide ; plus de
    12 possessions conservées ; un champ inconnu conservé à côté des champs neufs ; `schema: 3` → `SCHEMA_RECENT` ;
    `construireExport` écrit le schéma 2. (Les sauvegardes de référence se relisent par la ligne `sauvegardes` du rituel :
    les tests tournent sur l'archive, où `banc/` et `lots/` n'existent pas.)
- **C8** — Le rituel et le contrôle d'écran, passés deux fois, donnent les mêmes lignes à l'octet (hors captures).
- **C9** — **Le parcours de bout en bout**, hors dépôt (dans `/tmp`, jamais commité), par un script Playwright sur une
  copie de `mesure/` servie en local, avec le Chromium du banc. Sa sortie va au rapport, une ligne `ok` / `ECHEC` par
  point :
  1. **création d'un pré-tiré** : `#/nouveau`, toucher Liana, « Créer » → la fiche `#/perso/<id>` : Défense 7,
     Endurance `9 / 9`, Combat 5, le lien `fiche-alkonost` vers l'adresse de `LIENS` avec `target=_blank` ;
  2. **l'Endurance** : « − » deux fois → `7 / 9` ; après un rechargement, toujours `7 / 9` ; « + » trois fois → `9 / 9` ;
  3. **un bonus** : déplier Combat, valeur `1`, raison `Épée` → total 6, une puce `+1 Épée`, la Défense reste 7 ; valeur
     `0` avec une raison → rien ne s'ajoute ; valeur `2` sans raison → rien ne s'ajoute ; « Retirer » → total 5 ;
  4. **la position** : la page défilée jusqu'à la ligne Adresse, la déplier → la position verticale ne change pas de
     plus de 1 px ;
  5. **l'Endurance maximale** : « Modifier », maximum ramené à 6 → l'actuelle devient 6 ; le Niveau monté à 2 → la
     Défense devient 8 ;
  6. **la Bourse** : montant `10`, « Dépenser » → 6 chardes, le montant vidé ; montant `100`, « Dépenser » → toujours 6,
     le message `feuille.bourse_insuffisante` avec 6 ; montant `5`, « Gagner » → 11, le message vidé ;
  7. **les 12 possessions** : ajouter jusqu'à 12 → champ et bouton `disabled`, `plein` présent ; en retirer une → le
     champ redevient actif ;
  8. **titres, histoire, cultes** : un titre ajouté par la touche Entrée ; une histoire tapée puis le champ quitté →
     présente après un rechargement ; une bénédiction ajoutée (origine seule) puis retirée ;
  9. **la saisie libre** : nom `Essai`, Combat `3`, Endurance `12`, Niveau vide → la fiche : Niveau 1, Endurance
     `12 / 12`, Défense 4 ;
  10. **le personnage de la `v0.2`** : un personnage du schéma 1 écrit tel quel dans IndexedDB (magasin des personnages,
      par un script de page) → sa fiche s'ouvre, Endurance `0 / 0`, Défense = son niveau ; l'accueil le liste ;
  11. **l'export et l'import** : l'export d'un personnage modifié est au schéma 2 et le réimport le redonne à l'identique ;
      l'import de `lots/v0.3/etats/ancien.json` ajoute ses deux personnages ;
  12. **la suppression** : deux touchers sur « Supprimer » → retour à l'accueil, le personnage absent ;
  13. **le focus** : au clavier, Entrée sur « + » de l'Endurance → après le rendu, le focus est sur ce même bouton ;
  14. **aucune erreur de console** sur l'ensemble des points 1 à 13, **et aucune requête vers un autre hôte**.

## §6 · Le `CHANGELOG`

Texte de l'entrée, mot pour mot, au-dessus de l'entrée `v0.2`, sous l'en-tête existant :

```
## v0.3 — 2026-10-24

- La feuille d'aventure : la création à partir d'un des neuf personnages pré-tirés de l'éditeur ou par saisie libre ; les Statistiques (Endurance, Niveau, compétences avec leurs bonus et malus, Défense calculée, titres et honneurs, histoire), les Possessions (Bourse en chardes, douze possessions transportées) et les Cultes (bénédictions, malédictions, résurrection) ; les personnages existants reçoivent une feuille vierge (sauvegarde au schéma 2).
```

## §7 · Les arrêts propres au lot

En plus de ceux du prompt du dev :
- Un fichier, un module ou une classe CSS de plus que ce que nomment le §4 et `lots/v0.3/app.css` te paraît nécessaire.
- Un sha256 du §0 ne correspond pas à la pièce de la branche.
- Un contrôle de `lots/v0.3/controles.json` contredit une règle du §2, ou ne peut pas passer avec la structure qu'elle
  décrit.
- Une des 137 clés ne trouve pas d'usage par une clé littérale.
- `defense()` d'un pré-tiré fabriqué ne donne pas la Défense publiée du tableau du §2-9.
- La règle du §2-31 ne peut pas s'écrire sans changer le format des lignes du rituel.

## §8 · Les preuves

- **Les tests** : les 30 existants (adaptés au schéma 2 là où ils l'écrivent en dur, aucun retiré), plus au moins 25
  dans les trois fichiers de C7.
- **Le contrôle d'écran** : les 12 cas de `lots/v0.3/controles.json`, soit 96 rendus et 568 vérifications.
- **L'auto-essai** du banc livré (C4) ; le banc livré sur la base (C3).
- **Le parcours de bout en bout** (C9), sa sortie au rapport.
- **Aucune image à montrer, aucune capture à ouvrir.** Le CdP regarde lui-même les captures et les compare à la
  maquette validée.

## §9 · La livraison

- Le commit de livraison (« Lot v0.3 — livraison »), puis `lots/v0.3/RAPPORT_DEV.md` dans un commit à part (« Lot v0.3
  — rapport »), poussés sur `lot/v0.3`.
- Le livrable : `git archive` du commit de livraison, que GitHub Pages servira après la fusion.
