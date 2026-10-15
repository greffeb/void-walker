import type { Assembleur, DefAssistance, DefMonde, DefMorceau, DefStation } from '../../engine';
import { MONDE_AR01 } from '../ar-01/monde';
import { PARCOURS_AR01 } from '../ar-01/parcours';
import { TEXTES_AR01 } from '../ar-01/textes';
import { MONDE_AR02 } from '../ar-02/monde';
import { PARCOURS_AR02 } from '../ar-02/parcours';
import { TEXTES_AR02 } from '../ar-02/textes';
import { PARCOURS_M07 } from '../m-07/parcours';
import { MESSAGES_M07 } from '../m-07/textes';
import { MONDE_M08 } from '../m-08/monde';
import { PARCOURS_M08 } from '../m-08/parcours';
import { TEXTES_M08 } from '../m-08/textes';
import { MONDE_M09 } from '../m-09/monde';
import { PARCOURS_M09 } from '../m-09/parcours';
import { TEXTES_M09 } from '../m-09/textes';
import { PARCOURS_M10 } from '../m-10/parcours';
import { MESSAGES_M10 } from '../m-10/textes';
import { MONDE_TEST } from '../monde-test/monde';
import { PARCOURS_MONDE_TEST } from '../monde-test/parcours';
import { TEXTES_MONDE_TEST } from '../monde-test/textes';
import { MORCEAUX, type EntreeMorceau } from '../morceaux';
import { MORCEAU_ESSAI, TEXTES_MORCEAU_ESSAI } from '../morceaux/essai';
import { MORCEAU_M07, TEXTES_MORCEAU_M07 } from '../morceaux/m-07';
import { MORCEAU_M10, TEXTES_MORCEAU_M10 } from '../morceaux/m-10';
import { MORCEAU_VESTIBULE, TEXTES_MORCEAU_VESTIBULE } from '../morceaux/vestibule';
import { reunir } from '../textes/couches';
import type { Nom, Variantes } from '../textes/types';
import { ASSISTANCE_STATION } from '../textes/univers';
import type { EntreeMonde } from '../types';
import { PAIRES, type LignePaire } from './paires';

// Catalogue des mondes jouables (#152) : les mondes écrits en entier, et les stations assemblées depuis les morceaux. Le
// contenu n'importe que les types du moteur (docs/10-architecture.md §3) : l'assembleur lui est donné.

const REFERENCES: Readonly<Record<string, EntreeMonde>> = {
  [MONDE_AR01.id]: { monde: MONDE_AR01, textes: TEXTES_AR01, parcours: PARCOURS_AR01 },
  [MONDE_AR02.id]: { monde: MONDE_AR02, textes: TEXTES_AR02, parcours: PARCOURS_AR02 },
  [MONDE_TEST.id]: { monde: MONDE_TEST, textes: TEXTES_MONDE_TEST, parcours: [PARCOURS_MONDE_TEST] },
};

// Stations de test des nouveaux morceaux (#105) encore écrites en entier, avec les parcours de leur fiche.
const STATIONS_ECRITES: Readonly<Record<string, EntreeMonde>> = {
  [MONDE_M08.id]: { monde: MONDE_M08, textes: TEXTES_M08, parcours: PARCOURS_M08 },
  [MONDE_M09.id]: { monde: MONDE_M09, textes: TEXTES_M09, parcours: PARCOURS_M09 },
};

/** Mondes écrits en entier, sans assemblage. */
export const MONDES: Readonly<Record<string, EntreeMonde>> = { ...REFERENCES, ...STATIONS_ECRITES };

export interface Refus {
  readonly refus: string;
}

/** Vestibule, un morceau de chemin, un final et la place de la créature dans l'un des deux (13 §7.1, D-161). */
export interface Composition {
  /** `<chemin>-<final>-<place>`, ex. 'm07-m03-soute'. */
  readonly id: string;
  readonly chemin: string;
  readonly final: string;
  /** Pièce préfixée, ex. 'm-07/p-soute'. */
  readonly creature: string;
  /** Motif de la table des paires, avant tout plan ; `null` si la paire est permise. */
  readonly refus: string | null;
}

