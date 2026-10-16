import { interpreterVerification } from '../app/verification';
import { composerCommentaire, fichierVerification, MARQUEUR_VERSION } from './etat-verification';

const COMMIT = 'e27d2204f1c3a9b8c7d6e5f4a3b2c1d0e9f8a7b6';
const ADRESSE = 'https://greffeb.github.io/void-walker/pr-42/';
const RUN = 'https://github.com/greffeb/void-walker/actions/runs/1';

describe('état de la vérification publié avec la version de test (#180)', () => {
  it('le fichier écrit par la CI est celui que lit le jeu', () => {
    for (const etat of ['en_cours', 'verte', 'echec'] as const) {
      expect(interpreterVerification(JSON.parse(JSON.stringify(fichierVerification(etat, COMMIT))), COMMIT)).toBe(etat);
    }
  });

  it('au début de la CI : lien, commit, vérification en cours, captures à venir', () => {
    const texte = composerCommentaire({ etat: 'en_cours', adresse: ADRESSE, commit: COMMIT, run: RUN });
    expect(texte.startsWith(MARQUEUR_VERSION)).toBe(true);
    expect(texte).toContain(`**Adresse :** ${ADRESSE}`);
    expect(texte).toContain('Commit `e27d220`');
    expect(texte).toContain(`**Vérification automatique :** en cours. La version est déjà jouable ; une validation envoyée maintenant ne comptera que si la vérification finit verte. [Suivre la vérification](${RUN}).`);
    expect(texte).toContain('Captures : à venir');
  });

  it('à la fin : le commentaire des captures, l’état inséré après le commit', () => {
    const captures = [MARQUEUR_VERSION, '## Version de test', '', `**Adresse :** ${ADRESSE}`, 'Commit `e27d220`', '', 'Captures d’un navigateur…', ''].join('\n');
    expect(composerCommentaire({ etat: 'verte', adresse: ADRESSE, commit: COMMIT, captures }).split('\n')).toEqual([
      MARQUEUR_VERSION, '## Version de test', '', `**Adresse :** ${ADRESSE}`, 'Commit `e27d220`', '', '**Vérification automatique :** verte.', '', 'Captures d’un navigateur…', '',
    ]);
    const echec = composerCommentaire({ etat: 'echec', adresse: ADRESSE, commit: COMMIT, captures: null });
    expect(echec).toContain('**Vérification automatique :** en échec. Une validation envoyée depuis cette version ne comptera pas.');
    expect(echec).toContain('Captures : absentes');
  });
});
