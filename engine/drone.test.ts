import { apercu, exporter, jouer, nouvellePartie, rejouer, type Partie } from './partie';
import { carte } from './carte';
import { observer } from './observation';
import { idPublic, validerMonde, type DefMonde } from './monde';
import { piecesSansAir } from './etat';
import { sortiePossible } from './sortie';

// Noms et identifiants sans rapport avec le morceau : seules les qualités font règle.
const MONDE: DefMonde = {
  id: 'essai-rail', depart: 'a',
  pieces: ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id, nom: id })),
  liaisons: [
    { id: 'ac', nom: 'porte', entre: ['a', 'c'], ouverte: true },
    { id: 'ab', nom: 'porte', entre: ['a', 'b'], ouverte: true },
    { id: 'bd', nom: 'porte', entre: ['b', 'd'], ouverte: true },
    { id: 'cd', nom: 'porte', entre: ['c', 'd'], ouverte: true },
    { id: 'ce', nom: 'porte', entre: ['c', 'e'], ouverte: true },
    { id: 'df', nom: 'porte', entre: ['d', 'f'], ouverte: true },
  ],
  positions: [
    { id: 'barre', nom: 'barre', piece: 'd' },
    { id: 'range', nom: 'range', piece: 'd' },
  ],
  objets: [
    { id: 'x', nom: 'x', piece: 'a', portable: false, drone: { rail: 'ac', poignee: 'y' } },
    { id: 'y', nom: 'y', piece: 'c', portable: false, poignee: true },
    { id: 'z', nom: 'z', piece: 'd', portable: false, deplacable: true, position: 'barre',
      obstacle: { passage: 'df', rangement: 'range', maintien: 'y' } },
  ],
  creature: { piece: 'e' },
};
const debut = (monde = MONDE): Partie => nouvellePartie(monde, { version: 'test-drone', graine: 203 });
const commande = (action: string, cible: string, parametre?: string) => ({
  action, cible: idPublic(MONDE.id, cible), ...(parametre === undefined ? {} : { parametre: idPublic(MONDE.id, parametre) }),
});
function pas(partie: Partie, action: string, cible: string, parametre?: string, monde = MONDE): Partie {
  const resultat = jouer(monde, partie, commande(action, cible, parametre));
  expect(resultat.type, `${action} ${cible}`).toBe('engagee');
  return resultat.partie;
}
function panne(monde = MONDE): Partie {
  return pas(pas(debut(monde), 'envoyer', 'x', undefined, monde), 'aller', 'ab', undefined, monde);
}
function surPlace(partie: Partie): Partie {
  return pas(pas(partie, 'aller', 'bd'), 'aller', 'cd');
}

