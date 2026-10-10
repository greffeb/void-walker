import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { checkLinks, githubSlug } from './check-links';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'void-walker-links-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function broken(files: Record<string, string>): string[] {
  for (const [path, text] of Object.entries(files)) {
    const fullPath = join(root, path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, text);
  }
  return checkLinks(root).broken.map((link) => `${link.file}:${link.line} ${link.url} : ${link.reason}`);
}

describe('githubSlug', () => {
  it('garde les accents, retire la ponctuation et remplace les espaces', () => {
    expect(githubSlug('4. Validation sur téléphone')).toBe('4-validation-sur-téléphone');
    expect(githubSlug('Arbitrage — décisions')).toBe('arbitrage--décisions');
    expect(githubSlug("Ce qu'il faut avoir fait (D-099)")).toBe('ce-quil-faut-avoir-fait-d-099');
  });
});

describe('checkLinks', () => {
  it('accepte des liens valides, y compris ancres, dossiers et liens http', () => {
    expect(
      broken({
        'docs/a.md': [
          '# Titre',
          '',
          'Voir [b](b.md), [section](b.md#arbitrage--décisions), [ici](#titre) et [contrats](contrats/).',
          '',
          'Référence [def].',
          '',
          '[def]: contrats/c.md',
          '',
          '[externe](https://example.com/absent.md) et [image](../logo.png).',
        ].join('\n'),
        'docs/b.md': '## Arbitrage — décisions\n',
        'docs/contrats/c.md': 'Retour au [début](../a.md#titre).\n',
        'logo.png': '',
      }),
    ).toEqual([]);
  });

  it('détecte un lien vers un fichier absent, avec sa ligne', () => {
    expect(broken({ 'docs/a.md': '# Titre\n\nVoir [absent](absent.md).\n' })).toEqual([
      'docs/a.md:3 absent.md : fichier introuvable (docs/absent.md)',
    ]);
  });

  it('détecte une ancre absente', () => {
    expect(
      broken({ 'docs/a.md': 'Voir [b](b.md#absent) et [ici](#absent).\n', 'docs/b.md': '# Présent\n' }),
    ).toEqual([
      'docs/a.md:1 b.md#absent : titre #absent introuvable dans docs/b.md',
      'docs/a.md:1 #absent : titre #absent introuvable dans docs/a.md',
    ]);
  });

  it('distingue la casse comme GitHub, même sous Windows', () => {
    expect(broken({ 'docs/a.md': '[b](B.md)\n', 'docs/b.md': '# B\n' })).toEqual([
      'docs/a.md:1 B.md : fichier introuvable (docs/B.md)',
    ]);
  });

  it('numérote les titres en double comme GitHub', () => {
    expect(
      broken({ 'a.md': '## Exemples\n\n## Exemples\n\n[1](#exemples) [2](#exemples-1) [3](#exemples-2)\n' }),
    ).toEqual(['a.md:5 #exemples-2 : titre #exemples-2 introuvable dans a.md']);
  });

  it('ignore le code et refuse une cible hors du dépôt', () => {
    expect(
      broken({ 'a.md': '```md\n[x](absent.md)\n```\n\n`[y](absent.md)`\n\n[z](../hors-depot.md)\n' }),
    ).toEqual(['a.md:7 ../hors-depot.md : cible hors du dépôt']);
  });

  it('ignore les dépendances et les sorties générées', () => {
    expect(
      broken({
        'node_modules/pkg/README.md': '[x](absent.md)\n',
        'dist/notes.md': '[x](absent.md)\n',
        'test-results/run/error-context.md': '[x](absent.md)\n',
      }),
    ).toEqual([]);
  });
});
