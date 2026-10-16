import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App, EcranRefus } from './App';
import { CATALOGUE } from './catalogue';
import { cleStockage, demandeDe, preparerLancement, type Environnement } from './jeu';
import { piloterInstallation } from './installation';
import { piloterMiseAJour } from './miseAJour';
import { creerRapports } from './rapports';
import { coffreIndexedDB, creerSignataire } from './validation';
import { ecrireReglages, lireReglages } from './reglages';
import { stockageIndexedDB } from './sauvegarde';
import { creerMoteur, sessionAmbiante } from './son/moteur';
import './styles.css';

// Adresse nue : une station tirée, ou celle de la partie enregistrée (#152) ; `?monde=<id>` garde un monde fixe (AR-01, le monde
// de test pour les captures) ; `?station=<composition>` ou `?station=<identifiant>` force une station, refusée avec son motif.
const demande = demandeDe(window.location.search, CATALOGUE.mondes);
const racine = document.getElementById('racine');
if (racine === null) throw new Error('Démarrage impossible : racine absente.');

const version = import.meta.env.VITE_VERSION;
// Chaque adresse garde sa partie à part : elle ne reprend ni n'écrase celle d'une autre.
const stockage = stockageIndexedDB(cleStockage(`void-walker:${import.meta.env.BASE_URL}`, demande));
// Hasard de l'appareil : graine de chaque partie, tirée une fois au départ puis enregistrée (AP-02), et stations tirées.
const hasard = (): number => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;

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

// Installation sur l'écran d'accueil (#174) : l'événement du navigateur peut arriver avant le premier rendu, on l'écoute dès ici.
const installation = piloterInstallation({
  ecouter: (type, ecouteur) => window.addEventListener(type, ecouteur),
  agent: navigator.userAgent,
  pointsTactiles: navigator.maxTouchPoints,
  modeAppli: () =>
    ['standalone', 'fullscreen', 'minimal-ui'].some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true,
  versionDeTest: Boolean(import.meta.env.VITE_PR_NUMERO),
  lire: (cle) => window.localStorage.getItem(cle),
  ecrire: (cle, valeur) => window.localStorage.setItem(cle, valeur),
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

// Clé de validation (C-10 §4) : seulement dans une version de test, où « je valide » existe (D-132).
const signataire = import.meta.env.VITE_PR_NUMERO ? creerSignataire(coffreIndexedDB()) : undefined;

// Attendu en dernier : la mise à jour et les rapports partent même si la base tarde.
const lancement = await preparerLancement(demande, CATALOGUE, stockage, hasard);
const env: Environnement | null =
  lancement.entree === null ? null : { monde: lancement.entree.monde, textes: lancement.entree.textes, version, stockage, graine: hasard };

createRoot(racine).render(
  <StrictMode>
    {env === null ? (
      <EcranRefus motif={lancement.refus ?? ''} reglages={reglages} />
    ) : (
      <App
        env={env}
        nouvelleStation={lancement.suivante}
        reglages={reglages}
        garderReglages={(reglages) => ecrireReglages((cle, valeur) => window.localStorage.setItem(cle, valeur), reglages)}
        version={version}
        build={import.meta.env.VITE_BUILD ?? ''}
        commit={import.meta.env.VITE_COMMIT ?? ''}
        pr={import.meta.env.VITE_PR_NUMERO ?? ''}
        son={son}
        miseAJour={miseAJour}
        installation={installation}
        rapports={rapports}
        signataire={signataire}
      />
    )}
  </StrictMode>,
);