describe('rail local et coopération', () => {
  it('valide le monde et garde les états anciens sans champ additionnel', () => {
    expect(validerMonde(MONDE)).toEqual([]);
    expect(debut({ ...MONDE, objets: [] }).etat).not.toHaveProperty('drones');
  });
  it('envoie, rejoint le poste puis maintient au prochain engagement seulement', () => {
    const envoyee = pas(debut(), 'envoyer', 'x');
    expect(envoyee.etat.objets.x).toEqual({ type: 'piece', piece: 'c' });
    expect(envoyee.etat.drones?.phases.x).toBe('trajet');
    expect(envoyee.etat.creature?.piece).toBe('c');
    expect(panne().etat.drones?.phases.x).toBe('deraille');
  });
  it('garde le drone envoyé sur la carte, dans la pièce où il est parti', () => {
    const drones = (partie: Partie) => carte(MONDE, partie.etat).pieces.filter((piece) => piece.objets.some((objet) => objet.drone === true)).map((piece) => piece.piece.id);
    expect(drones(debut())).toEqual([idPublic(MONDE.id, 'a')]);
    expect(drones(pas(debut(), 'envoyer', 'x'))).toEqual([idPublic(MONDE.id, 'c')]);
  });
  it('ne traverse pas une porte fermée et ne revient pas gratuitement', () => {
    const fermee = pas(debut(), 'fermer', 'ac');
    const refus = jouer(MONDE, fermee, commande('envoyer', 'x'));
    expect(refus).toMatchObject({ type: 'refus', raison: 'ferme' });
    expect(refus.partie).toBe(fermee);
    let suite = panne();
    for (let n = 0; n < 8; n++) suite = pas(suite, 'attendre', 'b');
    expect(suite.etat.objets.x).toEqual({ type: 'piece', piece: 'c' });
    expect(suite.etat.drones?.phases.x).toBe('deraille');
  });
  it('quitter la poignée la relâche et ne permet pas de pousser seul', () => {
    let partie = pas(debut(), 'aller', 'ac');
    partie = pas(partie, 'tenir', 'y');
    expect(jouer(MONDE, partie, commande('fermer', 'ce'))).toMatchObject({ type: 'refus', raison: 'lacher_poignee' });
    partie = pas(partie, 'aller', 'cd');
    expect(partie.etat.drones?.tenue).toBeNull();
    expect(jouer(MONDE, partie, commande('deplacer', 'z', 'range'))).toMatchObject({ type: 'refus', raison: 'frein_serre' });
    expect(jouer(MONDE, partie, commande('aller', 'df'))).toMatchObject({ type: 'refus', raison: 'encombre_par_obstacle' });
  });
  it('préparation sûre, coopération réelle, passage durable et tâche terminée', () => {
    let partie = pas(debut(), 'aller', 'ac');
    partie = pas(partie, 'fermer', 'ce');
    partie = pas(partie, 'aller', 'ac');
    partie = pas(partie, 'envoyer', 'x');
    partie = pas(partie, 'aller', 'ab');
    partie = pas(partie, 'aller', 'bd');
    partie = pas(partie, 'deplacer', 'z', 'range');
    expect(partie.etat.drones?.phases.x).toBe('termine');
    partie = pas(partie, 'aller', 'df');
    expect(partie.etat.sante).toBe('indemne');
    expect(partie.enregistrement.actions.every((action) => action.tirages.length === 0)).toBe(true);
    expect(partie.etat.objets.x).toEqual({ type: 'piece', piece: 'c' });
  });
});

