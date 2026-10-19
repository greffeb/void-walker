import { bruitDeStation, FREQUENCE_BRUIT_STATION } from './bruits';
import { empreinteEtat, jouer, nouvellePartie, observer, type DefMonde, type Evenement, type Partie } from './index';

// Bruits de station (spec 2026-10-18 §5.5) : une ligne de récit, une action sur sept environ, avant la rencontre, dans une grande
// station seulement ; tirée de la graine de partie et du numéro d'action, sans rien écrire dans l'état.

const MONDE: DefMonde = {
  id: 'bruits',
  depart: 'p-a',
  pieces: [
    { id: 'p-a', nom: 'a' },
    { id: 'p-b', nom: 'b' },
  ],
  liaisons: [{ id: 'l-a-b', nom: 'porte', entre: ['p-a', 'p-b'], ouverte: false }],
  objets: [],
};

/** Actions jouées par le menu (`aller` d'abord si demandé, puis `attente`) : les événements de chaque action, et la partie finale. */
function attendre(monde: DefMonde, fois: number, entrer = false): { readonly evenements: readonly Evenement[][]; readonly partie: Partie } {
  let partie = nouvellePartie(monde, { version: 'bruits', graine: 4 });
  const evenements: Evenement[][] = [];
  for (let rang = 0; rang < fois && observer(monde, partie.etat).issue === null; rang++) {
    const action = entrer && rang === 0 ? 'aller' : 'attendre';
    const option = observer(monde, partie.etat).menu.find((candidate) => candidate.action === action && candidate.disponible);
    if (option === undefined) break;
    const resultat = jouer(monde, partie, option.commande);
    if (resultat.type !== 'engagee') throw new Error('Attendre refusé.');
    evenements.push([...resultat.evenements]);
    partie = resultat.partie;
  }
  return { evenements, partie };
}

const bruits = (evenements: readonly Evenement[][]): number => evenements.flat().filter((evenement) => evenement.type === 'bruit_station').length;

describe('bruits de station (spec 2026-10-18 §5.5)', () => {
  it('déterministe, une action sur sept environ', () => {
    expect(FREQUENCE_BRUIT_STATION).toBe(7);
    let total = 0;
    for (let graine = 1; graine <= 10; graine++) for (let action = 1; action <= 700; action++) if (bruitDeStation(graine, action)) total++;
    expect(total).toBeGreaterThan(850);
    expect(total).toBeLessThan(1150);
    expect(bruitDeStation(3, 12)).toBe(bruitDeStation(3, 12));
  });

  it('une grande station en émet ; une station ordinaire jamais', () => {
    expect(bruits(attendre({ ...MONDE, bruitsStation: true }, 70).evenements)).toBeGreaterThanOrEqual(4);
    expect(bruits(attendre(MONDE, 70).evenements)).toBe(0);
  });

  it('jamais après le premier contact', () => {
    // Le passager entre dans la pièce de la créature : la rencontre a lieu tout de suite, puis il attend.
    const monde: DefMonde = { ...MONDE, bruitsStation: true, liaisons: [{ ...MONDE.liaisons[0]!, ouverte: true }], creature: { piece: 'p-b' } };
    const { evenements } = attendre(monde, 40, true);
    const contact = evenements.findIndex((pas) => pas.some((evenement) => evenement.type === 'premier_contact'));
    expect(contact).toBeGreaterThanOrEqual(0);
    expect(bruits(evenements.slice(contact))).toBe(0);
  });

  it('rien n’entre dans l’état : même partie avec ou sans bruits', () => {
    const avec = attendre({ ...MONDE, bruitsStation: true }, 30).partie;
    const sans = attendre(MONDE, 30).partie;
    expect(empreinteEtat(avec.etat)).toBe(empreinteEtat(sans.etat));
  });
});
