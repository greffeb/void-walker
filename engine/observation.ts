import { CATALOGUE } from './actions';
import { liaisonsDe, objetsDans, objetsPortes, refObjet, refPassage, refPiece, type EtatPartie } from './etat';
import { indexer, type DefMonde } from './monde';
import {
  ACTIONS,
  RAISONS_INDISPONIBILITE,
  type Cible,
  type Observation,
  type OptionMenu,
  type RaisonIndisponibilite,
  type RaisonRefus,
} from './vocabulaire';

function estIndisponibilite(raison: RaisonRefus): raison is RaisonIndisponibilite {
  return (RAISONS_INDISPONIBILITE as readonly string[]).includes(raison);
}

function cibleVisible(monde: DefMonde, etat: EtatPartie, id: string): Cible {
  const index = indexer(monde);
  if (index.pieces.has(id)) return refPiece(monde, id);
  if (index.objets.has(id)) return refObjet(monde, id);
  const liaison = index.liaisons.get(id);
  if (liaison === undefined) throw new Error(`Cible inconnue : ${id}.`);
  return refPassage(monde, etat, liaison, etat.piece);
}

export function menu(monde: DefMonde, etat: EtatPartie): OptionMenu[] {
  if (etat.sante === 'vaincu') return [];
  const options: OptionMenu[] = [];
  for (const action of ACTIONS) {
    const definition = CATALOGUE[action];
    for (const id of definition.cibles({ monde, etat })) {
      const cible = cibleVisible(monde, etat, id);
      const raison = definition.verifier({ monde, etat }, id);
      if (raison !== null && !estIndisponibilite(raison)) {
        throw new Error(`Option ${action} proposée avec un refus non affichable : ${raison}.`);
      }
      const commande = { action, cible: cible.id };
      options.push(raison === null ? { action, cible, commande, disponible: true } : { action, cible, commande, disponible: false, raison });
    }
  }
  return options;
}

/** Observation publique (C-06) : ne contient que des identifiants publics et des clés de nom. */
export function observer(monde: DefMonde, etat: EtatPartie): Observation {
  return {
    piece: refPiece(monde, etat.piece),
    objets: objetsDans(monde, etat, etat.piece).map((objet) => refObjet(monde, objet.id)),
    passages: liaisonsDe(monde, etat.piece).map((liaison) => refPassage(monde, etat, liaison, etat.piece)),
    inventaire: objetsPortes(monde, etat).map((objet) => refObjet(monde, objet.id)),
    visitees: etat.visitees.map((piece) => refPiece(monde, piece)),
    actions: etat.actions,
    creatureVisible: etat.creature !== null && etat.creature.piece === etat.piece,
    sante: etat.sante,
    terminee: etat.sante === 'vaincu',
    menu: menu(monde, etat),
  };
}
