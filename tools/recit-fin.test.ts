import { jouer, nouvellePartie, observer, rejouer, type Evenement, type Partie } from '../engine';
import { generateurDepuisGraine, suivant } from '../engine/des';
import { cleEvacuation, cleMort, nomDe, raconterFin, remplir, rendreAssistance, rendreEvenements, type EntreeMonde, type PhraseFin, type RecitFin } from '../content';
import { recitDeFin } from '../app/jeu';
import { creerBot, jouerAvecBot, PROFILS } from './bots';
import { CATALOGUE } from './catalogue';
import { trouverOption } from './rejouer-parcours';

// Récit de fin (D-281 à D-283) relu sur de vraies parties : celles des bots sur des stations tirées et sur les mondes écrits en
// entier, et les parcours témoins. Chaque fin doit dire ce qui s'est réellement passé (C-05), dans des phrases bien remplies.

const STATIONS = 120;
const PARTIES_PAR_MONDE = 25;

interface Finie {
  readonly entree: EntreeMonde;
  readonly partie: Partie;
  readonly etapes: readonly (readonly Evenement[])[];
  readonly recit: RecitFin;
}

function finir(entree: EntreeMonde, partie: Partie): Finie | null {
  const { issue, sante } = observer(entree.monde, partie.etat);
  if (issue === null) return null;
  const { version, graine } = partie.enregistrement;
  const etapes = [nouvellePartie(entree.monde, { version, graine }).derniers, ...rejouer(entree.monde, partie.enregistrement, version).etapes];
  return { entree, partie, etapes, recit: raconterFin(entree.textes, etapes, { issue, sante, graine, menace: entree.monde.creature !== undefined }) };
}

/** Partie d'un parcours témoin, jouée par le menu public jusqu'à son dernier pas. */
function parcourir(entree: EntreeMonde, etapes: EntreeMonde['parcours'][number]['etapes']): Partie {
  let partie = nouvellePartie(entree.monde, { version: 'recit-fin', graine: 20261018 });
  for (const etape of etapes) {
    const option = trouverOption(observer(entree.monde, partie.etat), etape);
    if (option === undefined) throw new Error(`${entree.monde.id} : étape ${etape.action} ${etape.cible} introuvable.`);
    const resultat = jouer(entree.monde, partie, option.commande);
    if (resultat.type !== 'engagee') throw new Error(`${entree.monde.id} : étape ${etape.action} non engagée.`);
    partie = resultat.partie;
  }
  return partie;
}

function parties(): Finie[] {
  let etat = generateurDepuisGraine(20261018);
  const hasard = (): number => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return tirage.valeur;
  };
  const finies: Finie[] = [];
  const garder = (entree: EntreeMonde, partie: Partie): void => {
    const finie = finir(entree, partie);
    if (finie !== null) finies.push(finie);
  };
  for (let rang = 0; rang < STATIONS; rang++) {
    const station = CATALOGUE.tirer(hasard);
    if ('refus' in station) throw new Error(station.refus);
    const graine = hasard();
    for (const profil of PROFILS) garder(station, jouerAvecBot(station, creerBot(profil, rang * PROFILS.length + PROFILS.indexOf(profil)), graine).partie);
  }
  for (const entree of Object.values(CATALOGUE.mondes)) {
    for (let graine = 0; graine < PARTIES_PAR_MONDE; graine++) garder(entree, jouerAvecBot(entree, creerBot('aleatoire', 1000 + graine), 2000 + graine).partie);
    for (const parcours of entree.parcours) garder(entree, parcourir(entree, parcours.etapes));
  }
  return finies;
}

const FINIES = parties();

/** Les quatre formes écrites d'une phrase de fin, remplies avec la pièce. */
function formes(phrase: PhraseFin, piece: ReturnType<typeof nomDe>): string[] {
  return Object.values(phrase).flatMap((forme) => (forme === undefined ? [] : [remplir(forme, { piece })]));
}

