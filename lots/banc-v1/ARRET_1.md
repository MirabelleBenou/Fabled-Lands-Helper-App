# ARRET 1 — le bloc « base » et la forme de la ligne `version` se contredisent

Lot `banc-v1` · dev Sonnet · 23 octobre 2026 · arrêt au sens du §7 du cadrage (« le rituel sur la base ne donne pas le
bloc « base » et tu penses que c'est le cadrage qui se trompe »).

## Ce qui est mesuré

Le rituel construit, passé sur `base/` (`git archive origin/main`, tête `6ce323c3eb9edf3a5f70c8cd3b16a6f6da9ee31c`) et sur
`mesure/` (`git archive` du commit `84c88055dc425975055b285b43dcde9008cfabff`), écrit les mêmes onze lignes, qui égalent
le bloc « base » du §5 **sur dix lignes** (empreinte `07b6f76c…3c72` comprise). La seule différence, ligne 9 :

```
bloc « base » du cadrage (§5) : version: code=absente changelog=absente cache=absente coherente=sans-objet
rituel construit               : version: code=absente changelog=absente cache=absent  coherente=sans-objet
```

(`diff` des deux fichiers : `9c9`, rien d'autre.)

## Les deux textes qui se contredisent

- Le §C-15 (la forme de la sortie) écrit : `version: code=<v|absente> changelog=<v|absente> cache=<nom|absent> coherente=…` —
  pour `cache`, **`absent`** (masculin) ; le §B (en tête) dit aussi « `absente` / `absent` / `aucun`, selon les lignes du §C ».
- Le bloc « base » du §5 (et donc le critère C1, « à l'octet ») écrit **`cache=absente`**.

Les deux ne peuvent pas être tenus ensemble.

## Lequel est faux, à mon avis

Le **bloc « base » du §5** (une faute de genre, recopiée de `code=absente changelog=absente`) : le §C-15 est explicite et
la même ligne `horsligne` écrit déjà `precache=absent`. Mais je ne tranche pas : c'est au chef de projet de dire quel
texte fait foi.

## Ce qui lèverait l'arrêt (un mot à changer, d'un côté ou de l'autre)

- soit le cadrage corrige le bloc « base » en `cache=absent` : le code livré (commit `84c8805`) passe C1 tel quel ;
- soit le cadrage corrige le §C-15 en `cache=<nom|absente>` : je change un mot dans `banc/rituel.mjs`, le README et
  `banc/autotest.mjs` (qui ne l'attend pas, il ne teste que `coherente`), et je refais les mesures.

## État du travail, pour que tu puisses lever l'arrêt vite

Le commit de livraison `84c88055dc425975055b285b43dcde9008cfabff` (« Lot banc-v1 — livraison ») est sur la branche. Mesuré
à froid, avec ce commit : `autotest: 50/50` (aucun `ECHEC`, l'essai sain et D1 à D16) ; C2 (`ecart: ajoutes=0 modifies=0
retires=0`) ; C6 (deux exécutions du rituel et de la mesure commune identiques à l'octet) ; C7 (empreinte de l'essai sain
inchangée après rituel et écran) ; C8 (`npm ci` passe dans une copie neuve, aucun `node_modules/` suivi par git) ; C9 (rien
de Fabled Lands dans `banc/`). Je n'ai pas écrit de rapport : il suivra après l'addendum.

## Trois constats qui ne bloquent pas, à connaître

1. **`node --check` laisse passer des erreurs.** `node --check fichier.js`, sur un `.js` d'un dossier sans `package.json` à
   `"type": "module"` (l'application n'en a pas), ne signale pas une erreur de syntaxe dès que le fichier contient `import`
   ou `export` (Node 22.22, mesuré : sortie `0` sur `import x from 'node:fs'; const = ;`). Le rituel contrôle donc chaque
   `.js` et `.mjs` comme un module, par l'entrée standard (`node --input-type=module --check`). Le **P3 du prompt du dev**
   (« `node --check` passe sur chaque `.js` servi ») est aveugle dans ce cas ; à reporter dans le prompt.
2. **Lieu des défauts D1 et D3.** D1 est planté en `node_modules/x/README.md` (un `index.js` ferait aussi bouger `syntaxe` et
   `manquants`) ; D3 est un test ajouté dans un fichier de test existant (un nouveau `.test.js` ferait bouger `syntaxe`).
   C'est le « choisir où planter » du §C-18.
3. **Un navigateur par rendu.** Les arguments de `@sparticuz/chromium` font tourner Chromium en un seul processus (`--single-process`) ;
   fermer un contexte tue alors le navigateur (mesuré). Le contrôle d'écran lance donc un Chromium par rendu (executablePath
   et args du paquet, inchangés).
