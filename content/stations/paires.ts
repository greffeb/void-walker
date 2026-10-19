import type { DefMorceau } from '../../engine';
// Table exhaustive des paires de morceaux (13 §4.1, L0 #150), recopiée telle quelle : chaque paire non ordonnée une seule fois,
// avec la règle qui la permet ou le motif du refus. Une paire absente n'est jamais autorisée par ressemblance (D-167, D-248).

export interface LignePaire {
  /** `a < b`, de 'M-01' à 'M-10'. */
  readonly a: string;
  readonly b: string;
  readonly verdict: 'permise' | 'jamais';
  readonly regle: string;
}

const permise = (a: string, b: string, regle: string): LignePaire => ({ a, b, verdict: 'permise', regle });

export const PAIRES: readonly LignePaire[] = [
  permise('M-01', 'M-02', 'Objets et obstacles distincts, sans règle de plus (D-248)'),
  permise('M-01', 'M-03', 'Feu et énergie, sans règle de plus (D-248)'),
  permise('M-01', 'M-04', 'Feu et observation/huile/avertisseur, sans règle de plus (D-248)'),
  permise('M-01', 'M-05', 'Feu et passage caché, sans règle de plus (D-248)'),
  permise('M-01', 'M-06', 'MX-02 : le vide éteint le feu ; pas de feu dans une pièce sans air (D-174)'),
  permise('M-01', 'M-07', 'Feu et machines, sans règle de plus (D-248)'),
  permise('M-01', 'M-08', 'Le feu peut gagner l’autre bord de la passerelle ; pas de feu sans air (D-247)'),
  permise('M-01', 'M-09', 'Feu et gravité, sans règle de plus (D-248)'),
  permise('M-01', 'M-10', 'Feu et froid, sans règle de plus (D-248)'),
  permise('M-02', 'M-03', 'Grille/caisse et énergie, sans règle de plus (D-248) ; le bloc ne passe pas le conduit (D-043)'),
  permise('M-02', 'M-04', 'Grille/caisse et observation, sans règle de plus (D-248)'),
  permise('M-02', 'M-05', 'Grille/caisse et passage caché, sans règle de plus (D-248)'),
  permise('M-02', 'M-06', 'Grille/caisse et baie, sans règle de plus (D-248)'),
  permise('M-02', 'M-07', 'Grille/caisse et machines, sans règle de plus (D-248)'),
  permise('M-02', 'M-08', 'Grille/caisse et passerelle, sans règle de plus (D-248)'),
  permise('M-02', 'M-09', 'Grille/caisse et gravité, sans règle de plus (D-248)'),
  permise('M-02', 'M-10', 'Grille/caisse et froid, sans règle de plus (D-248)'),
  permise('M-03', 'M-04', 'Bruits entre eux : relais et avertisseur suivent les règles existantes (§4, D-174)'),
  permise('M-03', 'M-05', 'Énergie et passage caché, sans règle de plus (D-248) ; le bloc ne passe pas le passage étroit (D-043)'),
  { a: 'M-03', b: 'M-06', verdict: 'jamais', regle: 'Deux morceaux finals ; un seul final par station (D-159, D-172)' },
  permise('M-03', 'M-07', 'Bruits entre eux (§4, D-174) ; interrupteur autonome, indépendant de l’énergie (D-168)'),
  permise('M-03', 'M-08', 'Énergie et passerelle, sans règle de plus (D-248) ; planche et bloc encombrants, un seul porté à la fois (D-169)'),
  permise('M-03', 'M-09', 'Énergie et gravité, sans règle de plus (D-248) ; interrupteurs autonomes (D-168)'),
  permise('M-03', 'M-10', 'Bruits entre eux : relais et compresseur suivent les règles existantes (§4, D-174)'),
  permise('M-04', 'M-05', 'Observation et passage caché, sans règle de plus (D-248)'),
  permise('M-04', 'M-06', 'MX-03 : vide et huile sans effet l’un sur l’autre (D-174)'),
  permise('M-04', 'M-07', 'Bruits entre eux : avertisseur et machines suivent les règles existantes (§4, D-174)'),
  permise('M-04', 'M-08', 'Observation/huile et passerelle, sans règle de plus (D-248)'),
  permise('M-04', 'M-09', 'MX-01 : ralentissements additionnés ; MX-04 : huile impossible à verser sans gravité (D-174)'),
  permise('M-04', 'M-10', 'Bruits entre eux ; MX-01 : ralentissements additionnés ; MX-05 : huile toujours glissante dans le froid (D-174)'),
  permise('M-05', 'M-06', 'Passage caché et baie, sans règle de plus (D-248)'),
  permise('M-05', 'M-07', 'Passage caché et machines, sans règle de plus (D-248)'),
  permise('M-05', 'M-08', 'Passage caché et passerelle, sans règle de plus (D-248)'),
  permise('M-05', 'M-09', 'Passage caché et gravité, sans règle de plus (D-248)'),
  permise('M-05', 'M-10', 'Passage caché et froid, sans règle de plus (D-248)'),
  permise('M-06', 'M-07', 'L’air quitte aussi les machines ; aucune règle de plus (D-246)'),
  permise('M-06', 'M-08', 'L’air passe par-dessus le vide de la passerelle (D-246) ; neutralisations définitives, sans règle de plus (§4, D-174)'),
  permise('M-06', 'M-09', 'L’air quitte aussi la zone sans gravité ; aucune règle de plus (D-246)'),
  permise('M-06', 'M-10', 'L’air quitte aussi la chambre froide ; aucune règle de plus (D-246)'),
  permise('M-07', 'M-08', 'Machines et passerelle, sans règle de plus (D-248)'),
  permise('M-07', 'M-09', 'Machines et gravité, sans règle de plus (D-248)'),
  permise('M-07', 'M-10', 'Bruits entre eux : machines et compresseur suivent les règles existantes (§4, D-174)'),
  permise('M-08', 'M-09', 'Passerelle et gravité, sans règle de plus (D-248)'),
  permise('M-08', 'M-10', 'Passerelle et froid, sans règle de plus (D-248)'),
  permise('M-09', 'M-10', 'MX-01 : traversée sans gravité et ralentissement par le froid additionnés (D-174)'),
];

/** Numéro du morceau dans la table des paires : 'm-07' → 'M-07'. */
const numero = (morceau: DefMorceau): string => morceau.id.toUpperCase();

export function motifDeTable(table: readonly LignePaire[], x: DefMorceau, y: DefMorceau): string | null {
  const [a, b] = numero(x) < numero(y) ? [numero(x), numero(y)] : [numero(y), numero(x)];
  const ligne = table.find((candidate) => candidate.a === a && candidate.b === b);
  if (ligne === undefined) return `Paire ${a} + ${b} absente de la table : refusée par défaut.`;
  return ligne.verdict === 'jamais' ? `Paire ${a} + ${b} jamais ensemble : ${ligne.regle}.` : null;
}

/** Première paire refusée : chemin–chemin, puis chaque chemin–final, dans l'ordre de la station. */
export function premierRefus(table: readonly LignePaire[], chemins: readonly DefMorceau[], final: DefMorceau): string | null {
  const paires = [
    ...chemins.flatMap((x, rang) => chemins.slice(rang + 1).map((y) => [x, y] as const)),
    ...chemins.map((chemin) => [chemin, final] as const),
  ];
  for (const [x, y] of paires) {
    const motif = motifDeTable(table, x, y);
    if (motif !== null) return motif;
  }
  return null;
}

export const court = (morceau: DefMorceau): string => morceau.id.replaceAll('-', '');

