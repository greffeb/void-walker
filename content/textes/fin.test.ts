import type { Cause, Evenement, RefObjet, RefPassage, RefPiece } from '../../engine';
import { TEXTES_AR01 } from '../ar-01/textes';
import { cleMort, MOMENTS_MAX, raconterFin, type FinDePartie } from './fin';
import { remplir } from './gabarit';
import { nomDe, rendreEvenements } from './rendu';
import { CLES_MORT } from './types';

// Récit de fin (D-281 à D-283) sur des parties écrites à la main, avec les noms d'AR-01 : le contenu n'importe que les types du moteur.

const textes = TEXTES_AR01;
const piece = (nom: string): RefPiece => ({ sorte: 'piece', id: `e-${nom}`, nom });
const objet = (nom: string): RefObjet => ({ sorte: 'objet', id: `e-${nom}`, nom });
const passage = (nom: string, vers: RefPiece): RefPassage => ({ sorte: 'passage', id: `e-${nom}`, nom, ouvert: true, vers, signale: true, feu: false, huile: false, vide: false, gouffre: false });
const SALON = piece('salon');
const ATELIER = piece('atelier');
const GALERIE = piece('galerie');
const CABINE = piece('cabine');
const reveil: readonly Evenement[] = [{ type: 'reveil', piece: SALON }];
const aller = (vers: RefPiece): Evenement => ({ type: 'deplacement', passage: passage('porte', vers), piece: vers });
const blesse = (...causes: Cause[]): Evenement => ({ type: 'aggravation_blesse', causes });
const mort = (...causes: Cause[]): Evenement => ({ type: 'defaite', causes });
const DEFAITE: FinDePartie = { issue: 'defaite', sante: 'vaincu', graine: 7, menace: true };
const depart = (sante: 'indemne' | 'blesse' | 'critique', menace = true): FinDePartie => ({ issue: 'evacuation', sante, graine: 7, menace });
const LANCER: readonly Evenement[] = [{ type: 'evacuation', sources: ['circuit'] }, { type: 'assistance', message: 'depart' }];

