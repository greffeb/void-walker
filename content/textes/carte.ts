import type { CartePublique, Palier, PassageCarte, PieceCarte, RefPiece } from '../../engine';
import { former, remplir } from './gabarit';
import { nomSurPlan } from './lisibilite';
import { nomDe, nomPassage } from './rendu';
import type { TextesMonde } from './types';

// La carte en mots (14 §2) : vocabulaire fixe de l'instrument, le même dans toutes les stations, et vue LISTE, la même pour
// l'appli et la CLI (C-06 K-07). Aucun chiffre (12 §1) : l'ancienneté se dit en mots (D-151), la distance sert seulement à trier.

export const MOTS_CARTE = {
  titrePlan: 'CARTE // RELEVÉ',
  titreListe: 'CARTE // LISTE',
  liste: 'LISTE',
  plan: 'PLAN',
  fermer: 'FERMER LA CARTE',
  vousEtesIci: 'vous êtes ici',
  etatVu: '── ÉTAT VU ──',
  objetsVus: '── OBJETS VUS ──',
  rienVu: 'rien de particulier',
  aucunObjet: 'aucun objet',
  pasVisitee: 'pas encore visitée',
  libellePlan: 'Plan de la station ; vous êtes dans {le:piece}. La vue liste dit la même chose en texte.',
  libellePlanSeul: 'Plan de la station. La vue liste dit la même chose en texte.',
  ici: '@ vous',
  aBord: 'à bord :',
  feu: 'FEU',
  vide: 'VIDE ○',
  creature: 'CRÉATURE',
  droneRepere: 'drone repéré',
  blocIci: 'ICI',
  blocVisitees: 'VISITÉES, DE LA PLUS PROCHE',
  blocConnues: 'CONNUES, PAS ENCORE VISITÉES',
  aucune: 'aucune',
  parSaPorte: 'par sa porte',
  destinationInconnue: 'destination ?',
  ouvert: 'ouvert',
  ferme: 'fermé',
  air: 'AIR',
  videVoyant: 'VIDE',
} as const;

export const ANCIENNETES: Readonly<Record<Palier, string>> = { instant: 'à l’instant', moment: 'il y a un moment', longtemps: 'il y a longtemps' };

const RANG: Readonly<Record<Palier, number>> = { instant: 0, moment: 1, longtemps: 2 };

/** Une entrée de la vue LISTE : un titre et ses détails, dans l'ordre d'affichage. */
export interface EntreeListe {
  readonly titre: string;
  readonly details: readonly string[];
}

export interface BlocListe {
  readonly titre: string;
  readonly entrees: readonly EntreeListe[];
}

/** Nom d'une pièce sur la carte, en capitales (14 §2.4). */
export function nomCarte(textes: TextesMonde, piece: RefPiece): string {
  return nomSurPlan(nomDe(textes, piece).texte);
}

/** États vus d'une pièce, avec leur ancienneté (14 §2.5) : feu, vide, créature. */
export function etatsDe(piece: PieceCarte): string[] {
  return [
    ...(piece.feu === null ? [] : [`${MOTS_CARTE.feu}, vu ${ANCIENNETES[piece.feu]}`]),
    ...(piece.vide ? [MOTS_CARTE.vide] : []),
    ...(piece.creature === null ? [] : [`${MOTS_CARTE.creature}, vue ${ANCIENNETES[piece.creature]}`]),
  ];
}

/** « vu il y a un moment » pour une pièce visitée ; rien pour la pièce actuelle ni une pièce pas encore visitée. */
export function regardDe(piece: PieceCarte): string | null {
  return piece.statut === 'visitee' && piece.regard !== null ? `vu ${ANCIENNETES[piece.regard]}` : null;
}

/** Passages vus depuis une pièce. */
function passagesDe(carte: CartePublique, piece: string): PassageCarte[] {
  return carte.passages.filter((passage) => passage.vuDepuis.some((depuis) => depuis.id === piece));
}

/** Nom d'un passage vu depuis une pièce : par sa destination, l'autre pièce, quand elle est connue. */
function nomVu(textes: TextesMonde, passage: PassageCarte, depuis: string): string {
  return nomPassage(textes, passage.nom, passage.entre?.find((piece) => piece.id !== depuis) ?? null).texte;
}

function rang(palier: Palier | null): number {
  return palier === null ? 3 : RANG[palier];
}

