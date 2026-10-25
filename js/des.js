// Lot v0.5 — les dés : la barre de la fiche (le bouton-dé et le choix « 1 dé » / « 2 dés »), la couche où deux cubes
// roulent, rebondissent et s'arrêtent sur la face tirée, et le dernier jet. L'application ne calcule rien : le joueur
// lit le résultat. Ce module s'importe dans Node : rien n'y touche window ou document au chargement.
import { t } from './i18n.js';
import { ecrireReglage, lireReglage } from './stockage.js';
import { el } from './vues.js';

// ---- Le hasard et les valeurs --------------------------------------------------------------------------

// Un dé à six faces par un octet tiré au hasard : au-delà de 251 (le plus grand multiple de 6 sous 256), on retire.
export function tirageNavigateur() {
  const octets = new Uint8Array(1);
  do {
    crypto.getRandomValues(octets);
  } while (octets[0] >= 252);
  return (octets[0] % 6) + 1;
}

export function lancer(nombre, tirage = tirageNavigateur) {
  const valeurs = [];
  for (let i = 0; i < nombre; i++) valeurs.push(tirage());
  return valeurs;
}

export function somme(valeurs) {
  return valeurs.reduce((total, valeur) => total + valeur, 0);
}

export function texteJet(valeurs) {
  return valeurs.length === 1 ? String(valeurs[0]) : `${valeurs.join(' + ')} = ${somme(valeurs)}`;
}

// Les cases occupées par les points de la face `valeur`, dans une grille 3 × 3 (0 à 8, de gauche à droite, de haut en bas).
const POINTS = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export function points(valeur) {
  return [...POINTS[valeur]];
}

// ---- Le roulé : les tables ---------------------------------------------------------------------------

const VUE = 22; // degrés : la table vue un peu de face
// L'orientation qui tourne la face `v` vers l'œil : [rotateX, rotateY] en degrés.
const ORIENTATION = {
  1: [0, 0],
  2: [0, -90],
  3: [-90, 0],
  4: [90, 0],
  5: [0, 90],
  6: [0, 180],
};
// Les poses au repos : [écart en tailles de dé, z en degrés].
const POSES = {
  1: [[0, -12]],
  2: [[-0.85, -14], [0.85, 11]],
};
// Les bonds : [début, fin, hauteur] sur le temps de 0 à 1.
const BONDS = [
  [0, 0.30, 1.0],
  [0.30, 0.56, 0.42],
  [0.56, 0.74, 0.16],
  [0.74, 0.86, 0.05],
];
const IMAGES = 40;

function hauteur(temps) {
  for (const [debut, fin, haut] of BONDS) {
    if (temps >= debut && temps < fin) {
      const u = (temps - debut) / (fin - debut);
      return haut * 4 * u * (1 - u);
    }
  }
  return 0;
}

const nombre1 = (n) => n.toFixed(1);

function transformation(x, y, z, rx, ry) {
  return `translate3d(${nombre1(x)}px, ${nombre1(y)}px, 0) perspective(1600px) rotateZ(${nombre1(z)}deg) rotateX(${VUE}deg) rotateX(${nombre1(rx)}deg) rotateY(${nombre1(ry)}deg)`;
}

// ---- La session : le dernier jet, la barre courante, la couche ouverte -----------------------------------

let dernier = null; // le dernier jet posé, un tableau de valeurs, ou null
let lectureDernier = null; // la lecture unique du réglage, pour la session
let barreCourante = null; // { bouton, texte } : la barre du dernier rendu de la fiche
let coucheOuverte = null; // l'état de la couche ouverte, ou null

function jetValide(valeurs) {
  return Array.isArray(valeurs) && (valeurs.length === 1 || valeurs.length === 2)
    && valeurs.every((v) => Number.isInteger(v) && v >= 1 && v <= 6);
}

function afficherDernier() {
  if (barreCourante === null) return;
  const { texte } = barreCourante;
  if (dernier === null) {
    texte.hidden = true;
    texte.textContent = '';
  } else {
    texte.textContent = t('des.dernier', { jet: texteJet(dernier) });
    texte.hidden = false;
  }
}

// Les neuf cases d'une face : .point aux cases occupées, .vide aux autres.
function casesFace(valeur) {
  const occupees = points(valeur);
  return Array.from({ length: 9 }, (_, i) => el('span', { classe: occupees.includes(i) ? 'point' : 'vide' }));
}

// ---- La couche ------------------------------------------------------------------------------------------

const FACES = [
  ['face-avant', 1],
  ['face-droite', 2],
  ['face-haut', 3],
  ['face-bas', 4],
  ['face-gauche', 5],
  ['face-arriere', 6],
];

