import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MONDE_PAR_DEFAUT, MONDES } from '../content';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { mondeDemande, type Environnement } from './jeu';
import { piloterMiseAJour } from './miseAJour';
import { creerRapports } from './rapports';
import { ecrireReglages, lireReglages } from './reglages';
import { stockageIndexedDB } from './sauvegarde';
import { creerMoteur, sessionAmbiante } from './son/moteur';
import './styles.css';

// AR-01 par défaut ; `?monde=<id>` choisit un autre monde connu (le monde de test pour les captures).
const idMonde = mondeDemande(window.location.search, MONDES, MONDE_PAR_DEFAUT);
const entree = MONDES[idMonde];
const racine = document.getElementById('racine');
if (entree === undefined || racine === null) throw new Error('Démarrage impossible : monde ou racine absent.');

const version = import.meta.env.VITE_VERSION;
// Un autre monde garde sa partie à part : il ne reprend ni n'écrase celle du monde par défaut.
const base = `void-walker:${import.meta.env.BASE_URL}`;
const env: Environnement = {
  monde: entree.monde,
  textes: entree.textes,
  version,
  stockage: stockageIndexedDB(idMonde === MONDE_PAR_DEFAUT ? base : `${base}?monde=${idMonde}`),
  // Graine de la partie : tirée une fois au départ puis enregistrée (AP-02).
  graine: () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0,
};

const reglages = lireReglages((cle) => window.localStorage.getItem(cle));

// Hasard du son, sans lien avec celui de la partie : générateur rapide amorcé une fois par l'appareil (Math.random est interdit, AP-02).
let etatHasard = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
const hasardSon = (): number => {
  etatHasard = (Math.imul(etatHasard, 1664525) + 1013904223) >>> 0;
  return etatHasard / 2 ** 32;
};

// Son (15 §5, D-222) : synthétisé en direct ; rien avant le premier toucher, pause en arrière-plan, mode silencieux respecté.
const son = creerMoteur(
  {
    creerContexte: () => {
      const Contexte = window.AudioContext as typeof AudioContext | undefined;
      return Contexte === undefined ? null : new Contexte();
    },
    hasard: hasardSon,
    minuterie: {
      attendre: (ms, quoi) => {
        const minuteur = window.setTimeout(quoi, ms);
        return () => window.clearTimeout(minuteur);
      },
    },
    mouvementReduit: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  },
  reglages,
);
sessionAmbiante(navigator);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) son.cacher();
  else son.montrer();
});
window.addEventListener('pagehide', () => son.cacher());

// Mise à jour de l'appli installée (D-227) : cherchée au lancement, au retour dans l'appli et toutes les demi-heures.
const miseAJour = piloterMiseAJour({
  enregistrer: registerSW,
  document,
  minuterie: {
    repeter: (ms, quoi) => void window.setInterval(quoi, ms),
    attendre: (ms, quoi) => void window.setTimeout(quoi, ms),
  },
  recharger: () => window.location.reload(),
});

// Rapports (C-10 §3) : ceux gardés sans réseau repartent au lancement et au retour du réseau (PR-01).
const rapports = creerRapports({
  adresse: import.meta.env.VITE_SERVICE_RAPPORTS,
  appeler: (adresse, init) => window.fetch(adresse, init),
  lire: (cle) => window.localStorage.getItem(cle),
  ecrire: (cle, valeur) => window.localStorage.setItem(cle, valeur),
  maintenant: () => Date.now(),
});
void rapports.renvoyer();
window.addEventListener('online', () => void rapports.renvoyer());

createRoot(racine).render(
  <StrictMode>
    <App
      env={env}
      reglages={reglages}
      garderReglages={(reglages) => ecrireReglages((cle, valeur) => window.localStorage.setItem(cle, valeur), reglages)}
      version={version}
      build={import.meta.env.VITE_BUILD ?? ''}
      commit={import.meta.env.VITE_COMMIT ?? ''}
      pr={import.meta.env.VITE_PR_NUMERO ?? ''}
      son={son}
      miseAJour={miseAJour}
      rapports={rapports}
    />
  </StrictMode>,
);