describe('panne réparable, vraie menace et observations', () => {
  it('replacer et réarmer sont deux engagements, sans soin ni consommable', () => {
    const locale = surPlace(panne());
    expect(jouer(MONDE, locale, commande('rearmer', 'x')).type).toBe('refus');
    const replacee = pas(locale, 'replacer', 'x');
    expect(replacee.etat.drones?.phases.x).toBe('a_rearmer');
    expect(replacee.etat.actions).toBe(locale.etat.actions + 1);
    const relancee = pas(replacee, 'rearmer', 'x');
    expect(relancee.etat.drones?.phases.x).toBe('maintien');
    expect(relancee.etat.actions).toBe(locale.etat.actions + 2);
    expect(relancee.etat.sante).toBe('blesse');
    expect(relancee.enregistrement.actions.at(-1)?.tirages).toHaveLength(1);
    expect(relancee.etat.doses).toEqual({});
  });

  describe('perceptions et budget de réaction ordinaires', () => {
    it('le passager visible et son départ vu priment sur le drone ; un jet consomme la réaction', () => {
      let partie = pas(debut(), 'envoyer', 'x');
      partie = pas(partie, 'aller', 'ac');
      expect(partie.etat.creature).toMatchObject({ contact: true, repit: true });
      partie = pas(partie, 'attendre', 'c');
      expect(partie.etat.sante).toBe('indemne');
      partie = pas(partie, 'aller', 'cd');
      expect(partie.etat.drones?.phases.x).toBe('maintien');
      expect(partie.etat.creature).toMatchObject({ piece: 'c', indice: { piece: 'd', par: 'cd' } });
      expect(partie.enregistrement.actions.at(-1)?.tirages).toHaveLength(1);
      partie = pas(partie, 'attendre', 'd');
      expect(partie.etat.drones?.phases.x).toBe('deraille');
      expect(partie.etat.creature?.piece).toBe('c');
    });

    it.each(['huile', 'froid'] as const)('%s : la réaction perdue ne renverse pas le drone', (cause) => {
      const envoyee = pas(debut(), 'envoyer', 'x');
      if (envoyee.etat.creature === null) throw new Error('Fixture sans créature.');
      const ralentie: Partie = { ...envoyee, etat: { ...envoyee.etat,
        creature: { ...envoyee.etat.creature, ...(cause === 'huile' ? { perdues: 1 } : { ralentie: { saute: true } }) },
      } };
      const sautee = pas(ralentie, 'aller', 'ab');
      expect(sautee.etat.drones?.phases.x).toBe('maintien');
      expect(pas(sautee, 'attendre', 'b').etat.drones?.phases.x).toBe('deraille');
    });

    it('les machines couvrent le drone, sans privilège acoustique', () => {
      const monde = { ...MONDE, pieces: MONDE.pieces.map((piece) => piece.id === 'c' ? { ...piece, machines: true } : piece) };
      let partie = pas(debut(monde), 'envoyer', 'x', undefined, monde);
      partie = pas(partie, 'aller', 'ab', undefined, monde);
      expect(partie.etat.creature?.piece).toBe('e');
      expect(partie.etat.drones?.phases.x).toBe('maintien');
    });

    it('à intensité égale, une alarme plus récente détourne l’inspection ; aucun âge non borné', () => {
      const monde: DefMonde = { ...MONDE, objets: [...MONDE.objets, { id: 't', nom: 't', piece: 'a', portable: false, avertisseur: { piece: 'e' } }] };
      let partie = pas(debut(monde), 'envoyer', 'x', undefined, monde);
      partie = pas(partie, 'declencher', 't', undefined, monde);
      expect(partie.etat.drones?.phases.x).toBe('maintien');
      expect(partie.etat.creature?.piece).toBe('e');
      expect(partie.etat.drones?.bruits).toEqual(['x', 't']);
      for (let i = 0; i < 6; i++) partie = pas(partie, 'attendre', 'a', undefined, monde);
      expect(partie.etat.drones?.phases.x).toBe('deraille');
      expect(partie.etat.drones?.bruits).toEqual([]);
    });

    it('la panne entendue est située par un passage, sans marqueur de créature sur la carte', () => {
      const envoyee = pas(debut(), 'envoyer', 'x');
      const resultat = jouer(MONDE, envoyee, commande('attendre', 'a'));
      expect(resultat.type).toBe('engagee');
      if (resultat.type !== 'engagee') throw new Error('Action non engagée.');
      expect(resultat.evenements).toContainEqual(expect.objectContaining({ type: 'drone_bruit_arrete' }));
      expect(observer(MONDE, resultat.partie.etat).carte.pieces.every((piece) => piece.creature === null)).toBe(true);
      expect(observer(MONDE, resultat.partie.etat).drones).toEqual([]);
    });

    it('arrêter puis reprendre exige deux gestes locaux ; aucun transport ni suivi', () => {
      let partie = pas(debut(), 'aller', 'ac');
      partie = pas(partie, 'fermer', 'ce');
      partie = pas(partie, 'aller', 'ac');
      partie = pas(partie, 'envoyer', 'x');
      partie = pas(partie, 'aller', 'ac');
      partie = pas(partie, 'arreter_drone', 'x');
      expect(partie.etat.drones?.phases.x).toBe('arrete');
      expect(jouer(MONDE, partie, commande('prendre', 'x')).partie).toBe(partie);
      partie = pas(partie, 'reprendre_drone', 'x');
      partie = pas(partie, 'aller', 'cd');
      expect(partie.etat.objets.x).toEqual({ type: 'piece', piece: 'c' });
      expect(jouer(MONDE, partie, commande('arreter_drone', 'x')).partie).toBe(partie);
    });
  });

  describe('obstacle matériel, dangers et sortie réparable', () => {
    it('le chariot empêche aussi la créature de passer, sans supprimer le chemin sonore', () => {
      const monde = { ...MONDE, creature: { piece: 'f' } };
      let partie = pas(debut(monde), 'envoyer', 'x', undefined, monde);
      for (let i = 0; i < 4; i++) partie = pas(partie, 'attendre', 'a', undefined, monde);
      expect(partie.etat.creature).toMatchObject({ piece: 'f', indice: { piece: 'c' } });
      expect(partie.etat.drones?.phases.x).toBe('maintien');
    });

    it('le feu passe le passage encombré ; le drone ne tombe pas en panne, le passager brûle', () => {
      const monde = { ...MONDE, pieces: MONDE.pieces.map((piece) => piece.id === 'f' ? { ...piece, feu: true } : piece) };
      let partie = pas(debut(monde), 'envoyer', 'x', undefined, monde);
      partie = pas(partie, 'aller', 'ac', undefined, monde);
      expect(partie.etat.feu).toContain('d');
      partie = pas(partie, 'attendre', 'c', undefined, monde);
      partie = pas(partie, 'attendre', 'c', undefined, monde);
      expect(partie.etat.drones?.phases.x).toBe('maintien');
      expect(partie.etat.sante).not.toBe('indemne');
    });

    it('le vide traverse le passage encombré ; seul le passager a besoin de protection', () => {
      const monde: DefMonde = { ...MONDE, objets: [...MONDE.objets,
        { id: 'v', nom: 'v', piece: 'f', portable: false, vitrageExterieur: true },
        { id: 's', nom: 's', piece: 'a', protection: true },
      ] };
      const initiale = debut(monde);
      const partie: Partie = { ...initiale, etat: { ...initiale.etat, breches: ['v'], objets: { ...initiale.etat.objets, s: { type: 'passager', enfile: true } } } };
      expect(piecesSansAir(monde, partie.etat)).toContain('d');
      const envoyee = pas(partie, 'envoyer', 'x', undefined, monde);
      const tenue = pas(envoyee, 'attendre', 'a', undefined, monde);
      expect(tenue.etat.drones?.phases.x).toBe('maintien');
      expect(tenue.etat.creature?.neutralisee).toBeDefined();
      expect(tenue.etat.sante).toBe('indemne');
      const sansProtection: Partie = { ...partie, etat: { ...partie.etat, objets: { ...partie.etat.objets, s: { type: 'piece', piece: 'a' } } } };
      expect(pas(sansProtection, 'envoyer', 'x', undefined, monde).etat.sante).toBe('vaincu');
    });

    it('le froid blesse le passager, sans modifier le drone', () => {
      const monde = { ...MONDE, pieces: MONDE.pieces.map((piece) => piece.id === 'c' ? { ...piece, froide: true } : piece) };
      let partie = pas(debut(monde), 'aller', 'ac', undefined, monde);
      partie = pas(partie, 'fermer', 'ce', undefined, monde);
      partie = pas(partie, 'aller', 'ac', undefined, monde);
      partie = pas(partie, 'envoyer', 'x', undefined, monde);
      partie = pas(partie, 'aller', 'ac', undefined, monde);
      partie = pas(partie, 'attendre', 'c', undefined, monde);
      partie = pas(partie, 'attendre', 'c', undefined, monde);
      expect(partie.etat.sante).toBe('blesse');
      expect(partie.etat.drones?.phases.x).toBe('maintien');
    });

    it('sortiePossible distingue une panne réparable d’un poste définitivement inaccessible', () => {
      const monde: DefMonde = { ...MONDE,
        pieces: [...MONDE.pieces, { id: 'g', nom: 'g', sousPosition: true }],
        liaisons: [...MONDE.liaisons, { id: 'fg', nom: 'porte', entre: ['f', 'g'], ouverte: false }],
        objets: [...MONDE.objets,
          { id: 'capsule', nom: 'capsule', piece: 'f', portable: false, capsule: { interieur: 'g', alimentee: true } },
          { id: 'pupitre', nom: 'pupitre', piece: 'g', portable: false, depart: 'capsule' },
        ],
      };
      expect(sortiePossible(monde, panne(monde).etat)).toBe(true);
      const initiale = debut(monde);
      const bloque = { ...monde, liaisons: monde.liaisons.map((liaison) => ['ac', 'cd'].includes(liaison.id) ? { ...liaison, manoeuvre: 'c' } : liaison) };
      const etat = { ...initiale.etat, liaisons: { ...initiale.etat.liaisons, ac: false, cd: false } };
      expect(sortiePossible(bloque, etat)).toBe(false);
    });
  });

  describe('diagnostics des qualités et références', () => {
    it.each([
      ['rail inconnu', { drone: { rail: 'absent', poignee: 'y' } }, 'rail hors du trajet local'],
      ['poignée inconnue', { drone: { rail: 'ac', poignee: 'absente' } }, 'poignée du drone inconnue'],
      ['drone portable', { portable: true }, 'dispositif de maintien portable'],
      ['drone déplaçable', { deplacable: true }, 'dispositif fixe déplaçable'],
      ['qualités incompatibles', { soin: 1 }, 'qualité étrangère'],
    ] as const)('%s est refusé explicitement', (_nom, changement, diagnostic) => {
      const monde = { ...MONDE, objets: MONDE.objets.map((objet) => objet.id === 'x' ? { ...objet, ...changement } : objet) };
      expect(validerMonde(monde).join('\n')).toContain(diagnostic);
      expect(() => debut(monde)).toThrow();
    });

    it.each([
      { passage: 'absent', rangement: 'range', maintien: 'y' },
      { passage: 'df', rangement: 'absent', maintien: 'y' },
      { passage: 'df', rangement: 'range', maintien: 'x' },
    ])('référence d’obstacle invalide : %j', (obstacle) => {
      expect(validerMonde({ ...MONDE, objets: MONDE.objets.map((objet) => objet.id === 'z' ? { ...objet, obstacle } : objet) }).length).toBeGreaterThan(0);
    });
  });
  it('refus, regards et aperçus sont gratuits, réparer à distance est impossible', () => {
    const partie = panne();
    expect(jouer(MONDE, partie, commande('replacer', 'x'))).toMatchObject({ type: 'refus', partie });
    expect(jouer(MONDE, partie, commande('regarder', 'b'))).toMatchObject({ type: 'consultation', partie });
    const locale = surPlace(partie);
    const avant = structuredClone(locale);
    for (let n = 0; n < 10; n++) {
      observer(MONDE, locale.etat);
      expect(apercu(MONDE, locale, commande('replacer', 'x')).type).toBe('apercu');
    }
    expect(locale).toEqual(avant);
  });
  it('ne révèle pas une panne hors de vue ni un drone jamais vu au poste sur la carte', () => {
    const vue = observer(MONDE, panne().etat);
    expect(vue.drones).toEqual([]);
    expect(vue.carte.pieces.find((piece) => piece.piece.nom === 'c')?.objets ?? []).toEqual([]);
    expect(observer(MONDE, debut().etat).carte.pieces[0]?.objets[0]).toMatchObject({ drone: true });
  });
  it('rejoue réellement un export avec réparation et dés enregistrés', () => {
    const partie = pas(pas(surPlace(panne()), 'replacer', 'x'), 'rearmer', 'x');
    const exportee = exporter(MONDE, partie);
    expect(rejouer(MONDE, exportee, 'test-drone').partie).toEqual(partie);
  });
  it('réparer sous menace peut tuer ; mort prioritaire, aucune invulnérabilité', () => {
    let partie = surPlace(panne());
    partie = pas(partie, 'attendre', 'c');
    partie = pas(partie, 'attendre', 'c');
    partie = pas(partie, 'replacer', 'x');
    const prevision = apercu(MONDE, partie, commande('rearmer', 'x'));
    expect(prevision).toMatchObject({ type: 'apercu', apercu: { danger: { type: 'interception_mortelle' } } });
    partie = pas(partie, 'rearmer', 'x');
    expect(partie.etat.sante).toBe('vaincu');
    expect(observer(MONDE, partie.etat).menu).toEqual([]);
  });
});
