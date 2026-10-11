import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MONDE_PAR_DEFAUT, MONDES } from '../content';
import { App } from './App';
import type { Environnement } from './jeu';
import { lireReglages } from './reglages';
import { stockageIndexedDB } from './sauvegarde';
import './styles.css';

const entree = MONDES[MONDE_PAR_DEFAUT];
const racine = document.getElementById('racine');
if (entree === undefined || racine === null) throw new Error('Démarrage impossible : monde ou racine absent.');

const version = import.meta.env.VITE_VERSION;
const env: Environnement = {
  monde: entree.monde,
  textes: entree.textes,
  version,
  stockage: stockageIndexedDB(`void-walker:${import.meta.env.BASE_URL}`),
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
