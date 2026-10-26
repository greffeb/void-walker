import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from '../engine';
import { nomDe, remplir } from '../content';
import { dejaEcrit, DUREE_ECRITURE_MS, marquerEcrit } from './ecriture';
import { AUCUN_SIGNAL } from './constantes';
import { Recit } from './EcranJeu';
import { recitDeFin, type Environnement, type Jeu } from './jeu';
import { EnvoyerMaPartie } from './PanneauRapport';
import type { Retour } from './rapports';
import { annoncerTexte, useSon } from './son/contexte';
import { LIBELLES } from './libelles';

/**
 * Écran de fin (12 §4.11) : le récit seulement, sans score ni bilan (D-086, D-284). Défaite ou évacuation : la partie racontée
 * par ses moments marquants (D-281 à D-283) ; abandon : la pièce où le passager s'est arrêté. Écrit à la machine (D-186).
 */
export function EcranFin({
  jeu,
  env,
  machineAEcrire,
  occupe,
  rejouer,
  nouvellePartie,
  menuPrincipal,
  envoyerPartie,
  pr = '',
  empreinteCle,
}: {
  readonly jeu: Jeu;
  readonly env: Pick<Environnement, 'monde' | 'textes'>;
  readonly machineAEcrire: boolean;
  readonly occupe: boolean;
  /** Même état de départ, nouveaux tirages (D-087, D-088). */
  readonly rejouer: () => void;
  readonly nouvellePartie: () => void;
  readonly menuPrincipal: () => void;
  /** ENVOYER MA PARTIE (12 §4.11) ; absent, pas de bouton. */
  readonly envoyerPartie?: (commentaire: string, valide: boolean) => Promise<Retour>;
  /** Numéro de PR de la version de test, vide pour la version publique. */
  readonly pr?: string;
  /** Empreinte de la clé de validation, montrée sous « je valide » (D-232) : l'écran de fin n'a pas d'options. */
  readonly empreinteCle?: () => Promise<string | null>;
}) {
  const { textes } = env;
  // Le récit de la fin, comme un dernier texte de la partie : écrit une fois, puis gardé tel quel.
  const fin = useMemo(() => {
    const { issue, piece } = observer(env.monde, jeu.partie.etat);
    const recit =
      issue === null
        ? { titre: remplir(env.textes.fin.titres.abandon, {}), paragraphes: [remplir(env.textes.observation.abandon, { piece: nomDe(env.textes, piece) })], assistance: [] }
        : recitDeFin(env, jeu.partie);
    const texte: Jeu = { ...jeu, rappel: null, recit: recit.paragraphes, alertes: [], assistance: recit.assistance };
    return { issue, titre: recit.titre, jeu: texte };
  }, [env, jeu]);
  const { issue } = fin;
  const son = useSon();
  const [complet, setComplet] = useState(false);
  const ecrire = machineAEcrire && !complet && !dejaEcrit(fin.jeu);
  const completer = (): void => {
    marquerEcrit(fin.jeu);
    setComplet(true);
    son.taire();
  };
  useEffect(() => {
    annoncerTexte(son, fin.jeu, ecrire, AUCUN_SIGNAL);
  }, [son, fin, ecrire]);
  useEffect(() => {
    const fini = setTimeout(() => marquerEcrit(fin.jeu), DUREE_ECRITURE_MS);
    return () => clearTimeout(fini);
  }, [fin]);
  const titre = useRef<HTMLHeadingElement>(null);
  const zone = useRef<HTMLElement>(null);
  useEffect(() => {
    titre.current?.focus();
  }, []);
  return (
    <main className="jeu fin" onPointerDownCapture={completer} onKeyDownCapture={completer}>
      <header className="entete-piece entete-reveil">
        <p className="lieu-reveil">{LIBELLES.fin.entete}</p>
      </header>
      <section className="recit-fin" data-testid="fin">
        <h1 ref={titre} className="titre-fin" tabIndex={-1}>
          {fin.titre}
        </h1>
        <Recit jeu={fin.jeu} zone={zone} ecrire={ecrire} fixe={!machineAEcrire} terminee accent={issue === 'defaite' ? fin.jeu.recit.length - 1 : null} />
        {issue !== 'evacuation' && (
          <div className="bilan-fin">
            <p>{remplir(textes.observation.terminee, {})}</p>
          </div>
        )}
      </section>
      <div className="actions-fin">
        <button type="button" className="principal" disabled={occupe} onClick={rejouer} data-son="clic">
          {LIBELLES.fin.rejouer}
        </button>
        <button type="button" className="secondaire" disabled={occupe} onClick={nouvellePartie} data-son="clic">
          {LIBELLES.commun.nouvellePartie}
        </button>
        <div className="discrets-fin">
          {/* Un abandon ne valide pas (D-099) : pas de « je valide » après lui. */}
          {envoyerPartie !== undefined && (
            <EnvoyerMaPartie envoyer={envoyerPartie} pr={pr} validable={issue !== null && pr !== ''} empreinteCle={empreinteCle} occupe={occupe} />
          )}
          <button type="button" className="discret" disabled={occupe} onClick={menuPrincipal} data-son="clic">
            {LIBELLES.commun.menuPrincipal}
          </button>
        </div>
      </div>
    </main>
  );
}
