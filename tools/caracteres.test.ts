import { readFileSync } from 'node:fs';
import { REPO_ROOT, displayPath, listRepoFiles } from './repo-files';

// Un accent grave avalé par un remplacement de texte (« `v », « `a », « `r », « `n ») laisse un caractère de contrôle
// dans le fichier : invisible à la relecture, il casse le Markdown. Les fichiers texte du dépôt n'en ont aucun.

const EXTENSIONS = ['.md', '.ts', '.tsx', '.js', '.json', '.jsonc', '.yml', '.css', '.html', '.sh'];
// Tabulation et fin de ligne admises ; un retour chariot seulement en fin de ligne (CRLF).
// eslint-disable-next-line no-control-regex -- c'est justement eux qu'on cherche.
const INTERDIT = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]|\r(?!\n)/;

describe('fichiers texte sans caractère de contrôle', () => {
  it('aucun caractère de contrôle ni retour chariot isolé', () => {
    const fautifs = listRepoFiles(REPO_ROOT, EXTENSIONS).flatMap((fichier) => {
      const lignes = readFileSync(fichier, 'utf8').split('\n');
      return lignes.flatMap((ligne, index) => (INTERDIT.test(ligne.replace(/\r$/, '')) ? [`${displayPath(REPO_ROOT, fichier)}:${index + 1}`] : []));
    });
    expect(fautifs).toEqual([]);
  });
});
