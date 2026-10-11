import { CATALOGUE } from './actions';
import { creatureEnVue, enFeu, liaisonsVisibles, objetsDans, objetsPortes, refObjet, refPassage, refPiece, refPosition, type EtatPartie } from './etat';
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
  if (index.positions.has(id)) return refPosition(monde, id);
  const liaison = index.liaisons.get(id);
  if (liaison === undefined) throw new Error(`Cible inconnue : ${id}.`);
  return refPassage(monde, etat, liaison, etat.piece);
}

/** Partie conclue : défaite (D-013) ou évacuation. */
export function terminee(etat: EtatPartie): boolean {
  return etat.sante === 'vaincu' || etat.fin !== null;
}

export function menu(monde: DefMonde, etat: EtatPartie): OptionMenu[] {
  if (terminee(etat)) return [];
  const options: OptionMenu[] = [];
  for (const action of ACTIONS) {
    const definition = CATALOGUE[action];
    for (const id of definition.cibles({ monde, etat })) {
      const cible = cibleVisible(monde, etat, id);
      const raison = definition.verifier({ monde, etat }, id);
      if (raison !== null && !estIndisponibilite(raison)) {
        throw new Error(`Option ${action} proposée avec un refus non affichable : ${raison}.`);
      }
      const dispo = raison === null ? { disponible: true } : { disponible: false, raison };
      const parametres = definition.engage ? definition.parametres?.({ monde, etat }, id) : undefined;
      if (parametres === undefined) {
        options.push({ action, cible, commande: { action, cible: cible.id }, ...dispo });
        continue;
      }
      for (const parametre of parametres) {
        const vise = cibleVisible(monde, etat, parametre);
        if (vise.sorte === 'objet') throw new Error(`Paramètre objet non pris en charge : ${parametre}.`);
        options.push({ action, cible, commande: { action, cible: cible.id, parametre: vise.id }, ...dispo, parametre: vise });
      }
    }
  }
  return options;
}

/** Observation publique (C-06) : ne contient que des identifiants publics et des clés de nom. */
export function observer(monde: DefMonde, etat: EtatPartie): Observation {
  const ici = objetsDans(monde, etat, etat.piece);
  return {
    piece: refPiece(monde, etat.piece),
    objets: ici.map((objet) => refObjet(monde, objet.id)),
    placements: ici.flatMap((objet) => {
      const emplacement = etat.objets[objet.id];
      return emplacement?.type === 'piece' && emplacement.position !== undefined
        ? [{ objet: refObjet(monde, objet.id), position: refPosition(monde, emplacement.position) }]
        : [];
    }),
    installes: monde.objets.flatMap((objet) => {
      const emplacement = etat.objets[objet.id];
      return emplacement?.type === 'installe' && ici.some((capsule) => capsule.id === emplacement.dans)
        ? [{ objet: refObjet(monde, objet.id), capsule: refObjet(monde, emplacement.dans) }]
        : [];
    }),
    actives: ici.filter((objet) => etat.actives.includes(objet.id)).map((objet) => refObjet(monde, objet.id)),
    passages: liaisonsVisibles(monde, etat, etat.piece).map((liaison) => refPassage(monde, etat, liaison, etat.piece)),
    inventaire: objetsPortes(monde, etat).map((objet) => refObjet(monde, objet.id)),
    visitees: etat.visitees.map((piece) => refPiece(monde, piece)),
    actions: etat.actions,
    creatureVisible: creatureEnVue(etat),
    creatureATerre: creatureEnVue(etat) && (etat.creature?.perdues ?? 0) > 0,
    feu: enFeu(etat, etat.piece),
    sante: etat.sante,
    terminee: terminee(etat),
    issue: etat.fin ?? (etat.sante === 'vaincu' ? 'defaite' : null),
    messages: etat.messages,
    menu: menu(monde, etat),
  };
}
