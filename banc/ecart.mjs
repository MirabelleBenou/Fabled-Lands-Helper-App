// Lot banc-v1 — la mesure commune : compare deux dossiers par le sha256 de chaque fichier.
// Usage : node banc/ecart.mjs <base> <livre>
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { echec, lireArguments } from './lib/args.mjs';
import { comparerOctets, lister, sha256Fichier } from './lib/fichiers.mjs';

const USAGE = 'usage : node banc/ecart.mjs <base> <livre>';
let args;
try {
  args = lireArguments(process.argv.slice(2), {});
} catch (e) {
  echec(`${e.message}\n${USAGE}`);
}
if (args.positionnels.length !== 2) echec(USAGE);
const [base, livre] = args.positionnels.map((p) => resolve(p));
for (const [nom, dossier] of [['base', base], ['livre', livre]]) {
  if (!existsSync(dossier) || !statSync(dossier).isDirectory()) echec(`dossier ${nom} introuvable : ${dossier}`);
}

const cheminsBase = new Set(lister(base));
const cheminsLivre = new Set(lister(livre));
const tous = [...new Set([...cheminsBase, ...cheminsLivre])].sort(comparerOctets);
const lignes = [];
let ajoutes = 0;
let modifies = 0;
let retires = 0;
for (const chemin of tous) {
  if (!cheminsBase.has(chemin)) { lignes.push(`A ${chemin}`); ajoutes += 1; }
  else if (!cheminsLivre.has(chemin)) { lignes.push(`D ${chemin}`); retires += 1; }
  else if (sha256Fichier(base, chemin) !== sha256Fichier(livre, chemin)) { lignes.push(`M ${chemin}`); modifies += 1; }
}
lignes.push(`ecart: ajoutes=${ajoutes} modifies=${modifies} retires=${retires}`);
process.stdout.write(`${lignes.join('\n')}\n`);
