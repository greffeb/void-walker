import { COMPOSITIONS_PUBLIEES, type EntreeMonde } from '../content';
import { nouvellePartie } from '../engine';
import { CATALOGUE } from './catalogue';
import { executerParcours } from './rejouer-parcours';
import { capsuleCoupee, creatureHorsJeu, mesurerMiseHorsJeu, ordreImpose, stationDeReference, verifierLibre, verifierStation } from './verifier-station';

// Ordre libre (#155, D-259, spec L5 §3 et §4) : forme assemblée, preuve des deux ordres, cloisons qui coupent la capsule, et
// mesure de D-241. Le catalogue entier est prouvé par `verifier-station.test.ts` ; ici, quelques stations légères.

function reference(composition: string): EntreeMonde {
  const station = stationDeReference(CATALOGUE, composition);
  if ('refus' in station) throw new Error(station.refus);
  return station.entree;
}

const LEGERE = 'ol-m05-m10-m03-tri';

describe('station en ordre libre assemblée (spec L5 §3)', () => {
  it('vestibule, carrefour, deux branches sans sortie, final ; deux cloisons verrouillées en série, une commande au fond de chaque branche', () => {
    const { monde } = reference(LEGERE);
    const morceaux = [...new Set(monde.pieces.map((piece) => piece.id.slice(0, piece.id.indexOf('/'))))];
    expect(morceaux).toEqual(['vestibule', 'carrefour', 'm-05', 'm-10', 'm-03']);
    const cloisons = monde.liaisons.filter((liaison) => liaison.verrouillee === true);
    expect(cloisons.map((liaison) => [liaison.id, liaison.entre, liaison.ouverte])).toEqual([
      ['carrefour/l-cloison-1', ['carrefour/p-couloir', 'carrefour/p-sas'], false],
      ['l-carrefour-m-03', ['carrefour/p-sas', 'm-03/p-energie'], false],
    ]);
    // Chaque branche s'accroche au couloir et n'a pas de porte vers un autre morceau.
    expect(monde.liaisons.filter((liaison) => liaison.id.startsWith('l-')).map((liaison) => liaison.id)).toEqual([
      'l-vestibule-carrefour',
      'l-carrefour-m-03',
      'l-carrefour-m-05',
      'l-carrefour-m-10',
    ]);
    expect(monde.objets.filter((objet) => objet.deverrouille !== undefined).map((objet) => [objet.id, objet.piece, objet.deverrouille])).toEqual([
      ['m-05/o-commande-1', 'm-05/p-quai', 'carrefour/l-cloison-1'],
      ['m-10/o-commande-2', 'm-10/p-entrepot', 'l-carrefour-m-03'],
    ]);
  });

  it('la commande de M-10 est au-delà de la chambre froide, dans l’entrepôt où attend la créature, pas dans la coursive qu’on rejoint des quartiers', () => {
    const { monde } = reference('ol-m05-m10-m03-entrepot');
    expect(monde.objets.find((objet) => objet.deverrouille !== undefined && objet.piece.startsWith('m-10/'))?.piece).toBe('m-10/p-entrepot');
    expect(monde.creature?.piece).toBe('m-10/p-entrepot');
  });

  it('chaque cloison coupe à elle seule toute capsule du départ ; une copie avec un passage qui la contourne ne la coupe plus', () => {
    const entree = reference(LEGERE);
    expect(capsuleCoupee(entree.monde, 'carrefour/l-cloison-1')).toBe(true);
    expect(capsuleCoupee(entree.monde, 'l-carrefour-m-03')).toBe(true);
    // Copie sans plan (toutes les pièces en ont un, ou aucune) : le passage ajouté n'a pas de mur à lui.
    const sansPlan = <T extends { readonly plan?: unknown }>(element: T): T => ({ ...element, plan: undefined });
    const contour = { id: 'l-contour', nom: 'porte', entre: ['carrefour/p-couloir', 'm-03/p-energie'] as const, ouverte: false };
    const contournee = {
      ...entree,
      monde: { ...entree.monde, id: 'contournee', pieces: entree.monde.pieces.map(sansPlan), liaisons: [...entree.monde.liaisons.map(sansPlan), contour] },
    };
    expect(capsuleCoupee(contournee.monde, 'carrefour/l-cloison-1')).toBe(false);
    const rapport = verifierLibre(contournee, { maxEtats: 1 });
    expect(rapport).toMatchObject({ verdict: 'sans_sortie_sure', coupees: false, parcours: null });
    expect(rapport.diagnostic).toContain('une branche pourrait être sautée');
  });
});

