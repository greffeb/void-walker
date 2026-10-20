import { palier } from './anciennete';
import { autreCote, destinationConnue, perceptible, piecesSansAir, refObjet, refPiece, refPosition, signalee, type EtatPartie } from './etat';
import { idPublic, type DefLiaison, type DefMonde } from './monde';
import { emplacementDe, entreeDeConduit, panDeCoque } from './plan';
import type { CapsuleCarte, CartePublique, DessinPassage, PassageCarte, PieceCarte, StatutPiece } from './vocabulaire';

// Carte publique (docs/14-carte.md §3.4) : seulement ce que le passager sait, géométrie comprise. La forme d'une pièce inconnue
// n'y figure jamais (K-13) ; une pièce hors de vue garde l'état de son dernier regard (D-076), sauf l'air lu sur les voyants (OP-04).

/** Pièce de la carte où se tient le passager : la sienne, ou celle qui ouvre sur sa sous-position, jamais dessinée (C-02 §2). */
function pieceDeCarte(monde: DefMonde, piece: string): string {
  if (monde.pieces.find((candidate) => candidate.id === piece)?.sousPosition !== true) return piece;
  const acces = monde.liaisons.find((liaison) => liaison.entre.includes(piece));
  return acces === undefined ? piece : autreCote(acces, piece);
}

/** Grille, conduit étroit, panneau, passage sans signalétique, vide de passerelle : ouverture en tirets ; sinon une porte (14 §2.6). */
function dessinDe(liaison: DefLiaison): DessinPassage {
  return liaison.etroite === true || liaison.nonEtanche === true || liaison.gouffre === true || !signalee(liaison) ? 'tirets' : 'porte';
}

/** Nombre de passages connus depuis la pièce de départ, en largeur. */
function distances(depart: string, aretes: readonly (readonly [string, string])[]): Map<string, number> {
  const resultat = new Map([[depart, 0]]);
  const file = [depart];
  for (let piece = file.shift(); piece !== undefined; piece = file.shift()) {
    const suivante = (resultat.get(piece) ?? 0) + 1;
    for (const [a, b] of aretes) {
      const voisine = a === piece ? b : b === piece ? a : undefined;
      if (voisine === undefined || resultat.has(voisine)) continue;
      resultat.set(voisine, suivante);
      file.push(voisine);
    }
  }
  return resultat;
}

export function carte(monde: DefMonde, etat: EtatPartie): CartePublique {
  const sousPositions = new Set(monde.pieces.filter((piece) => piece.sousPosition === true).map((piece) => piece.id));
  const ici = pieceDeCarte(monde, etat.piece);
  const visitees = monde.pieces.filter((piece) => !sousPositions.has(piece.id) && (piece.id === ici || etat.visitees.includes(piece.id))).map((piece) => piece.id);
  // Passages perçus depuis une pièce visitée (14 §3.3) ; ceux d'une sous-position ne se dessinent jamais.
  const vus = monde.liaisons.flatMap((liaison) => {
    if (liaison.entre.some((piece) => sousPositions.has(piece))) return [];
    // Un passage caché ne se distingue pas d'un panneau ordinaire avant sa découverte, même de son côté visible (14 §2.6, AR-01 §11.1).
    if (liaison.cachee !== undefined && !etat.decouvertes.includes(liaison.id)) return [];
    const depuis = visitees.filter((piece) => liaison.entre.includes(piece) && perceptible(etat, liaison, piece));
    return depuis.length === 0 ? [] : [{ liaison, depuis, connue: destinationConnue(etat, liaison) }];
  });
  const connues = new Set(visitees);
  for (const { liaison, connue } of vus) if (connue) for (const piece of liaison.entre) connues.add(piece);
  const sansAir = piecesSansAir(monde, etat);
  // Une station qui peut perdre son air (un vitrage extérieur) porte des voyants sur ses portes étanches (OP-04, VP-03).
  const voyants = monde.objets.some((objet) => objet.vitrageExterieur === true);
  const avecVoyant = (liaison: DefLiaison, connue: boolean): boolean => voyants && connue && liaison.nonEtanche !== true && liaison.gouffre !== true;
  const passages = vus.map(({ liaison, depuis, connue }): PassageCarte => {
    const [premiere] = depuis;
    // Le voyant dit l'air de la pièce d'en face (VP-03), lu depuis la pièce actuelle, ou sinon depuis la première pièce visitée d'où on l'a vu.
    const lecture = liaison.entre.includes(ici) ? ici : premiere;
    const enFace = lecture === undefined ? undefined : autreCote(liaison, lecture);
    const conduitInconnu = !connue && premiere !== undefined && liaison.plan?.trace !== undefined;
    return {
      id: idPublic(monde.id, liaison.id),
      nom: liaison.nom,
      vuDepuis: depuis.map((piece) => refPiece(monde, piece)),
      entre: connue ? [refPiece(monde, liaison.entre[0]), refPiece(monde, liaison.entre[1])] : null,
      // Chaque pièce visitée a eu son regard : la liaison a été vue. À défaut, fermée : rien n'en dit plus.
      ouvert: etat.memoire.liaisons[liaison.id] ?? false,
      dessin: dessinDe(liaison),
      voyant: avecVoyant(liaison, connue) && enFace !== undefined ? (sansAir.includes(enFace) ? 'vide' : 'air') : null,
      emplacement: conduitInconnu ? entreeDeConduit(monde, liaison, premiere) : emplacementDe(monde, liaison),
    };
  });
  const parcours = distances(
    ici,
    vus.filter(({ connue }) => connue).map(({ liaison }) => liaison.entre),
  );
  const luSurVoyant = new Set(vus.filter(({ liaison, connue }) => avecVoyant(liaison, connue)).flatMap(({ liaison }) => liaison.entre));
  const vue = etat.reperes.vue;
  const pieces = monde.pieces
    .filter((piece) => connues.has(piece.id))
    .map((piece): PieceCarte => {
      const souvenir = etat.memoire.pieces[piece.id];
      const statut: StatutPiece = piece.id === ici ? 'actuelle' : visitees.includes(piece.id) ? 'visitee' : 'connue';
      return {
        piece: refPiece(monde, piece.id),
        statut,
        rect: piece.plan ?? null,
        regard: souvenir?.regard === undefined ? null : palier(etat.actions - souvenir.regard),
        feu: souvenir?.feu?.vu === true ? palier(etat.actions - souvenir.feu.actions) : null,
        vide: sansAir.includes(piece.id) && (piece.id === ici || luSurVoyant.has(piece.id)),
        creature: vue !== null && vue.piece === piece.id ? palier(vue.depuis) : null,
        objets: (souvenir?.objets ?? []).map(({ objet, position }) => ({
          objet: refObjet(monde, objet),
          position: position === undefined ? null : refPosition(monde, position),
          ...(monde.objets.some((definition) => definition.id === objet && definition.drone !== undefined) ? { drone: true as const } : {}),
        })),
        distance: parcours.get(piece.id) ?? null,
      };
    });
  const capsules = monde.objets.flatMap((objet): CapsuleCarte[] => {
    if (objet.capsule === undefined || !visitees.includes(objet.piece)) return [];
    const pan = panDeCoque(monde, objet.piece);
    return pan === null ? [] : [{ objet: refObjet(monde, objet.id), piece: refPiece(monde, objet.piece), pan }];
  });
  return { pieces, passages, capsules, aBord: etat.piece === ici ? null : refPiece(monde, etat.piece) };
}