/** Compositions dont toutes les graines sont prouvées, seules proposées au joueur. */
export const COMPOSITIONS_PUBLIEES: readonly string[] = ['m07-m03-reserve', 'm07-m03-soute', 'm10-m03-entrepot', 'm10-m03-reserve'];

export interface Catalogue {
  /** AR-01, AR-02, monde de test, m-07 à m-10 ; m-07 et m-10 assemblés. */
  readonly mondes: Readonly<Record<string, EntreeMonde>>;
  /** Toutes les compositions possibles : chaque chemin × chaque final × chaque place de ces deux morceaux, triées. */
  readonly compositions: readonly Composition[];
  /** Station `<composition>-<graine>`, publiée ou non ; refusée si la table la refuse, si la graine est invalide ou sans plan. */
  construire(composition: string, graine: number): EntreeMonde | Refus;
  /** Monde fixe, ou station exacte `<composition>-<graine>` d'une composition publiée. */
  resoudre(id: string): EntreeMonde | Refus;
  /**
   * Final à pile ou face parmi les finals publiés, composition publiée au hasard, graine du plan, dans cet ordre ;
   * `composition` force la composition. `hasard()` rend un entier de 0 à 4294967295.
   */
  tirer(hasard: () => number, composition?: string): EntreeMonde | Refus;
}

const AU_REVEIL: readonly DefAssistance[] = [
  { id: 'capsule', quand: { type: 'reveil' } },
  { id: 'presence', quand: { type: 'reveil' } },
];

// Stations de test M-07 et M-10 : le morceau, puis l'embarquement d'essai ; seule la sortie de M-07 est ouverte au départ.
const STATION_M07: DefStation = { id: 'm-07', morceaux: [MORCEAU_M07, MORCEAU_ESSAI], creature: 'm-07/p-soute', graine: 1, sortiesOuvertes: ['m-07'], assistance: AU_REVEIL };
const STATION_M10: DefStation = { id: 'm-10', morceaux: [MORCEAU_M10, MORCEAU_ESSAI], creature: 'm-10/p-entrepot', graine: 1, assistance: AU_REVEIL };

// Station tirée : le réveil et le départ ; pas de message de présence, qui nommerait la place tirée.
const ASSISTANCE_TIREE: readonly DefAssistance[] = [
  { id: 'reveil', quand: { type: 'reveil' } },
  { id: 'depart', quand: { type: 'evacuation' } },
];

/** Celle du moteur (`engine/des.ts`), que le contenu ne peut pas importer. */
const GRAINE_MAX = 0xffffffff;
const ESSAIS_PLAN = 50;
/** Forme d'un monde que le service de rapports accepte (`report-service/src/rapport.ts`). */
const FORME_ID = /^[a-z0-9-]{1,40}$/;
const GRAINE_ECRITE = /^(0|[1-9][0-9]*)$/;
const MAL_FORME = 'identifiant mal formé (minuscules, chiffres et tirets, 40 caractères au plus)';

const graineValide = (graine: number): boolean => Number.isInteger(graine) && graine >= 0 && graine <= GRAINE_MAX;

/** Numéro du morceau dans la table des paires : 'm-07' → 'M-07'. */
const numero = (morceau: DefMorceau): string => morceau.id.toUpperCase();

function motifDeTable(table: readonly LignePaire[], x: DefMorceau, y: DefMorceau): string | null {
  const [a, b] = numero(x) < numero(y) ? [numero(x), numero(y)] : [numero(y), numero(x)];
  const ligne = table.find((candidate) => candidate.a === a && candidate.b === b);
  if (ligne === undefined) return `Paire ${a} + ${b} absente de la table : refusée par défaut.`;
  return ligne.verdict === 'jamais' ? `Paire ${a} + ${b} jamais ensemble : ${ligne.regle}.` : null;
}

interface Prevue {
  readonly composition: Composition;
  readonly chemin: EntreeMorceau;
  readonly final: EntreeMorceau;
}

