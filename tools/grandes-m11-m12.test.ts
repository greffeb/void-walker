import { describe, expect, it } from 'vitest';
import { idPublic, jouer, nouvellePartie, observer, type DefMonde, type Partie } from '../engine';
import { CATALOGUE } from './catalogue';

// M-11 et M-12 dans les grandes stations (#236) : leurs règles tiennent avec les annexes et les portes de boucle. La porte
// blindée ne se force jamais, même par une créature venue d'une porte de boucle (D-292), et la remise reste fermée (D-293) ;
// le drone tient la poignée, se replace puis se réarme sur place, et le chariot se range (D-304, D-305).

/** Mondes assemblés des premières grandes compositions qui portent `morceau`, une graine avec plan chacune. */
function mondesAvec(morceau: string, nombre: number): DefMonde[] {
  const mondes: DefMonde[] = [];
  for (const composition of CATALOGUE.grandes.filter((candidate) => candidate.refus === null && candidate.chemins.includes(morceau))) {
    for (let graine = 0; graine < 20 && mondes.length < nombre; graine++) {
      const entree = CATALOGUE.construireGrande(composition.id, graine);
      if (!('refus' in entree)) {
        mondes.push(entree.monde);
        break;
      }
    }
    if (mondes.length >= nombre) break;
  }
  return mondes;
}

const touchant = (monde: DefMonde, piece: string): string[] => monde.liaisons.filter((liaison) => liaison.entre.includes(piece)).map((liaison) => liaison.id).sort();

function engager(monde: DefMonde, partie: Partie, action: string, cible: string, parametre?: string): Partie {
  const resultat = jouer(monde, partie, { action, cible: idPublic(monde.id, cible), ...(parametre === undefined ? {} : { parametre: idPublic(monde.id, parametre) }) });
  expect(resultat.type, `${monde.id} : ${action} ${cible}`).toBe('engagee');
  return resultat.partie;
}

describe('M-11 dans les grandes stations (#236)', () => {
  const mondes = mondesAvec('m-11', 60);
  const BLINDEE = 'm-11/l-poste-sas';

  it('la remise ne s’ouvre que sur le vestiaire, fermée ; le sas, que par la porte blindée et la sortie', () => {
    expect(mondes.length).toBe(60);
    for (const monde of mondes) {
      expect(touchant(monde, 'm-11/p-remise'), monde.id).toEqual(['m-11/l-vestiaire-remise']);
      expect(monde.liaisons.find((liaison) => liaison.id === 'm-11/l-vestiaire-remise')?.ouverte, monde.id).toBe(false);
      const sas = touchant(monde, 'm-11/p-sas');
      expect(sas, monde.id).toContain(BLINDEE);
      for (const id of sas.filter((candidat) => candidat !== BLINDEE)) expect(id.startsWith('l-m-11-'), `${monde.id} : ${id}`).toBe(true);
      expect(monde.liaisons.find((liaison) => liaison.id === BLINDEE), monde.id).toMatchObject({ blindee: true, verrouillee: true, ouverte: false });
      for (const boucle of monde.boucles ?? []) expect(monde.liaisons.find((liaison) => liaison.id === boucle)?.entre, `${monde.id} : ${boucle}`).not.toContain('m-11/p-sas');
    }
  });

  it('alertée, venue d’une porte de boucle sur le poste, elle ne force jamais la porte blindée refermée', () => {
    const avecBoucle = mondes.filter((monde) => (monde.boucles ?? []).some((boucle) => monde.liaisons.find((liaison) => liaison.id === boucle)?.entre.includes('m-11/p-poste')));
    expect(avecBoucle.length, 'une station dont une porte de boucle donne sur le poste').toBeGreaterThan(0);
    for (const monde of avecBoucle) {
      const boucle = monde.liaisons.find((liaison) => monde.boucles?.includes(liaison.id) === true && liaison.entre.includes('m-11/p-poste'));
      const voisine = boucle?.entre.find((piece) => piece !== 'm-11/p-poste') ?? '';
      const depart = nouvellePartie(monde, { version: 'm11-grande', graine: 236 });
      // Verrou levé, porte blindée refermée derrière le passager ; créature alertée de l'autre côté de la porte de boucle, sur
      // la piste du poste.
      let partie: Partie = {
        ...depart,
        etat: {
          ...depart.etat,
          piece: 'm-11/p-sas',
          verrous: (depart.etat.verrous ?? []).filter((verrou) => verrou !== BLINDEE),
          liaisons: { ...depart.etat.liaisons, [BLINDEE]: false, [boucle?.id ?? '']: true },
          creature: { piece: voisine, indice: { piece: 'm-11/p-poste', par: boucle?.id ?? '' }, contact: true, repit: false, alcove: false, perdues: 0, connues: [], engagee: null },
        },
      };
      const vues: string[] = [];
      const pieces = new Set<string>();
      const attendre = (tours: number): void => {
        for (let tour = 0; tour < tours; tour++) {
          const resultat = jouer(monde, partie, { action: 'attendre', cible: idPublic(monde.id, 'm-11/p-sas') });
          if (resultat.type !== 'engagee') throw new Error(`${monde.id} : attente refusée.`);
          partie = resultat.partie;
          vues.push(...resultat.evenements.map((evenement) => evenement.type));
          pieces.add(partie.etat.creature?.piece ?? '');
        }
      };
      attendre(3);
      expect(pieces.has('m-11/p-poste'), `${monde.id} : elle rejoint le poste par la porte de boucle`).toBe(true);
      // Devant la porte blindée, sur la piste du sas : une porte ordinaire, elle la forcerait (D-279).
      const { creature } = partie.etat;
      if (creature === null) throw new Error(`${monde.id} : créature absente.`);
      partie = { ...partie, etat: { ...partie.etat, creature: { ...creature, piece: 'm-11/p-poste', indice: { piece: 'm-11/p-sas', par: BLINDEE } } } };
      attendre(12);
      expect(pieces.has('m-11/p-sas'), monde.id).toBe(false);
      expect(vues, monde.id).not.toContain('porte_secouee');
      expect(vues, monde.id).not.toContain('porte_enfoncee');
      expect(partie.etat.liaisons[BLINDEE], monde.id).toBe(false);
      expect(partie.etat.sante, monde.id).toBe('indemne');
    }
  });
});

