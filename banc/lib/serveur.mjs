// Lot banc-v1 — serveur statique du banc : node:http, 127.0.0.1, port libre choisi par le système.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

export function demarrerServeur(racine) {
  const serveur = createServer(async (requete, reponse) => {
    try {
      if (requete.method !== 'GET' && requete.method !== 'HEAD') {
        reponse.writeHead(405).end();
        return;
      }
      let chemin = decodeURIComponent(new URL(requete.url, 'http://127.0.0.1').pathname);
      if (chemin === '/') chemin = '/index.html';
      const absolu = normalize(join(racine, chemin));
      if (absolu !== racine && !absolu.startsWith(racine + sep)) {
        reponse.writeHead(403).end();
        return;
      }
      const infos = await stat(absolu);
      if (!infos.isFile()) throw new Error('pas un fichier');
      const corps = await readFile(absolu);
      reponse.writeHead(200, {
        'Content-Type': TYPES[extname(absolu).toLowerCase()] ?? 'application/octet-stream',
        'Content-Length': corps.length,
        'Cache-Control': 'no-store',
      });
      reponse.end(requete.method === 'HEAD' ? undefined : corps);
    } catch {
      reponse.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('introuvable');
    }
  });
  return new Promise((resolu, rejete) => {
    serveur.once('error', rejete);
    serveur.listen(0, '127.0.0.1', () => {
      const { port } = serveur.address();
      resolu({
        port,
        hote: `127.0.0.1:${port}`,
        origine: `http://127.0.0.1:${port}`,
        fermer: () => new Promise((ok) => { serveur.closeAllConnections?.(); serveur.close(() => ok()); }),
      });
    });
  });
}