/** Le vestibule en tête ; l'embarquement d'essai n'est le final d'aucune composition. */
function prevoir(table: readonly LignePaire[]): Prevue[] {
  const entrees = Object.values(MORCEAUX);
  const chemins = entrees.filter(({ morceau }) => morceau.famille === 'chemin');
  const finals = entrees.filter(({ morceau }) => morceau.famille === 'final' && morceau.id !== MORCEAU_ESSAI.id);
  const court = (morceau: DefMorceau): string => morceau.id.replaceAll('-', '');
  const prevues = chemins.flatMap((chemin) =>
    finals.flatMap((final) => {
      const refus = motifDeTable(table, chemin.morceau, final.morceau);
      return [chemin.morceau, final.morceau].flatMap((morceau) =>
        morceau.placesCreature.map((place): Prevue => {
          const nom = morceau.pieces.find((piece) => piece.id === place)?.nom ?? place;
          const id = `${court(chemin.morceau)}-${court(final.morceau)}-${nom}`;
          return { composition: { id, chemin: chemin.morceau.id, final: final.morceau.id, creature: `${morceau.id}/${place}`, refus }, chemin, final };
        }),
      );
    }),
  );
  return prevues.sort((x, y) => (x.composition.id < y.composition.id ? -1 : 1));
}

/**
 * Pièces du même nom désignées par une lettre dans toute la station, dans l'ordre des pièces (D-208) : `coursive` →
 * `coursive_a`, « coursive A ». Pas de chiffre : la carte et l'écran de fin n'en affichent aucun.
 */
export function numeroter(entree: EntreeMonde): EntreeMonde {
  const { monde, textes } = entree;
  const total = new Map<string, number>();
  for (const { nom } of monde.pieces) total.set(nom, (total.get(nom) ?? 0) + 1);
  if (monde.pieces.every(({ nom }) => total.get(nom) === 1)) return entree;
  const noms: Record<string, Nom> = { ...textes.noms };
  const descriptions: Record<string, Variantes> = { ...textes.descriptions };
  const rangs = new Map<string, number>();
  const pieces = monde.pieces.map((piece) => {
    if (total.get(piece.nom) === 1) return piece;
    const rang = rangs.get(piece.nom) ?? 0;
    rangs.set(piece.nom, rang + 1);
    const lettre = String.fromCharCode('A'.charCodeAt(0) + rang);
    const cle = `${piece.nom}_${lettre.toLowerCase()}`;
    const nom = Object.hasOwn(textes.noms, piece.nom) ? textes.noms[piece.nom] : undefined;
    if (nom !== undefined) noms[cle] = { ...nom, texte: `${nom.texte} ${lettre}` };
    const description = Object.hasOwn(textes.descriptions, piece.nom) ? textes.descriptions[piece.nom] : undefined;
    if (description !== undefined) descriptions[cle] = description;
    return { ...piece, nom: cle };
  });
  return { ...entree, monde: { ...monde, pieces }, textes: { ...textes, noms, descriptions } };
}

