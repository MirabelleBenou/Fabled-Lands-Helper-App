# ADDENDUM 1 — Le banc d'essai · `banc-v1`
### 23 octobre 2026 · CdP-1 · répond à `ARRET_1.md`

**Dev : Sonnet · High · même session**

## Ce que l'addendum remplace

- Le §5 du cadrage, bloc « base », ligne 9 : **remplacée par**

  ```
  version: code=absente changelog=absente cache=absent coherente=sans-objet
  ```

  Le §C-15 fait foi (`cache=<nom|absent>`) ; la faute était dans le bloc. Les dix autres lignes du bloc ne changent pas.
  Le critère C1 se lit contre ce bloc corrigé.

## Ce qu'il confirme

Les quatre choix signalés à l'arrêt sont **conformes au cadrage** et restent tels quels, documentés au `banc/README.md` :
le contrôle de syntaxe en module par l'entrée standard (`node --input-type=module --check`) ; le lieu de plantation de D1
(`node_modules/x/README.md`) et de D3 (un test ajouté dans un fichier existant) ; un Chromium par rendu ; `externes`
compté en adresses distinctes par rendu, la console et les requêtes mesurées sur la page finale après au plus 5 s de
réseau calme, et `console` non contrainte pour D13.

## Où reprendre

À l'étape 10 du déroulé : **le code livré ne change pas**, le commit de livraison reste
`84c88055dc425975055b285b43dcde9008cfabff`. Remesure C1 sur `mesure/` contre le bloc corrigé, puis écris
`lots/banc-v1/RAPPORT_DEV.md` dans un commit à part et pousse la branche.

## Ce qui ne change pas

Tout le reste du cadrage.