/** Vue LISTE (14 §2.8) : ICI, les pièces visitées de la plus proche, les pièces connues pas encore visitées. */
export function rendreListeCarte(textes: TextesMonde, carte: CartePublique): BlocListe[] {
  const actuelle = carte.pieces.find((piece) => piece.statut === 'actuelle');
  const ici: EntreeListe[] = [];
  if (actuelle !== undefined) {
    ici.push({ titre: nomCarte(textes, actuelle.piece), details: [MOTS_CARTE.ici, ...(carte.aBord === null ? [] : [`${MOTS_CARTE.aBord} ${nomDe(textes, carte.aBord).texte}`]), ...etatsDe(actuelle)] });
    for (const passage of passagesDe(carte, actuelle.piece.id)) {
      ici.push({
        titre: nomVu(textes, passage, actuelle.piece.id),
        details: [
          ...(passage.entre === null ? [MOTS_CARTE.destinationInconnue] : []),
          passage.ouvert ? MOTS_CARTE.ouvert : MOTS_CARTE.ferme,
          ...(passage.voyant === null ? [] : [passage.voyant === 'air' ? MOTS_CARTE.air : MOTS_CARTE.videVoyant]),
        ],
      });
    }
    // Positions en mots, ici seulement (D-212).
    for (const { objet, position } of actuelle.objets) {
      if (position !== null) ici.push({ titre: former('Nom', nomDe(textes, objet)), details: [nomDe(textes, position).texte] });
    }
  }
  const visitees = carte.pieces
    .map((piece, ordre) => ({ piece, ordre }))
    .filter(({ piece }) => piece.statut === 'visitee')
    .sort((a, b) => (a.piece.distance ?? Infinity) - (b.piece.distance ?? Infinity) || rang(a.piece.regard) - rang(b.piece.regard) || a.ordre - b.ordre)
    .map(({ piece }): EntreeListe => {
      const regard = regardDe(piece);
      const inconnus = passagesDe(carte, piece.piece.id).filter((passage) => passage.entre === null);
      return {
        titre: nomCarte(textes, piece.piece),
        details: [
          ...(regard === null ? [] : [regard]),
          ...etatsDe(piece),
          ...inconnus.map((passage) => `${nomVu(textes, passage, piece.piece.id)} : ${MOTS_CARTE.destinationInconnue}`),
        ],
      };
    });
  const connues = carte.pieces
    .filter((piece) => piece.statut === 'connue')
    .map((piece): EntreeListe => ({ titre: nomCarte(textes, piece.piece), details: [MOTS_CARTE.parSaPorte, ...etatsDe(piece)] }));
  return [
    { titre: MOTS_CARTE.blocIci, entrees: ici },
    { titre: MOTS_CARTE.blocVisitees, entrees: visitees },
    { titre: MOTS_CARTE.blocConnues, entrees: connues },
  ];
}

/** Vue LISTE en lignes de texte, pour la CLI (14 §3.5, K-07). */
export function lignesListeCarte(blocs: readonly BlocListe[]): string[] {
  return blocs.flatMap((bloc) => [
    `── ${bloc.titre} ──`,
    ...(bloc.entrees.length === 0
      ? [MOTS_CARTE.aucune]
      : bloc.entrees.map((entree) => (entree.details.length === 0 ? entree.titre : `${entree.titre} : ${entree.details.join(' · ')}`))),
  ]);
}

/** Fiche d'une pièce (14 §2.7) : `objets` vaut `null` pour une pièce pas encore visitée. */
export interface FicheTexte {
  readonly titre: string;
  readonly sousTitre: string;
  readonly etats: readonly string[];
  readonly objets: readonly string[] | null;
}

/** Fiche d'une pièce : son nom, l'état vu et les objets vus au dernier regard, rien d'autre (D-210). */
export function ficheDe(textes: TextesMonde, piece: PieceCarte): FicheTexte {
  const titre = nomCarte(textes, piece.piece);
  const etats = etatsDe(piece);
  if (piece.statut === 'connue') return { titre, sousTitre: MOTS_CARTE.pasVisitee, etats, objets: null };
  return {
    titre,
    sousTitre: regardDe(piece) ?? MOTS_CARTE.ici,
    etats: etats.length === 0 ? [MOTS_CARTE.rienVu] : etats,
    objets: piece.objets.length === 0 ? [MOTS_CARTE.aucunObjet] : piece.objets.map(({ objet }) => `▸ ${former('Nom', nomDe(textes, objet))}`),
  };
}

/** Libellé du plan pour le lecteur d'écran (14 §2.9) : où est le passager ; la vue liste dit la même chose. */
export function libellePlan(textes: TextesMonde, carte: CartePublique): string {
  const actuelle = carte.pieces.find((piece) => piece.statut === 'actuelle');
  return actuelle === undefined ? MOTS_CARTE.libellePlanSeul : remplir(MOTS_CARTE.libellePlan, { piece: nomDe(textes, actuelle.piece) });
}

/** Nom accessible d'une pièce du plan : son nom, son statut, ses états (14 §2.9). */
export function libellePiece(textes: TextesMonde, piece: PieceCarte): string {
  const statut = piece.statut === 'actuelle' ? MOTS_CARTE.vousEtesIci : piece.statut === 'connue' ? MOTS_CARTE.pasVisitee : regardDe(piece);
  const drone = piece.statut !== 'connue' && piece.objets.some((objet) => objet.drone === true);
  return [former('Nom', nomDe(textes, piece.piece)), ...(statut === null ? [] : [statut]), ...etatsDe(piece), ...(drone ? [MOTS_CARTE.droneRepere] : [])].join(', ');
}