export function creerCatalogue(
  assembler: Assembleur,
  table: readonly LignePaire[] = PAIRES,
  publiees: readonly string[] = COMPOSITIONS_PUBLIEES,
): Catalogue {
  const assemblee = (station: DefStation): DefMonde => {
    const resultat = assembler(station);
    if (resultat.type === 'station') return resultat.monde;
    const detail = resultat.type === 'invalide' ? ` : ${resultat.erreurs.join(' ')}` : '.';
    throw new Error(`Station de test ${station.id} non assemblée (${resultat.type})${detail}`);
  };
  const mondes: Readonly<Record<string, EntreeMonde>> = {
    ...REFERENCES,
    [STATION_M07.id]: { monde: assemblee(STATION_M07), textes: reunir([TEXTES_MORCEAU_M07, TEXTES_MORCEAU_ESSAI], MESSAGES_M07), parcours: PARCOURS_M07 },
    ...STATIONS_ECRITES,
    [STATION_M10.id]: { monde: assemblee(STATION_M10), textes: reunir([TEXTES_MORCEAU_M10, TEXTES_MORCEAU_ESSAI], MESSAGES_M10), parcours: PARCOURS_M10 },
  };

  const prevues = prevoir(table);
  const parId = new Map(prevues.map((prevue) => [prevue.composition.id, prevue]));
  const proposees = new Set(publiees);
  // Par identifiant de station ; `null` : pas de plan pour cette graine.
  const memoire = new Map<string, EntreeMonde | Refus | null>();

  const assemblerPrevue = ({ composition, chemin, final }: Prevue, graine: number): EntreeMonde | Refus | null => {
    const id = `${composition.id}-${graine}`;
    if (memoire.has(id)) return memoire.get(id) ?? null;
    const station: DefStation = {
      id,
      morceaux: [MORCEAU_VESTIBULE, chemin.morceau, final.morceau],
      creature: composition.creature,
      graine,
      assistance: ASSISTANCE_TIREE,
    };
    const resultat = assembler(station);
    let obtenu: EntreeMonde | Refus | null = null;
    if (resultat.type === 'station') {
      const textes = reunir([TEXTES_MORCEAU_VESTIBULE, chemin.textes, final.textes], ASSISTANCE_STATION);
      obtenu = numeroter({ monde: resultat.monde, textes, parcours: [] });
    } else if (resultat.type === 'invalide') obtenu = { refus: `Station ${id} invalide : ${resultat.erreurs.join(' ')}` };
    memoire.set(id, obtenu);
    return obtenu;
  };

  /** Composition connue et permise par la table. */
  const prevueDe = (composition: string): Prevue | Refus => {
    if (!FORME_ID.test(composition)) return { refus: `Composition inconnue : ${MAL_FORME}.` };
    const prevue = parId.get(composition);
    if (prevue === undefined) return { refus: `Composition inconnue : ${composition}.` };
    return prevue.composition.refus === null ? prevue : { refus: prevue.composition.refus };
  };

  /** Composition connue, permise par la table et publiée. */
  const proposable = (composition: string): Prevue | Refus => {
    const prevue = prevueDe(composition);
    if ('refus' in prevue || proposees.has(prevue.composition.id)) return prevue;
    return { refus: `Composition ${prevue.composition.id} non prouvée : non proposée.` };
  };

  const construire = (composition: string, graine: number): EntreeMonde | Refus => {
    const prevue = prevueDe(composition);
    if ('refus' in prevue) return prevue;
    if (!graineValide(graine)) return { refus: `Composition ${composition} : graine de plan invalide (${String(graine)}).` };
    return assemblerPrevue(prevue, graine) ?? { refus: `Station ${composition}-${graine} : aucun plan pour cette graine.` };
  };

  const resoudre = (id: string): EntreeMonde | Refus => {
    const fixe = Object.hasOwn(mondes, id) ? mondes[id] : undefined;
    if (fixe !== undefined) return fixe;
    if (!FORME_ID.test(id)) return { refus: `Station inconnue : ${MAL_FORME}.` };
    const tiret = id.lastIndexOf('-');
    const composition = id.slice(0, Math.max(tiret, 0));
    if (!parId.has(composition)) return { refus: `Station inconnue : ${id}.` };
    const prevue = proposable(composition);
    if ('refus' in prevue) return prevue;
    const chiffres = id.slice(tiret + 1);
    if (!GRAINE_ECRITE.test(chiffres)) return { refus: `Station ${id} : graine de plan invalide.` };
    return construire(composition, Number(chiffres));
  };

  const tirer = (hasard: () => number, composition?: string): EntreeMonde | Refus => {
    let prevue: Prevue | Refus | undefined;
    if (composition === undefined) {
      const tirables = prevues.filter((candidate) => candidate.composition.refus === null && proposees.has(candidate.composition.id));
      const finals = [...new Set(tirables.map((candidate) => candidate.composition.final))];
      const final = finals[hasard() % finals.length];
      const parmi = tirables.filter((candidate) => candidate.composition.final === final);
      prevue = parmi[hasard() % parmi.length] ?? { refus: 'Aucune composition proposée.' };
    } else prevue = proposable(composition);
    if ('refus' in prevue) return prevue;
    for (let essai = 0; essai < ESSAIS_PLAN; essai++) {
      const graine = hasard();
      if (!graineValide(graine)) return { refus: `Composition ${prevue.composition.id} : graine de plan invalide (${String(graine)}).` };
      const obtenue = assemblerPrevue(prevue, graine);
      if (obtenue !== null) return obtenue;
    }
    return { refus: `Composition ${prevue.composition.id} : aucun plan en ${ESSAIS_PLAN} graines tirées.` };
  };

  return { mondes, compositions: prevues.map((prevue) => prevue.composition), construire, resoudre, tirer };
}
