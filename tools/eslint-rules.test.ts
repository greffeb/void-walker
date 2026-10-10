import { join } from 'node:path';
import { ESLint } from 'eslint';
import { REPO_ROOT } from './repo-files';

const eslint = new ESLint({ cwd: REPO_ROOT });

async function ruleIds(path: string, code: string): Promise<(string | null)[]> {
  const [result] = await eslint.lintText(code, { filePath: join(REPO_ROOT, path) });
  return result?.messages.map((message) => message.ruleId) ?? [];
}

describe('règles ESLint du dépôt', { timeout: 30_000 }, () => {
  it('interdit Math.random partout (AP-02)', async () => {
    for (const path of ['engine/x.ts', 'content/x.ts', 'app/x.tsx', 'cli/x.ts', 'tools/x.ts']) {
      expect(await ruleIds(path, 'export const n = Math.random();\n'), path).toEqual(['no-restricted-properties']);
    }
  });

  it('interdit Date et performance dans engine/ et content/', async () => {
    expect(await ruleIds('engine/x.ts', 'export const t = Date.now();\n')).toEqual(['no-restricted-globals']);
    expect(await ruleIds('engine/x.ts', 'export const d = new Date();\n')).toEqual(['no-restricted-globals']);
    expect(await ruleIds('content/x.ts', 'export const t = performance.now();\n')).toEqual(['no-restricted-globals']);
  });

  it('laisse Date et performance hors de engine/ et content/', async () => {
    expect(await ruleIds('cli/x.ts', 'export const t = Date.now() + performance.now();\n')).toEqual([]);
    expect(await ruleIds('tools/x.ts', 'export const d = new Date();\n')).toEqual([]);
  });
});