describe('M-12 dans les grandes stations (#236)', () => {
  const mondes = mondesAvec('m-12', 30);
  const DRONE = 'm-12/o-drone';

  it('rail, poignée et chariot restent dans leur morceau ; aucune porte de boucle sur la réserve', () => {
    expect(mondes.length).toBe(30);
    for (const monde of mondes) {
      const objet = (id: string) => monde.objets.find((candidat) => candidat.id === id);
      expect(objet(DRONE), monde.id).toMatchObject({ piece: 'm-12/p-atelier', drone: { rail: 'm-12/l-atelier-poste', poignee: 'm-12/o-poignee' } });
      expect(objet('m-12/o-poignee')?.piece, monde.id).toBe('m-12/p-poste');
      expect(objet('m-12/o-chariot'), monde.id).toMatchObject({ piece: 'm-12/p-palier', obstacle: { passage: 'm-12/l-palier-quai' } });
      for (const boucle of monde.boucles ?? []) expect(monde.liaisons.find((liaison) => liaison.id === boucle)?.entre, `${monde.id} : ${boucle}`).not.toContain('m-12/p-stockage');
    }
  });

  it('déraillé, le drone se replace puis se réarme sur place, tient la poignée, et le chariot rangé libère le passage', () => {
    for (const monde of mondes) {
      const depart = nouvellePartie(monde, { version: 'm12-grande', graine: 236 });
      // Sans créature, depuis l'atelier : seules les règles du drone et du chariot jouent.
      let partie: Partie = { ...depart, etat: { ...depart.etat, piece: 'm-12/p-atelier', creature: null } };
      partie = engager(monde, partie, 'envoyer', DRONE);
      expect(partie.etat.drones?.phases[DRONE], monde.id).toBe('trajet');
      // Une attaque l'a sorti du rail (D-305) : il a lâché la poignée.
      partie = { ...partie, etat: { ...partie.etat, drones: { phases: { ...partie.etat.drones?.phases, [DRONE]: 'deraille' }, tenue: null, bruits: [] } } };
      partie = engager(monde, partie, 'aller', 'm-12/l-atelier-poste');
      expect(observer(monde, partie.etat).menu.some((option) => option.action === 'rearmer' && option.disponible), monde.id).toBe(false);
      partie = engager(monde, partie, 'replacer', DRONE);
      partie = engager(monde, partie, 'rearmer', DRONE);
      expect(partie.etat.drones?.phases[DRONE], monde.id).toBe('maintien');
      partie = engager(monde, partie, 'aller', 'm-12/l-poste-palier');
      partie = engager(monde, partie, 'deplacer', 'm-12/o-chariot', 'm-12/pos-rangement');
      expect(partie.etat.drones?.phases[DRONE], monde.id).toBe('termine');
      partie = engager(monde, partie, 'aller', 'm-12/l-palier-quai');
      expect(partie.etat.piece, monde.id).toBe('m-12/p-quai');
    }
  });
});
