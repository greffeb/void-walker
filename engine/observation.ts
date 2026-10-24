import { CATALOGUE } from './actions';
import { range } from './drone';
import {
  assourdie,
  chambreFroide,
  corpsIci,
  creatureEnVue,
  enFeu,
  liaisonsVisibles,
  objetsDans,
  objetsPortes,
  piecesSansAir,
  pontsBrises,
  pontsDe,
  protectionEnfilee,
  refObjet,
  refPassage,
  refPiece,
  refPosition,
  sansGravite,
  type EtatPartie,
} from './etat';
import { carte, pieceDeCarte } from './carte';
import { indexer, type DefMonde } from './monde';
import { sortiePossible } from './sortie';
import { camerasLues, salleDeSurveillance } from './surveillance';
import { rangSigne, signePublic } from './signes';
import {
  ACTIONS,
  RAISONS_INDISPONIBILITE,
  type Cible,
  type MessageRecu,
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

/** Messages d'assistance reçus, dans l'ordre, avec le moment prévu de chacun : un message n'arrive qu'une fois (D-081). */
export function historique(monde: DefMonde, etat: EtatPartie): MessageRecu[] {
  return etat.messages.map((message) => {
    // Un message d'IA Station sur la face 2 rend le fait signalé, à son rang dans `etat.signes` (lot 4).
    const rang = rangSigne(message);
    const signe = rang === null ? undefined : etat.signes?.[rang - 1];
    if (signe !== undefined) return { message, moment: { type: 'signe' }, signe: signePublic(monde, signe) };
    const quand = (monde.assistance ?? []).find((def) => def.id === message)?.quand;
    if (quand === undefined) throw new Error(`Message d'assistance inconnu : ${message}.`);
    if (quand.type === 'evacuation' || quand.type === 'patience') return { message, moment: quand };
    return { message, moment: { type: quand.type, piece: refPiece(monde, quand.type === 'reveil' ? monde.depart : quand.piece) } };
  });
}

/** Observation publique (C-06) : ne contient que des identifiants publics et des clés de nom. */
export function observer(monde: DefMonde, etat: EtatPartie): Observation {
  const ici = objetsDans(monde, etat, etat.piece);
  // Un pont posé en travers d'un vide de la pièce se voit et se reprend de ses deux bords (D-164).
  const visibles = [...ici, ...pontsDe(monde, etat, etat.piece)];
  const protection = protectionEnfilee(monde, etat);
  const piece = indexer(monde).pieces.get(etat.piece);
  return {
    ...(etat.drones === undefined ? {} : {
      drones: ici.flatMap((objet) => {
        const phase = etat.drones?.phases[objet.id];
        return phase === undefined ? [] : [{ objet: refObjet(monde, objet.id), phase }];
      }),
    }),
    // Connecté, dans la salle ou une de ses sous-positions, le passager voit les caméras en direct (lot 4).
    ...(etat.connecte === true && pieceDeCarte(monde, etat.piece) === salleDeSurveillance(monde)
      ? { cameras: camerasLues(monde, etat).map((camera) => ({ piece: refPiece(monde, camera.piece), etat: camera.etat })) }
      : {}),
    piece: refPiece(monde, etat.piece),
    objets: visibles.map((objet) => refObjet(monde, objet.id)),
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
    sansAir: piecesSansAir(monde, etat).includes(etat.piece),
    enfilee: protection === undefined ? null : refObjet(monde, protection.id),
    percees: ici.filter((objet) => etat.breches.includes(objet.id)).map((objet) => refObjet(monde, objet.id)),
    rebouchees: ici.filter((objet) => etat.rebouchees.includes(objet.id)).map((objet) => refObjet(monde, objet.id)),
    creatureInerte: corpsIci(etat),
    creatureRalentie: creatureEnVue(etat) && etat.creature?.ralentie !== undefined,
    creatureEngourdie: creatureEnVue(etat) && etat.creature?.ralentie?.saute === true,
    ponts: pontsDe(monde, etat, etat.piece).flatMap((pont) => {
      const emplacement = etat.objets[pont.id];
      const liaison = emplacement?.type === 'pont' ? indexer(monde).liaisons.get(emplacement.liaison) : undefined;
      return liaison === undefined ? [] : [{ objet: refObjet(monde, pont.id), passage: refPassage(monde, etat, liaison, etat.piece) }];
    }),
    pontsBrises: pontsBrises(monde, etat, etat.piece).flatMap((pont) => {
      const emplacement = etat.objets[pont.id];
      const liaison = emplacement?.type === 'perdu' ? indexer(monde).liaisons.get(emplacement.liaison) : undefined;
      return liaison === undefined ? [] : [{ objet: refObjet(monde, pont.id), passage: refPassage(monde, etat, liaison, etat.piece) }];
    }),
    machines: piece?.machines === true ? (assourdie(monde, etat, etat.piece) ? 'marche' : 'arret') : null,
    gravite: piece?.gravite === undefined ? null : sansGravite(etat, etat.piece) ? 'coupee' : 'retablie',
    froid: chambreFroide(monde, etat.piece),
    sante: etat.sante,
    terminee: terminee(etat),
    issue: etat.fin ?? (etat.sante === 'vaincu' ? 'defaite' : null),
    sansSortie: !sortiePossible(monde, etat),
    messages: etat.messages,
    menu: menu(monde, etat),
    carte: carte(monde, etat),
  };
}
