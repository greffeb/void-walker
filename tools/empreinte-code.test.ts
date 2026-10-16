import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { empreinteCode, fermetureDesImports, ouvrirCache, purgerCache } from './empreinte-code';

function depot(fichiers: Record<string, string>): string {
  const racine = mkdtempSync(join(tmpdir(), 'empreinte-'));
  for (const [chemin, texte] of Object.entries(fichiers)) {
    mkdirSync(join(racine, chemin, '..'), { recursive: true });
    writeFileSync(join(racine, chemin), texte);
  }
  return racine;
}

describe('empreinte du code qui rend un verdict (#180)', () => {
  const FICHIERS = {
    'tools/outil.ts': "import { regle } from '../engine';\nimport { readFileSync } from 'node:fs';\nexport const x = regle;",
    'engine/index.ts': "export { regle } from './regles';",
    'engine/regles.ts': 'export const regle = 1;',
    'engine/autre.ts': 'export const inutile = 2;',
    'package-lock.json': '{}',
  };

  it('suit les imports du dépôt de proche en proche, pas les paquets ni les fichiers non importés', () => {
    expect(fermetureDesImports(['tools/outil.ts'], depot(FICHIERS))).toEqual(['engine/index.ts', 'engine/regles.ts', 'tools/outil.ts']);
  });

  it('change quand une ligne d’un fichier importé ou des dépendances change, pas pour un fichier hors de la fermeture ; mêmes fins de ligne', () => {
    const base = empreinteCode(['tools/outil.ts'], depot(FICHIERS));
    expect(empreinteCode(['tools/outil.ts'], depot(FICHIERS))).toBe(base);
    expect(empreinteCode(['tools/outil.ts'], depot({ ...FICHIERS, 'engine/regles.ts': 'export const regle = 2;' }))).not.toBe(base);
    expect(empreinteCode(['tools/outil.ts'], depot({ ...FICHIERS, 'package-lock.json': '{"a":1}' }))).not.toBe(base);
    expect(empreinteCode(['tools/outil.ts'], depot({ ...FICHIERS, 'engine/autre.ts': 'export const inutile = 3;' }))).toBe(base);
    const crlf = Object.fromEntries(Object.entries(FICHIERS).map(([chemin, texte]) => [chemin, texte.replace(/\n/g, '\r\n')]));
    expect(empreinteCode(['tools/outil.ts'], depot(crlf))).toBe(base);
  });

  it('refuse un import introuvable plutôt que de l’oublier', () => {
    expect(() => fermetureDesImports(['tools/outil.ts'], depot({ ...FICHIERS, 'engine/index.ts': "export * from './absent';" }))).toThrow('import introuvable');
  });

  it('cache : relit ce qui a été écrit pour la même clé et la même empreinte ; une autre empreinte ne voit rien ; la purge garde la courante', () => {
    const racine = mkdtempSync(join(tmpdir(), 'cache-'));
    const cache = ouvrirCache('outil', 'a', racine);
    expect(cache.lire('cle')).toBeUndefined();
    cache.ecrire('cle', { verdict: 'prouvee' });
    expect(cache.lire('cle')).toEqual({ verdict: 'prouvee' });
    expect(cache.lire('autre')).toBeUndefined();
    expect(ouvrirCache('outil', 'b', racine).lire('cle')).toBeUndefined();
    purgerCache('outil', 'b', racine);
    expect(ouvrirCache('outil', 'a', racine).lire('cle')).toBeUndefined();
  });
});
