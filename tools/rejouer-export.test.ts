import { exporter, jouer, nouvellePartie, observer, type Partie } from '../engine';
import { MONDE_PAR_DEFAUT, MONDES, type EntreeMonde } from '../content';
import { rejouerExport } from './rejouer-export';

const { monde } = MONDES[MONDE_PAR_DEFAUT] as EntreeMonde;

function partieJouee(): Partie {
  let partie = nouvellePartie(monde, { version: 'v', graine: 9 });
  for (const action of ['prendre', 'ouvrir', 'aller', 'poser']) {
    const option = observer(monde, partie.etat).menu.find((choix) => choix.action === action && choix.disponible);
    if (option === undefined) throw new Error(action);
    const resultat = jouer(monde, partie, option.commande);
    if (resultat.type !== 'engagee') throw new Error(action);
    partie = resultat.partie;
  }
  return partie;
}

describe("rejoueur d'export", () => {
  it('confirme le même état final et la même observation', () => {
    const rapport = rejouerExport(JSON.stringify(exporter(monde, partieJouee(), 'note')), 'v');
    expect(rapport.identique).toBe(true);
    expect(rapport.lignes).toContain('Commentaire : note');
  });

  it('signale un export dont l’empreinte ne correspond pas', () => {
    const fichier = { ...exporter(monde, partieJouee()), empreinte: '00000000000000' };
    expect(rejouerExport(JSON.stringify(fichier), 'v').identique).toBe(false);
  });

  it('refuse un export d’une autre version', () => {
    expect(() => rejouerExport(JSON.stringify(exporter(monde, partieJouee())), 'autre')).toThrow(/version/);
  });
});
