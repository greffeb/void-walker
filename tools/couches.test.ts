import {
  fuitesDeCouches,
  fuitesDesCouches,
  MENACE,
  MONDES,
  MORCEAUX,
  MORCEAUX_TEXTES,
  MOTS_MENACE,
  MOTS_UNIVERS,
  reunir,
  SOCLE,
  TEXTES_STATION_ESSAI,
  UNIVERS,
  type Couche,
  type EntreeMonde,
  type TextesMorceau,
} from '../content';
import { CATALOGUE } from './catalogue';

// Textes par couches (docs/13-morceaux-lancement.md §7.2) : socle, univers, menace et morceaux réunis en un seul jeu de textes,
// sans mot de l'univers ni de la menace dans le socle ou un morceau.

/** Chaque texte d'un arbre de textes, par chemin : une phrase, des variantes ou un champ de nom. */
function feuilles(arbre: unknown, chemin = ''): Record<string, unknown> {
  if (typeof arbre !== 'object' || arbre === null || Array.isArray(arbre)) return { [chemin]: arbre };
  return Object.assign({}, ...Object.entries(arbre).map(([cle, valeur]) => feuilles(valeur, chemin === '' ? cle : `${chemin}.${cle}`))) as Record<string, unknown>;
}

const VIDE: TextesMorceau = { noms: {}, descriptions: {}, assistance: {} };
const SOUTE = { texte: 'soute', genre: 'f', nombre: 's', elision: false } as const;

function textesDe(cle: string): TextesMorceau {
  const textes = MORCEAUX_TEXTES[cle];
  if (textes === undefined) throw new Error(`Textes ${cle} absents.`);
  return textes;
}