function construireDe() {
  return el('span', { classe: 'de', test: 'de', 'data-valeur': '1' },
    ...FACES.map(([classe, valeur]) => el('span', { classe: `face ${classe}` }, ...casesFace(valeur))),
    el('span', { classe: 'noyau noyau-x' }),
    el('span', { classe: 'noyau noyau-y' }),
    el('span', { classe: 'noyau noyau-z' }));
}

function mouvementReduit() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ranger(etat) {
  if (etat.ferme) return;
  etat.ferme = true;
  etat.jeton++;
  for (const animation of etat.animations) animation.cancel();
  etat.animations = [];
  document.removeEventListener('keydown', etat.surTouche);
  window.removeEventListener('hashchange', etat.surAdresse);
  etat.couche.remove();
  if (coucheOuverte === etat) coucheOuverte = null;
  if (etat.enAttente !== null) {
    dernier = etat.enAttente;
    etat.enAttente = null;
    afficherDernier();
  }
  barreCourante?.bouton.focus({ preventScroll: true });
}

function poser(etat) {
  const { valeurs } = etat;
  etat.resultat.textContent = String(somme(valeurs));
  etat.resultat.setAttribute('aria-label', t('des.resultat', { jet: texteJet(valeurs) }));
  if (valeurs.length === 2) {
    etat.detail.textContent = `${valeurs[0]} + ${valeurs[1]}`;
    etat.detail.hidden = false;
  } else {
    etat.detail.textContent = '';
    etat.detail.hidden = true;
  }
  etat.cartouche.classList.add('pose');
  etat.enAttente = null;
  dernier = valeurs;
  afficherDernier();
}

function lancerDes(etat) {
  const valeurs = lancer(etat.nombre);
  etat.valeurs = valeurs;
  etat.cartouche.classList.remove('pose');
  etat.enAttente = valeurs;
  etat.jeton++;
  const jeton = etat.jeton;
  try {
    ecrireReglage('dernier_jet', [...valeurs]).catch(() => {});
  } catch {
    // le réglage ne s'écrit pas : le jet reste celui de la session
  }
  for (const animation of etat.animations) animation.cancel();
  etat.animations = [];
  const reduit = mouvementReduit();
  const poses = POSES[etat.nombre];
  let restants = valeurs.length;
  const fini = () => {
    restants--;
    if (restants === 0 && jeton === etat.jeton) poser(etat);
  };
  valeurs.forEach((valeur, i) => {
    const { de, ombre } = etat.des[i];
    const taille = de.offsetWidth;
    const [ecart, z] = poses[i];
    const x1 = ecart * taille;
    const [ax, ay] = ORIENTATION[valeur];
    de.dataset.valeur = String(valeur);
    for (const animation of [...de.getAnimations(), ...ombre.getAnimations()]) animation.cancel();
    const repos = () => {
      de.style.transform = transformation(x1, 0, z, ax, ay);
      ombre.style.transform = `translate(${nombre1(x1)}px, ${nombre1(0.42 * taille)}px) scale(1)`;
      ombre.style.opacity = '1';
    };
    repos();
    if (reduit) {
      fini();
      return;
    }
    const x0 = x1 + (i ? 1.6 : -1.4) * taille;
    const y0 = 0.65 * window.innerHeight;
    const toursX = 720 + 360 * ((valeur + i) % 3);
    const toursY = (i ? -1 : 1) * (360 + 360 * (valeur % 2));
    const z0 = z + (i ? 160 : -140);
    const duree = 2000 + 220 * i;
    const imagesDe = [];
    const imagesOmbre = [];
    for (let k = 0; k <= IMAGES; k++) {
      const temps = k / IMAGES;
      const avance = 1 - (1 - Math.min(1, temps / 0.9)) ** 2.4;
      const h = hauteur(temps) * 1.6 * taille;
      const x = x0 + (x1 - x0) * avance;
      const sol = y0 * (1 - avance);
      imagesDe.push({
        transform: transformation(x, sol - h, z0 + (z - z0) * avance, ax + toursX * (1 - avance), ay + toursY * (1 - avance)),
        offset: temps,
      });
      const loin = h / (1.6 * taille);
      imagesOmbre.push({
        transform: `translate(${nombre1(x)}px, ${nombre1(sol + 0.42 * taille)}px) scale(${(1 + 0.5 * loin).toFixed(3)})`,
        opacity: (1 - 0.6 * loin).toFixed(3),
        offset: temps,
      });
    }
    const options = { duration: duree, easing: 'linear', fill: 'forwards' };
    const animationDe = de.animate(imagesDe, options);
    const animationOmbre = ombre.animate(imagesOmbre, options);
    etat.animations.push(animationDe, animationOmbre);
    animationDe.onfinish = () => {
      if (jeton !== etat.jeton) return;
      repos();
      fini();
    };
  });
}