describe('récit de fin sur de vraies parties (12 §4.11, D-281 à D-283)', () => {
  it('couvre chaque cause de défaite, chaque façon de partir et chaque santé au départ', () => {
    const morts = new Set<string>();
    const departs = new Set<string>();
    const santes = new Set<string>();
    for (const { entree, partie, etapes } of FINIES) {
      const derniere = etapes.at(-1) ?? [];
      for (const evenement of derniere) {
        if (evenement.type === 'defaite') morts.add(cleMort(evenement.causes));
        if (evenement.type === 'evacuation') {
          departs.add(cleEvacuation(evenement.sources));
          santes.add(observer(entree.monde, partie.etat).sante);
        }
      }
    }
    expect([...morts].sort()).toEqual(expect.arrayContaining(['feu', 'froid', 'griffes', 'vide']));
    expect([...departs].sort()).toEqual(['bloc', 'circuit', 'circuit_bloc', 'reserve']);
    expect([...santes].sort()).toEqual(['blesse', 'critique', 'indemne']);
  });

  it('des phrases bien remplies, sans chiffre ni identifiant, en deux ou trois paragraphes', () => {
    for (const { entree, recit } of FINIES) {
      const texte = [recit.titre, ...recit.paragraphes, ...recit.assistance].join(' ');
      expect(texte, entree.monde.id).not.toMatch(/[{}\d/_]/);
      expect(recit.paragraphes.length, texte).toBeGreaterThanOrEqual(2);
      expect(recit.paragraphes.length, texte).toBeLessThanOrEqual(3);
      expect(recit.paragraphes.every((paragraphe) => /^\p{Lu}/u.test(paragraphe) && /[.!?…»]$/.test(paragraphe)), texte).toBe(true);
    }
  });

  it('défaite : la dernière phrase dit la pièce où la partie a fini et ce qui a tué (D-282)', () => {
    for (const { entree, partie, etapes, recit } of FINIES.filter(({ entree: e, partie: p }) => observer(e.monde, p.etat).issue === 'defaite')) {
      const defaite = (etapes.at(-1) ?? []).find((evenement) => evenement.type === 'defaite');
      if (defaite?.type !== 'defaite') throw new Error('Défaite sans événement.');
      const piece = nomDe(entree.textes, observer(entree.monde, partie.etat).piece);
      expect(formes(entree.textes.fin.morts[cleMort(defaite.causes)], piece)).toContain(recit.paragraphes.at(-1));
      expect(recit.titre).toBe(entree.textes.fin.titres.defaite);
      expect(recit.assistance).toEqual([]);
    }
  });

  it('évacuation : le texte de départ montré par le jeu, la santé réelle, IA Station ; la créature telle que le passager la connaît (D-283)', () => {
    for (const { entree, partie, etapes, recit } of FINIES.filter(({ entree: e, partie: p }) => observer(e.monde, p.etat).issue === 'evacuation')) {
      const { textes } = entree;
      const derniere = etapes.at(-1) ?? [];
      const montre = rendreEvenements(textes, derniere, { graine: partie.enregistrement.graine, action: partie.etat.actions }).join(' ');
      const fin = recit.paragraphes.at(-1) ?? '';
      const sante = observer(entree.monde, partie.etat).sante;
      if (sante === 'vaincu') throw new Error('Évacuation d’un passager vaincu.');
      expect(fin.startsWith(`${montre} ${textes.fin.sante[sante]}`), fin).toBe(true);
      expect(recit.assistance).toEqual(rendreAssistance(textes, derniere));
      const tout = etapes.flat().map((evenement) => evenement.type);
      const horsJeu = tout.includes('creature_expulsee') || tout.includes('creature_inerte');
      expect(fin.endsWith(textes.fin.creature.laissee), fin).toBe(!horsJeu && tout.includes('premier_contact'));
      if (fin.endsWith(textes.fin.creature.jamais)) expect(tout.some((type) => /creature|contact|entendu|secouee|enfoncee|pont_cede/.test(type)), fin).toBe(false);
    }
  });

  it('l’appli raconte la fin relue de la partie enregistrée, comme la CLI (C-06 K-07)', () => {
    for (const { entree, partie, recit } of FINIES) expect(recitDeFin(entree, partie)).toEqual(recit);
  });

  it('un geste défait plus tard n’est jamais raconté : combinaison enfilée seulement si elle l’est encore à la fin (C-05)', () => {
    for (const { entree, partie, recit } of FINIES) {
      const enfilee = observer(entree.monde, partie.etat).enfilee;
      const dit = recit.paragraphes.some((paragraphe) => paragraphe.includes('Vous avez enfilé'));
      if (dit) expect(enfilee, recit.paragraphes.join(' ')).not.toBeNull();
    }
  });
});
