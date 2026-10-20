import { IDBFactory } from 'fake-indexeddb';
import { commencer, charger, jouerOption, type Environnement } from '../app/jeu';
import { stockageIndexedDB } from '../app/sauvegarde';
import { exporter, jouer, nouvellePartie, observer, rejouer, validerMonde } from '../engine';
import { fuitesDeCouches, libellePiece, MORCEAUX_TEXTES } from '../content';
import { PARCOURS_REPARATION_M12 } from '../content/m-12/parcours';
import { CATALOGUE } from './catalogue';
import { executerParcours, trouverOption } from './rejouer-parcours';
import { chercherEvacuation } from './verifier-sortie';
import { cleEtatRegles, cloisonsDuCarrefour, verifierStation } from './verifier-station';

const entree = CATALOGUE.mondes['m-12'];
if (entree === undefined) throw new Error('Station d’essai M12 absente.');
const { monde, textes } = entree;

describe('M12 assemblé et joué par les surfaces réelles', () => {
  it('références préfixées, six pièces de chemin et réserve ouverte, textes neutres', () => {
    expect(validerMonde(monde)).toEqual([]);
    expect(monde.pieces.filter((piece) => piece.id.startsWith('m-12/'))).toHaveLength(6);
    expect(monde.creature?.piece).toBe('m-12/p-stockage');
    expect(monde.liaisons.find((liaison) => liaison.id === 'm-12/l-poste-reserve')?.ouverte).toBe(true);
    expect(monde.objets.find((objet) => objet.drone !== undefined)?.drone).toEqual({ rail: 'm-12/l-atelier-poste', poignee: 'm-12/o-poignee' });
    expect(monde.objets.find((objet) => objet.obstacle !== undefined)?.obstacle).toEqual({
      passage: 'm-12/l-palier-quai', rangement: 'm-12/pos-rangement', maintien: 'm-12/o-poignee',
    });
    expect(fuitesDeCouches(MORCEAUX_TEXTES)).toEqual([]);
    expect(Object.values(textes.descriptions).every((variantes) => variantes.length >= 2)).toBe(true);
  });

  it('les deux témoins se rejouent : préparation indemne et réparation suivie d’une véritable évacuation', () => {
    for (const parcours of entree.parcours) {
      const rapport = executerParcours(entree, parcours, 'm12-temoin');
      expect(rapport.erreurs, parcours.nom).toEqual([]);
    }
    expect(verifierStation(entree).verdict).toBe('prouvee');
  });

  it('sauvegarde IndexedDB après chaque geste, reprise à chaque phase et export avec dés enregistrés', async () => {
    const fabrique = new IDBFactory();
    const env: Environnement = { monde, textes, version: 'm12-sauvegarde', graine: () => 203, stockage: stockageIndexedDB('drone', fabrique) };
    let jeu = await commencer(env);
    for (const etape of PARCOURS_REPARATION_M12.etapes) {
      const option = trouverOption(observer(monde, jeu.partie.etat), etape);
      if (option === undefined) throw new Error(`Option absente : ${etape.action}.`);
      jeu = await jouerOption(env, jeu, option);
      expect(jeu.sauvegarde).toBe('sauvegardee');
      const reprise = await charger({ ...env, stockage: stockageIndexedDB('drone', fabrique) });
      expect(reprise.type).toBe('pret');
      if (reprise.type !== 'pret') throw new Error('Reprise refusée.');
      expect(reprise.jeu.partie).toEqual(jeu.partie);
      expect(reprise.jeu.recit).toEqual(jeu.recit);
      if (['replacer', 'rearmer'].includes(etape.action)) {
        expect(chercherEvacuation(monde, jeu.partie.etat, { elague: true }).verdict).toBe('evacuation');
      }
    }
    expect(jeu.partie.etat).toMatchObject({ fin: 'evacuation', sante: 'critique', actions: 20 });
    expect(jeu.partie.enregistrement.actions.flatMap((action) => action.tirages)).toHaveLength(2);
    expect(rejouer(monde, exporter(monde, jeu.partie), env.version).partie).toEqual(jeu.partie);
  });

  it('le libellé accessible désigne seulement un drone mémorisé, jamais un GPS', () => {
    const vue = observer(monde, nouvellePartie(monde, { version: 'carte', graine: 203 }).etat);
    const atelier = vue.carte.pieces.find((piece) => piece.statut === 'actuelle');
    const poste = vue.carte.pieces.find((piece) => piece.piece.nom === 'poste_drone');
    if (atelier === undefined || poste === undefined) throw new Error('Carte incomplète.');
    expect(libellePiece(textes, atelier)).toContain('drone repéré');
    expect(libellePiece(textes, poste)).not.toContain('drone repéré');
    expect(libellePiece(textes, { ...atelier, statut: 'connue' })).not.toContain('drone repéré');
  });

  it('les clés de solveur ignorent toujours les engagements, sans compteur ajouté au drone', () => {
    const etat = nouvellePartie(monde, { version: 'cle', graine: 203 }).etat;
    expect(cleEtatRegles(etat)).toBe(cleEtatRegles({ ...etat, actions: 1000000 }));
    expect(Object.keys(etat.drones ?? {})).toEqual(['phases', 'tenue', 'bruits']);
  });

  it('le drone qui termine sa tâche hors de vue n’est pas raconté (C-06 §5)', () => {
    type Etape = { readonly action: string; readonly cible: string; readonly parametre?: string };
    const nom = (ref: { readonly nom: string; readonly vers?: { readonly nom: string } | null } | undefined): string | undefined =>
      ref === undefined ? undefined : 'vers' in ref && ref.vers !== null && ref.vers !== undefined ? ref.vers.nom : ref.nom;
    let partie = nouvellePartie(monde, { version: 'hors-de-vue', graine: 5 });
    const jouerEtape = ({ action, cible, parametre }: Etape): readonly string[] => {
      const option = observer(monde, partie.etat).menu.find(
        (candidate) => candidate.disponible && candidate.action === action && nom(candidate.cible) === cible && (parametre === undefined || candidate.parametre?.nom === parametre),
      );
      if (option === undefined) throw new Error(`Option absente : ${action} ${cible}.`);
      const resultat = jouer(monde, partie, option.commande);
      if (resultat.type !== 'engagee') throw new Error(`${action} non engagée.`);
      partie = resultat.partie;
      return resultat.evenements.map((evenement) => evenement.type);
    };
    for (const etape of [
      { action: 'aller', cible: 'poste_drone' },
      { action: 'fermer', cible: 'stockage' },
      { action: 'fermer', cible: 'palier_chariot' },
      { action: 'aller', cible: 'atelier_drone' },
      { action: 'envoyer', cible: 'drone' },
      { action: 'aller', cible: 'galerie_drone' },
      { action: 'aller', cible: 'palier_chariot' },
    ]) jouerEtape(etape);
    const evenements = jouerEtape({ action: 'deplacer', cible: 'chariot', parametre: 'dans_rangement' });
    expect(evenements).toContain('objet_deplace');
    expect(evenements).not.toContain('drone_termine');
    expect(partie.etat.drones?.phases['m-12/o-drone']).toBe('termine');
  });

  it('M11/M12 en ordre libre conserve le blindage, la carte exigée et seulement les cloisons du carrefour', () => {
    const station = CATALOGUE.construire('ol-m11-m12-m06-stockage', 2718281828);
    if ('refus' in station) throw new Error(station.refus);
    expect(validerMonde(station.monde)).toEqual([]);
    expect(cloisonsDuCarrefour(station.monde)).toHaveLength(2);
    expect(station.monde.liaisons.some((liaison) => liaison.blindee === true)).toBe(true);
    const lecteur = station.monde.objets.find((objet) => objet.exige !== undefined);
    expect(lecteur?.exige?.startsWith('m-11/')).toBe(true);
    expect(station.monde.objets.some((objet) => objet.id === lecteur?.exige)).toBe(true);
  });
});
