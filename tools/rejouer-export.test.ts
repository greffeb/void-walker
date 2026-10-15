import { exporter, jouer, nouvellePartie, observer, type DefMonde, type Partie } from '../engine';
import { MONDES, type EntreeMonde } from '../content';
import { CATALOGUE } from './catalogue';
import { rejouerExport } from './rejouer-export';

const { monde } = MONDES['monde-test'] as EntreeMonde;

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

  it('refuse un monde inconnu, même nommé comme une propriété d’objet', () => {
    const fichier = { ...exporter(monde, partieJouee()), monde: 'constructor' };
    expect(() => rejouerExport(JSON.stringify(fichier), 'v')).toThrow(/Monde inconnu/);
  });

  it('rejoue à l’identique l’export d’une station tirée (#152)', () => {
    const entree = CATALOGUE.resoudre('m07-m03-soute-2718281828');
    if ('refus' in entree) throw new Error(entree.refus);
    const station: DefMonde = entree.monde;
    let partie = nouvellePartie(station, { version: 'v', graine: 9 });
    for (let engagees = 0; engagees < 3; engagees++) {
      const suite = observer(station, partie.etat)
        .menu.filter((choix) => choix.disponible)
        .map((choix) => jouer(station, partie, choix.commande))
        .find((resultat) => resultat.type === 'engagee');
      if (suite === undefined) throw new Error(`Aucune action engagée après ${engagees}.`);
      partie = suite.partie;
    }
    const rapport = rejouerExport(JSON.stringify(exporter(station, partie)), 'v');
    expect(rapport.lignes[0]).toBe('Export : monde « m07-m03-soute-2718281828 », version v, graine 9, 3 actions.');
    expect(rapport.identique).toBe(true);
  });

  it('refuse une station dont la composition n’existe pas, avec le motif du catalogue', () => {
    const fichier = { ...exporter(monde, partieJouee()), monde: 'm07-m03-cale-5' };
    expect(() => rejouerExport(JSON.stringify(fichier), 'v')).toThrow('Monde inconnu : m07-m03-cale-5. Station inconnue : m07-m03-cale-5.');
  });
});
