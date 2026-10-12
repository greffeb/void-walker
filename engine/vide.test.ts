import { piecesSansAir } from './etat';
import { jouer, nouvellePartie, observer, validerMonde, type DefMonde, type Evenement, type IdAction, type OptionMenu, type Partie } from './index';

// Vide hors contenu d'AR-02 (C-03 §5.4, C-05 MX-02/MX-03, AR-02 §9) : fixture synthétique ; aucune règle ne lit un nom (D-078).
//
//   serre (en feu) ══porte_ss══ sas ══porte_sc══ couloir
//                               ╚~~grille_sv (non étanche, fermée)~~ vestiaire (créature)
const MONDE: DefMonde = {
  id: 'essai-vide',
  depart: 'sas',
  pieces: [
    { id: 'sas', nom: 'sas' },
    { id: 'serre', nom: 'serre', feu: true },
    { id: 'couloir', nom: 'couloir' },
    { id: 'vestiaire', nom: 'vestiaire' },
  ],
  liaisons: [
    { id: 'ss', nom: 'porte_ss', entre: ['sas', 'serre'], ouverte: false },
    { id: 'sc', nom: 'porte_sc', entre: ['sas', 'couloir'], ouverte: true },
    { id: 'sv', nom: 'grille_sv', entre: ['sas', 'vestiaire'], ouverte: false, nonEtanche: true },
  ],
  objets: [
    { id: 'combinaison', nom: 'combinaison', piece: 'sas', protection: true },
    { id: 'outil', nom: 'outil', piece: 'sas', perce: true },
    { id: 'huile', nom: 'huile', piece: 'sas', glissant: 1 },
    { id: 'hublot', nom: 'hublot', piece: 'sas', portable: false, vitrageExterieur: true },
    { id: 'vitre', nom: 'vitre', piece: 'sas', portable: false },
  ],
  creature: { piece: 'vestiaire' },
};

function option(courante: Partie, action: IdAction, nom: string, parametre?: string): OptionMenu | undefined {
  const nomme = (cible: OptionMenu['cible'] | undefined, attendu: string): boolean =>
    cible !== undefined && (cible.nom === attendu || (cible.sorte === 'passage' && cible.vers?.nom === attendu));
  return observer(MONDE, courante.etat).menu.find(
    (choix) => choix.action === action && nomme(choix.cible, nom) && (parametre === undefined || nomme(choix.parametre, parametre)),
  );
}

function engager(courante: Partie, action: IdAction, nom: string, parametre?: string): { partie: Partie; evenements: readonly Evenement[] } {
  const choix = option(courante, action, nom, parametre);
  if (choix === undefined || !choix.disponible) throw new Error(`Option ${action} ${nom} absente ou indisponible.`);
  const resultat = jouer(MONDE, courante, choix.commande);
  if (resultat.type !== 'engagee') throw new Error(`${action} ${nom} : ${resultat.type}.`);
  expect(resultat.tirages).toEqual([]);
  return { partie: resultat.partie, evenements: resultat.evenements };
}

function equipe(): Partie {
  let courante = nouvellePartie(MONDE, { version: 'vide-1', graine: 3 });
  for (const [action, nom] of [['enfiler', 'combinaison'], ['prendre', 'outil']] as const) courante = engager(courante, action, nom).partie;
  return courante;
}

describe('vide : fixture synthétique', () => {
  it('le monde est valide', () => {
    expect(validerMonde(MONDE)).toEqual([]);
  });

  it('T-18, MX-02 : le vide éteint le foyer qu’il atteint ; le feu n’entre pas dans une pièce sans air', () => {
    const perce = engager(equipe(), 'percer', 'hublot');
    expect(piecesSansAir(MONDE, perce.partie.etat)).toEqual(['sas', 'couloir', 'vestiaire']);
    const ouvert = engager(perce.partie, 'ouvrir', 'serre');
    expect(ouvert.partie.etat.feu).toEqual([]);
    expect(ouvert.partie.etat.expositions).toEqual([]);
    // L'ouverture montre les flammes (effet), puis le vide les éteint à la mise à jour des dangers, avant tout feu (C-03 §5.4).
    expect(ouvert.evenements).toEqual([
      expect.objectContaining({ type: 'passage_ouvert' }),
      expect.objectContaining({ type: 'feu_derriere' }),
      { type: 'air_perdu', pieces: [expect.objectContaining({ nom: 'serre' })] },
      { type: 'feu_eteint', piece: expect.objectContaining({ nom: 'serre' }) },
    ]);
    expect(ouvert.partie.etat.sante).toBe('indemne');
  });

  it('MX-03 : l’huile versée reste quand le vide passe, et le vide ne dépend pas de l’huile', () => {
    const huile = engager(engager(equipe(), 'prendre', 'huile').partie, 'verser', 'huile', 'couloir');
    const zones = huile.partie.etat.huile;
    expect(zones).not.toEqual([]);
    const perce = engager(huile.partie, 'percer', 'hublot');
    expect(perce.partie.etat.huile).toEqual(zones);
    expect(piecesSansAir(MONDE, perce.partie.etat)).toEqual(['sas', 'couloir', 'vestiaire']);
  });

  it('liaison non étanche : l’air passe même fermée ; la créature non vue devient inerte sans rien dire', () => {
    const perce = engager(equipe(), 'percer', 'hublot');
    expect(perce.partie.etat.creature).toMatchObject({ piece: 'vestiaire', neutralisee: 'inerte' });
    expect(perce.evenements.map((evenement) => evenement.type)).toEqual(['breche_ouverte', 'air_perdu']);
    // Pas de voyant sur une grille non étanche : rien n'est annoncé de l'autre côté.
    expect(observer(MONDE, perce.partie.etat).passages.find((vu) => vu.nom === 'grille_sv')).toMatchObject({ vide: false });
  });

  it('vitrage intérieur : rien à percer, refus sans effet', () => {
    const courante = equipe();
    expect(observer(MONDE, courante.etat).menu.filter((choix) => choix.action === 'percer').map((choix) => choix.cible.nom)).toEqual(['hublot']);
    const vitre = jouer(MONDE, courante, { action: 'percer', cible: observer(MONDE, courante.etat).objets.find((objet) => objet.nom === 'vitre')?.id ?? '' });
    expect(vitre).toMatchObject({ type: 'refus', raison: 'cible_absente' });
    expect(vitre.partie).toBe(courante);
  });

  it('sans outil qui perce, pas de « percer »', () => {
    const nue = engager(nouvellePartie(MONDE, { version: 'vide-1', graine: 3 }), 'enfiler', 'combinaison').partie;
    expect(observer(MONDE, nue.etat).menu.some((choix) => choix.action === 'percer')).toBe(false);
  });
});