function ouvrirCouche(nombre) {
  if (coucheOuverte !== null) ranger(coucheOuverte);
  const ombres = Array.from({ length: nombre }, () => el('span', { classe: 'ombre-de' }));
  const des = Array.from({ length: nombre }, construireDe);
  const plateau = el('button', { classe: 'des-plateau', type: 'button', test: 'des-plateau', 'aria-label': t('des.relancer_aria') },
    ...ombres, ...des);
  const resultat = el('p', { classe: 'des-resultat', test: 'des-resultat', 'aria-live': 'polite' });
  const detail = el('p', { classe: 'des-detail', test: 'des-detail' });
  const relancer = el('button', { classe: 'lien', type: 'button', test: 'des-relancer', texte: t('des.relancer') });
  const rangerBouton = el('button', { classe: 'lien', type: 'button', test: 'des-ranger', texte: t('des.ranger') });
  const cartouche = el('div', { classe: 'des-cartouche' }, resultat, detail, el('p', { classe: 'des-actions' }, relancer, rangerBouton));
  const couche = el('div', {
    classe: 'des-couche', test: 'des-couche', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('des.titre'),
  }, plateau, cartouche);
  const etat = {
    nombre,
    couche,
    cartouche,
    resultat,
    detail,
    des: des.map((de, i) => ({ de, ombre: ombres[i] })),
    valeurs: [],
    enAttente: null,
    animations: [],
    jeton: 0,
    ferme: false,
    surTouche: null,
    surAdresse: null,
  };
  etat.surTouche = (evenement) => {
    if (evenement.key === 'Escape') ranger(etat);
  };
  etat.surAdresse = () => ranger(etat);
  plateau.addEventListener('click', () => lancerDes(etat));
  relancer.addEventListener('click', () => lancerDes(etat));
  rangerBouton.addEventListener('click', () => ranger(etat));
  couche.addEventListener('click', (evenement) => {
    if (evenement.target === couche) ranger(etat);
  });
  document.addEventListener('keydown', etat.surTouche);
  window.addEventListener('hashchange', etat.surAdresse);
  document.body.append(couche);
  coucheOuverte = etat;
  lancerDes(etat);
  plateau.focus({ preventScroll: true });
}

// ---- La barre de la fiche ----------------------------------------------------------------------------

export async function barreDes() {
  if (lectureDernier === null) {
    lectureDernier = lireReglage('dernier_jet').then(
      (valeurs) => { dernier = jetValide(valeurs) ? valeurs : null; },
      () => { dernier = null; },
    );
  }
  await lectureDernier;
  const texte = el('p', { classe: 'des-dernier', test: 'des-dernier' });
  const un = el('button', { classe: 'bouton', type: 'button', test: 'des-1', 'aria-label': t('des.lancer_un'), texte: t('des.un') });
  const deux = el('button', { classe: 'bouton', type: 'button', test: 'des-2', 'aria-label': t('des.lancer_deux'), texte: t('des.deux') });
  const menu = el('div', { classe: 'des-menu', test: 'des-menu' }, un, deux);
  menu.hidden = true;
  const faceBouton = el('span', { classe: 'face-bouton', 'aria-hidden': 'true' }, ...casesFace(5));
  const bouton = el('button', {
    classe: 'bouton-de', type: 'button', test: 'des-bouton', 'aria-label': t('des.titre'), 'aria-expanded': 'false',
  }, faceBouton);
  const barre = el('div', { classe: 'barre-des', test: 'barre-des' }, texte, el('div', { classe: 'des-ligne' }, menu, bouton));
  barreCourante = { bouton, texte };
  afficherDernier();

  const fermer = () => {
    menu.hidden = true;
    bouton.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', surToucher, true);
    document.removeEventListener('keydown', surTouche);
  };
  const surToucher = (evenement) => {
    if (!menu.contains(evenement.target) && !bouton.contains(evenement.target)) fermer();
  };
  const surTouche = (evenement) => {
    if (evenement.key !== 'Escape') return;
    fermer();
    bouton.focus({ preventScroll: true });
  };
  const ouvrir = () => {
    menu.hidden = false;
    bouton.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', surToucher, true);
    document.addEventListener('keydown', surTouche);
    un.focus({ preventScroll: true });
  };
  bouton.addEventListener('click', () => {
    if (menu.hidden) ouvrir();
    else fermer();
  });
  un.addEventListener('click', () => {
    fermer();
    ouvrirCouche(1);
  });
  deux.addEventListener('click', () => {
    fermer();
    ouvrirCouche(2);
  });
  return barre;
}
