import { interpreterVerification } from '../app/verification';
import { CATALOGUE } from './catalogue';
import { aTester, composerCommentaire, fichierVerification, liensDeTest, MARQUEUR_VERSION } from './etat-verification';

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

  it('la ligne « Tester : » du corps de la PR : identifiants dans l’ordre, sans doublon ni phrase', () => {
    expect(aTester('Résumé\n\nTester : m-12 ; `M12-m03-stockage` ; m-12 ; jouer la partie au bout\nCaptures : M12')).toEqual(['m-12', 'm12-m03-stockage']);
    expect(aTester('Rien à tester ici.')).toEqual([]);
  });

  it('liens construits comme le jeu lit l’adresse : monde fixe, composition, station exacte, refus avec son motif', () => {
    expect(liensDeTest([], ADRESSE, CATALOGUE)).toEqual([]);
    expect(liensDeTest(['m-12', 'm12-m03-stockage', 'm07-m03-soute-2718281828', 'inconnu-1'], ADRESSE, CATALOGUE)).toEqual([
      '**À tester :**',
      `- [m-12](${ADRESSE}?monde=m-12)`,
      `- [m12-m03-stockage](${ADRESSE}?station=m12-m03-stockage), un plan tiré à chaque nouvelle partie`,
      `- [m07-m03-soute-2718281828](${ADRESSE}?station=m07-m03-soute-2718281828)`,
      '- `inconnu-1` : refusé par le jeu (Station inconnue : inconnu-1.)',
    ]);
  });

  it('une grande composition a son lien, comme `?station=` dans le jeu (#283)', () => {
    const id = CATALOGUE.grandes[0]!.id;
    expect(liensDeTest([id], ADRESSE, CATALOGUE)).toEqual(['**À tester :**', `- [${id}](${ADRESSE}?station=${id}), un plan tiré à chaque nouvelle partie`]);
  });

  it('les liens suivent l’état, au début comme à la fin de la CI', () => {
    const liens = liensDeTest(['m-12'], ADRESSE, CATALOGUE);
    const debut = composerCommentaire({ etat: 'en_cours', adresse: ADRESSE, commit: COMMIT, liens }).split('\n');
    expect(debut.slice(debut.indexOf('**À tester :**') - 2, debut.indexOf('**À tester :**') + 2)).toEqual([
      expect.stringMatching(/^\*\*Vérification automatique :\*\*/), '', '**À tester :**', `- [m-12](${ADRESSE}?monde=m-12)`,
    ]);
    const captures = [MARQUEUR_VERSION, '## Version de test', '', `**Adresse :** ${ADRESSE}`, 'Commit `e27d220`', '', 'Captures d’un navigateur…', ''].join('\n');
    expect(composerCommentaire({ etat: 'verte', adresse: ADRESSE, commit: COMMIT, captures, liens }).split('\n')).toEqual([
      MARQUEUR_VERSION, '## Version de test', '', `**Adresse :** ${ADRESSE}`, 'Commit `e27d220`', '', '**Vérification automatique :** verte.', '',
      '**À tester :**', `- [m-12](${ADRESSE}?monde=m-12)`, '', 'Captures d’un navigateur…', '',
    ]);
  });
});