describe('récit de fin (12 §4.11, D-281)', () => {
  it('défaite : le réveil, les moments dans l’ordre, la pièce et la cause ; la créature reprise juste après l’avoir nommée', () => {
    const recit = raconterFin(textes, [reveil, [aller(ATELIER), { type: 'premier_contact' }], [blesse('griffes')], [aller(GALERIE)], [mort('griffes')]], DEFAITE);
    expect(recit).toEqual({
      titre: 'Vous n’avez pas atteint la capsule.',
      paragraphes: [
        'Vous vous êtes réveillé dans le salon de transit. Dans l’atelier maintenance, vous avez vu la créature pour la première fois.',
        'Elle vous y a blessé.',
        'Vous êtes mort dans le local technique, sous ses griffes.',
      ],
      assistance: [],
    });
  });

  it('la pièce déjà dite n’est pas redite (« y ») ; après une phrase sans pièce ni créature, tout est redit', () => {
    const ici = raconterFin(textes, [reveil, [aller(ATELIER), { type: 'premier_contact' }], [mort('griffes')]], DEFAITE);
    expect(ici.paragraphes.at(-1)).toBe('Vous y êtes mort, sous ses griffes.');
    const coupe = raconterFin(textes, [reveil, [aller(ATELIER), { type: 'premier_contact' }], [{ type: 'circuit_active', objet: objet('console') }], [blesse('griffes')], [mort('griffes')]], DEFAITE);
    expect(coupe.paragraphes).toEqual([
      'Vous vous êtes réveillé dans le salon de transit. Dans l’atelier maintenance, vous avez vu la créature pour la première fois.',
      'Vous avez réarmé la console de départ. Dans l’atelier maintenance, la créature vous a blessé.',
      'Vous y êtes mort, sous ses griffes.',
    ]);
  });

  it('chaque cause de défaite a sa phrase, comme les textes d’aggravation : le vide l’emporte, puis le feu sur le froid (D-282)', () => {
    expect(cleMort(['griffes'])).toBe('griffes');
    expect(cleMort(['feu'])).toBe('feu');
    expect(cleMort(['froid'])).toBe('froid');
    expect(cleMort(['griffes', 'vide'])).toBe('vide');
    expect(cleMort(['griffes', 'feu', 'froid'])).toBe('griffes_feu');
    expect(cleMort(['feu', 'froid'])).toBe('feu');
    expect(cleMort(['griffes', 'froid'])).toBe('griffes_froid');
    for (const cle of CLES_MORT) {
      const causes = cle.split('_') as Cause[];
      const recit = raconterFin(textes, [reveil, [aller(GALERIE)], [mort(...causes)]], DEFAITE);
      expect(recit.paragraphes).toEqual(['Vous vous êtes réveillé dans le salon de transit.', remplir(textes.fin.morts[cle].ailleurs ?? '', { piece: nomDe(textes, GALERIE) })]);
    }
  });

  it(`au plus ${MOMENTS_MAX} moments : les plus marquants, remis dans l’ordre de la partie`, () => {
    const recit = raconterFin(
      textes,
      [
        reveil,
        [{ type: 'alarme_declenchee', objet: objet('avertisseur') }],
        [{ type: 'circuit_active', objet: objet('console') }],
        [aller(ATELIER), { type: 'premier_contact' }],
        [blesse('griffes')],
        [{ type: 'soin_blesse', objet: objet('trousse') }],
        [mort('griffes')],
      ],
      DEFAITE,
    );
    expect(recit.paragraphes).toEqual([
      'Vous vous êtes réveillé dans le salon de transit. Dans l’atelier maintenance, vous avez vu la créature pour la première fois.',
      'Elle vous y a blessé. Vous vous êtes soigné avec la trousse de soin.',
      'Vous êtes mort dans l’atelier maintenance, sous les griffes de la créature.',
    ]);
  });

  it('un geste défait plus tard n’est pas raconté : rien ne contredit la fin (C-05)', () => {
    const combinaison = { type: 'combinaison_enfilee', objet: objet('trousse') } as const;
    const retiree = raconterFin(textes, [reveil, [combinaison], [{ type: 'combinaison_retiree', objet: objet('trousse') }], [mort('vide')]], DEFAITE);
    expect(retiree.paragraphes).toEqual(['Vous vous êtes réveillé dans le salon de transit.', 'Vous y êtes mort, sans air, exposé au vide.']);
    const gardee = raconterFin(textes, [reveil, [combinaison], [mort('griffes')]], DEFAITE);
    expect(gardee.paragraphes[0]).toBe('Vous vous êtes réveillé dans le salon de transit. Vous avez enfilé la trousse de soin.');
  });

  it('évacuation : le texte de départ que l’écran a montré, la santé, ce qu’on sait de la créature, puis IA Station (D-283)', () => {
    const etapes: readonly (readonly Evenement[])[] = [reveil, [aller(ATELIER), { type: 'premier_contact' }], [blesse('griffes')], [aller(CABINE)], LANCER];
    const recit = raconterFin(textes, etapes, depart('blesse'));
    const montre = rendreEvenements(textes, LANCER, { graine: 7, action: 4 })[0];
    expect(recit.titre).toBe('La capsule s’est détachée.');
    expect(recit.paragraphes.at(-1)).toBe(`${montre} Vous partez blessé. Vous laissez la créature derrière vous.`);
    expect(recit.assistance).toEqual([textes.assistance.depart]);
  });

  it('la créature au départ : hors jeu sous vos yeux, rien de plus ; entendue sans être vue ; jamais perçue ; pas de créature', () => {
    const fin = (etapes: readonly (readonly Evenement[])[], sante: 'indemne' | 'blesse' | 'critique' = 'indemne', menace = true): string =>
      raconterFin(textes, [reveil, ...etapes, LANCER], depart(sante, menace)).paragraphes.at(-1) ?? '';
    const montre = (action: number): string => rendreEvenements(textes, LANCER, { graine: 7, action })[0] ?? '';
    expect(fin([[{ type: 'premier_contact' }], [{ type: 'creature_expulsee' }]])).toBe(`${montre(3)} Vous partez indemne.`);
    expect(fin([[{ type: 'bruit_creature', passage: passage('porte', ATELIER) }]], 'critique')).toBe(
      `${montre(2)} Vous partez grièvement blessé, mais vivant. Vous avez entendu quelque chose bouger à bord, sans jamais le voir.`,
    );
    expect(fin([])).toBe(`${montre(1)} Vous partez indemne. Vous n’avez jamais vu ce qui rôdait à bord.`);
    expect(fin([], 'indemne', false)).toBe(`${montre(1)} Vous partez indemne.`);
  });

  it('une même chose au même endroit ne se raconte qu’une fois ; le vide ne blesse pas, il tue', () => {
    const recit = raconterFin(textes, [reveil, [blesse('feu')], [{ type: 'soin_indemne', objet: objet('trousse') }], [blesse('feu')], [blesse('vide')], [mort('feu')]], DEFAITE);
    expect(recit.paragraphes).toEqual([
      'Vous vous êtes réveillé dans le salon de transit. Le feu vous y a brûlé.',
      'Vous vous êtes soigné avec la trousse de soin.',
      'Vous êtes mort dans le salon de transit, pris par le feu.',
    ]);
  });
});
