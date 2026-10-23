// Lot banc-v1 — lecture des arguments de ligne de commande, sans dépendance.
// options : { nom: 'valeur' | 'drapeau' }. Rend { positionnels, options } ou lève une erreur d'usage.
export function lireArguments(argv, options) {
  const positionnels = [];
  const valeurs = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const type = options[arg.slice(2)];
      if (!type) throw new Error(`option inconnue : ${arg}`);
      if (type === 'drapeau') valeurs[arg.slice(2)] = true;
      else {
        i += 1;
        if (i >= argv.length) throw new Error(`l'option ${arg} attend une valeur`);
        valeurs[arg.slice(2)] = argv[i];
      }
    } else positionnels.push(arg);
  }
  return { positionnels, options: valeurs };
}

// Échec de l'instrument lui-même : raison sur la sortie d'erreur, code de sortie 2.
export function echec(message) {
  process.stderr.write(`erreur : ${message}\n`);
  process.exit(2);
}