describe('textes par couches (13 §7.2)', () => {
  it('aucun mot de l’univers ni de la menace dans le socle, les morceaux ni les textes propres aux stations de test', () => {
    expect(Object.keys(MORCEAUX_TEXTES)).toEqual([
      'vestibule',
      'm-01',
      'm-02',
      'm-04',
      'm-05',
      'm-07',
      'm-08',
      'm-09',
      'm-10',
      'm-11',
      'm-12',
      'carrefour',
      'm-03',
      'm-06',
      'essai',
      'station m-07',
      'station m-08',
      'station m-09',
      'station m-10',
    ]);
    expect(fuitesDeCouches(MORCEAUX_TEXTES)).toEqual([]);
  });

  it('l’univers et la menace déclarent leurs radicaux', () => {
    expect(MOTS_UNIVERS).toContain('station');
    expect(MOTS_MENACE).toEqual(expect.arrayContaining(['créature', 'griff']));
  });

  it('un mot de la menace ajouté à un refus du socle est une fuite qui nomme la clé et le mot', () => {
    const socle = { ...SOCLE, refus: { ...SOCLE.refus, cible_absente: `La créature. ${SOCLE.refus.cible_absente}` } };
    expect(fuitesDeCouches({}, socle)).toEqual(['socle, refus.cible_absente : « créature », mot de la menace.']);
  });

  it('un mot de l’univers dans un morceau est une fuite, casse ignorée', () => {
    const morceau: TextesMorceau = { ...VIDE, descriptions: { hall: ['Un hall nu.', 'Le hall de la STATION.'] } };
    expect(fuitesDeCouches({ essai: morceau })).toEqual(['morceau essai, descriptions.hall [1] : « STATION », mot de l’univers.']);
  });

  it('seul un mot qui commence par un radical compte ; un gabarit n’est pas un mot', () => {
    const morceau: TextesMorceau = {
      ...VIDE,
      descriptions: { hall: ['Une prestation soignée, un mécanisme grippé.', 'Vous voyez {le:station} et {la:creature}.'] },
    };
    expect(fuitesDeCouches({ essai: morceau })).toEqual([]);
  });

  it('l’univers et la menace eux-mêmes ne se mêlent pas : rien de la menace ni des traces dans l’univers, pas de « station » dans la menace', () => {
    expect(fuitesDesCouches()).toEqual([]);
  });

  it('un mot de la menace ou d’une trace dans l’univers est une fuite qui nomme la clé et le mot', () => {
    const univers = { ...UNIVERS, pillages: ['Quelqu’un est passé avant vous.', 'La créature a tout pris.', 'Du sang sur les étagères, un meuble sangle.'] } as Couche;
    expect(fuitesDesCouches(univers)).toEqual(['univers, pillages [1] : « créature », mot de la menace.', 'univers, pillages [2] : « sang », mot réservé aux traces.']);
  });

  it('le mot « station » dans la menace est une fuite qui nomme la clé et le mot, casse ignorée', () => {
    const menace = { ...MENACE, traces: { legere: ['Une odeur de station.', 'Une trace sur la Station.'], forte: ['Une trace.'] } } as Couche;
    expect(fuitesDesCouches(UNIVERS, menace)).toEqual(['menace, traces.legere [0] : « station », mot de l’univers.', 'menace, traces.legere [1] : « Station », mot de l’univers.']);
  });

  it('reunir accepte une clé définie deux fois avec le même texte', () => {
    const soute: TextesMorceau = { ...VIDE, noms: { soute: SOUTE } };
    expect(reunir([soute, { ...VIDE, noms: { soute: { ...SOUTE } } }]).noms.soute).toEqual(SOUTE);
  });

  it('reunir lève une erreur qui nomme la clé si deux morceaux lui donnent deux textes différents', () => {
    const basse: TextesMorceau = { ...VIDE, descriptions: { soute: ['Une soute basse.'] } };
    const haute: TextesMorceau = { ...VIDE, descriptions: { soute: ['Une soute haute.'] } };
    expect(() => reunir([basse, haute])).toThrow(/descriptions\.soute/);
  });

  it('reunir refuse qu’un morceau redéfinisse autrement un texte commun ou un message de la station', () => {
    const hangar: TextesMorceau = { ...VIDE, noms: { embarquement: { texte: 'hangar', genre: 'm', nombre: 's', elision: false } } };
    expect(() => reunir([hangar])).toThrow(/noms\.embarquement/);
    const capsule: TextesMorceau = { ...VIDE, assistance: { capsule: 'Capsule prête.' } };
    expect(() => reunir([capsule], { capsule: 'Capsule absente.' })).toThrow(/assistance\.capsule/);
    expect(reunir([capsule], { reveil: 'Réveil.' }).assistance).toEqual({ capsule: 'Capsule prête.', reveil: 'Réveil.' });
  });

  it('TEXTES_STATION_ESSAI est la réunion du socle, de l’univers, de la menace et de l’embarquement d’essai, sans clé partagée', () => {
    const couches = [SOCLE, UNIVERS, MENACE, textesDe('essai')].map((couche) => feuilles(couche));
    const attendu = Object.assign({}, ...couches) as Record<string, unknown>;
    expect(Object.keys(attendu)).toHaveLength(couches.reduce((total, couche) => total + Object.keys(couche).length, 0));
    expect(feuilles(TEXTES_STATION_ESSAI)).toEqual(attendu);
  });

  it('la réunion est complète : mêmes clés qu’un jeu de textes entier, hors noms, descriptions et messages', () => {
    const cles = (textes: unknown): string[] => Object.keys(feuilles(textes)).filter((cle) => !/^(noms|descriptions|assistance)\./.test(cle)).sort();
    expect(cles(reunir([]))).toEqual(cles((MONDES['ar-01'] as EntreeMonde).textes));
  });

  it('chaque station de test m-07 à m-10 est la réunion des couches communes, de ses morceaux et de ses textes propres', () => {
    const essai = textesDe('essai');
    const attendus: Readonly<Record<string, readonly [readonly TextesMorceau[], Readonly<Record<string, string>>]>> = {
      'm-07': [[textesDe('m-07'), essai], textesDe('station m-07').assistance],
      'm-08': [[textesDe('station m-08'), essai], {}],
      'm-09': [[textesDe('station m-09'), essai], {}],
      'm-10': [[textesDe('m-10'), essai], textesDe('station m-10').assistance],
    };
    for (const [id, [morceaux, messages]] of Object.entries(attendus)) {
      expect((CATALOGUE.mondes[id] as EntreeMonde).textes).toEqual(reunir(morceaux, messages));
    }
    expect(Object.keys(MORCEAUX)).toEqual(Object.keys(MORCEAUX_TEXTES).filter((cle) => !cle.startsWith('station ')));
  });
});