describe('preuve des deux ordres (spec L5 §4.1, G-07)', () => {
  const entree = reference(LEGERE);
  const rapport = verifierLibre(entree);

  it('prouvée dans les deux ordres, sans dé ni blessure, témoin rejoué jusqu’à l’évacuation', () => {
    expect(rapport).toMatchObject({ verdict: 'prouvee', ordres: ['prouvee', 'prouvee'], coupees: true });
    expect(rapport.diagnostic).toMatch(/prouvée en \d+ actions, première cloison d’abord, et en \d+ actions, seconde d’abord/);
    const parcours = rapport.parcours;
    if (parcours === null) throw new Error('Témoin absent.');
    expect(executerParcours(entree, parcours, 'ordre-libre-test').erreurs).toEqual([]);
  });

  it('chaque ordre a son témoin : la commande imposée d’abord est actionnée la première', () => {
    const [premiere, seconde] = ['carrefour/l-cloison-1', 'l-carrefour-m-03'] as const;
    for (const [avant, apres, attendue] of [
      [premiere, seconde, 'commande_1'],
      [seconde, premiere, 'commande_2'],
    ] as const) {
      const sens = verifierStation(entree, ordreImpose(entree.monde, avant, apres));
      expect(sens.verdict).toBe('prouvee');
      const commandes = (sens.parcours?.etapes ?? []).filter((etape) => etape.action === 'actionner').map((etape) => etape.cible);
      expect(commandes[0]).toBe(attendue);
      expect(commandes).toHaveLength(2);
    }
  });

  it('l’ordre imposé écarte les états où la seconde cloison est levée avant la première', () => {
    const { admissible } = ordreImpose(entree.monde, 'carrefour/l-cloison-1', 'l-carrefour-m-03');
    const depart = nouvellePartie(entree.monde, { version: 'ordre-libre-test', graine: 1 }).etat;
    expect(admissible(depart)).toBe(true);
    expect(admissible({ ...depart, verrous: ['carrefour/l-cloison-1'] })).toBe(false);
    expect(admissible({ ...depart, verrous: ['l-carrefour-m-03'] })).toBe(true);
    expect(admissible({ ...depart, verrous: [] })).toBe(true);
  });

  it('toutes les compositions publiées en ordre libre ont la forme `ol-…`, les autres non', () => {
    const libres = CATALOGUE.compositions.filter((composition) => composition.forme === 'libre').map((composition) => composition.id);
    expect(COMPOSITIONS_PUBLIEES.filter((id) => id.startsWith('ol-'))).toEqual(libres.filter((id) => COMPOSITIONS_PUBLIEES.includes(id)));
    expect(COMPOSITIONS_PUBLIEES.filter((id) => id.startsWith('ol-'))).toHaveLength(140);
  });
});

describe('mesure de D-241 (spec L5 §5)', () => {
  it('créature tombée, inerte ou expulsée : hors jeu ; dans une chambre froide toutes portes fermées : enfermée ; une porte ouverte : non', () => {
    const { monde } = reference('m10-m03-entrepot');
    const depart = nouvellePartie(monde, { version: 'ordre-libre-test', graine: 1 }).etat;
    const creature = depart.creature;
    if (creature === null) throw new Error('Créature absente.');
    const chambre = monde.pieces.find((piece) => piece.froide === true)?.id ?? '';
    const portes = monde.liaisons.filter((liaison) => liaison.entre.includes(chambre)).map((liaison) => liaison.id);
    const fermees = Object.fromEntries(portes.map((id) => [id, false]));
    expect(creatureHorsJeu(monde, depart)).toBe(false);
    expect(creatureHorsJeu(monde, { ...depart, creature: { ...creature, neutralisee: 'tombee' } })).toBe(true);
    expect(creatureHorsJeu(monde, { ...depart, creature: { ...creature, piece: chambre }, liaisons: { ...depart.liaisons, ...fermees } })).toBe(true);
    const uneOuverte = { ...depart.liaisons, ...fermees, [portes[0] ?? '']: true };
    expect(creatureHorsJeu(monde, { ...depart, creature: { ...creature, piece: chambre }, liaisons: uneOuverte })).toBe(false);
  });

  it('possible avec la passerelle ou la chambre froide sur le chemin ; impossible sans gouffre, chambre froide ni vitrage hors du final, sans recherche', () => {
    expect(mesurerMiseHorsJeu(reference('m08-m03-magasin'))).toBe('possible');
    expect(mesurerMiseHorsJeu(reference('m10-m03-entrepot'))).toBe('possible');
    expect(mesurerMiseHorsJeu(reference('ol-m05-m10-m03-tri'))).toBe('possible');
    // M-07 et M-03 : aucun moyen hors du final ; réponse immédiate, sans état exploré.
    const debut = performance.now();
    expect(mesurerMiseHorsJeu(reference('m07-m03-soute'))).toBe('impossible');
    expect(performance.now() - debut).toBeLessThan(50);
    // La poursuite des pas (D-276) allonge la recherche des stations en ordre libre ; le verdict ne change pas.
  }, 60000);

  it('la baie de M-06, seul moyen de la station, est dans le final : impossible, sans recherche', () => {
    expect(mesurerMiseHorsJeu(reference('m07-m06-soute'))).toBe('impossible');
  });

  it('le passager n’entre jamais dans le final : la créature ne peut être enfermée qu’en restant hors du final', () => {
    // Créature devant la capsule de M-06, chambre froide de M-10 avant : épuisé sans jamais entrer dans le final.
    expect(mesurerMiseHorsJeu(reference('m07-m10-m06-embarquement'))).toBe('impossible');
  }, 60000);
});
