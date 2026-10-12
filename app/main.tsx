import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MONDE_PAR_DEFAUT, MONDES } from '../content';
import { App } from './App';
import { mondeDemande, type Environnement } from './jeu';
import { lireReglages } from './reglages';
import { stockageIndexedDB } from './sauvegarde';
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

createRoot(racine).render(
  <StrictMode>
    <App
      env={env}
      reglages={lireReglages((cle) => window.localStorage.getItem(cle))}
      version={version}
      commit={import.meta.env.VITE_COMMIT ?? ''}
      pr={import.meta.env.VITE_PR_NUMERO ?? ''}
    />
  </StrictMode>,
);
