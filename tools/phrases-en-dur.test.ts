import { phrasesEnDur, phrasesEnDurDeLApp } from './phrases-en-dur';
import { REPO_ROOT } from './repo-files';

const textes = (fichier: string, source: string): string[] => phrasesEnDur(fichier, source).map((phrase) => phrase.texte);

describe('phrases en dur de l’interface (#239)', () => {
  it('repère le texte JSX, les attributs lus et les chaînes en français', () => {
    const source = `
      const titre = 'Taille du texte';
      const note = 'la partie s’arrête ici';
      const attente = \`\${nombre} rapports attendent…\`;
      export const Vue = () => (
        <section aria-label="Parole d'IA Station" className="parole ia">
          <p>Continuer</p>
          <Rail libelle="Ambiance" coupe="coupée" />
        </section>
      );`;
    expect(textes('app/Vue.tsx', source)).toEqual([
      'Taille du texte',
      'la partie s’arrête ici',
      'rapports attendent…',
      "Parole d'IA Station",
      'Continuer',
      'Ambiance',
      'coupée',
    ]);
  });

  it('laisse les classes, les clés, les touches, les erreurs et le nom du jeu', () => {
    const source = `
      import { LIBELLES } from './libelles';
      type Zone = 'Inventaire';
      const etats = { Fermee: LIBELLES.jeu.porte.fermee };
      if (evenement.key === 'Escape') fermer();
      if (!ok) throw new Error('Partie illisible.');
      console.warn('Échec du son.');
      export const Vue = () => (
        <h1 className="titre-accueil" aria-label="VOID WALKER" data-son="clic">
          {LIBELLES.commun.options} ▸ / _
        </h1>
      );`;
    expect(textes('app/Vue.tsx', source)).toEqual([]);
  });

  it('aucune dans app/ : les libellés vivent dans app/libelles/', () => {
    expect(phrasesEnDurDeLApp(REPO_ROOT).map(({ fichier, ligne, texte }) => `${fichier}:${ligne} ${texte}`)).toEqual([]);
  });
});
