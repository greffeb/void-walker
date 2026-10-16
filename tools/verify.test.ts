import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './repo-files';
import { LONGUES, STEPS, runSteps, stepsDemandees } from './verify';

describe('runSteps', () => {
  it('suit l’ordre de la vérification complète', () => {
    expect(STEPS).toEqual(['lint', 'typecheck', 'check:imports', 'check:links', 'check:texts', 'check:stations', 'check:sortie', 'test', 'parcours', 'build']);
  });

  it('lance toutes les étapes quand elles réussissent', () => {
    const launched: string[] = [];
    const results = runSteps(['a', 'b'], (step) => {
      launched.push(step);
      return 0;
    });
    expect(launched).toEqual(['a', 'b']);
    expect(results.map((result) => result.status)).toEqual(['OK', 'OK']);
  });

  it('s’arrête au premier échec et marque la suite comme non lancée', () => {
    const launched: string[] = [];
    const results = runSteps(['a', 'b', 'c'], (step) => {
      launched.push(step);
      return step === 'b' ? 2 : 0;
    });
    expect(launched).toEqual(['a', 'b']);
    expect(results.map(({ step, status, exitCode }) => ({ step, status, exitCode }))).toEqual([
      { step: 'a', status: 'OK', exitCode: 0 },
      { step: 'b', status: 'KO', exitCode: 2 },
      { step: 'c', status: 'non lancée', exitCode: undefined },
    ]);
  });
});

describe('étapes de la CI (#180)', () => {
  it('--sauf retire des étapes, refuse une étape inconnue', () => {
    expect(stepsDemandees([])).toEqual([...STEPS]);
    expect(stepsDemandees(['--sauf=check:texts,test'])).toEqual(STEPS.filter((step) => step !== 'check:texts' && step !== 'test'));
    expect(() => stepsDemandees(['--sauf=tset'])).toThrow('Étape inconnue : tset.');
  });

  it('la CI lance toutes les étapes de verify : les courtes dans un job, chaque longue dans ses lots, sans lot oublié', () => {
    const workflow = readFileSync(join(REPO_ROOT, '.github/workflows/verification.yml'), 'utf8');
    expect(LONGUES.every((step) => STEPS.includes(step))).toBe(true);
    expect(workflow).toContain(`npx tsx tools/verify.ts --sauf=${LONGUES.join(',')}`);
    // Chaque job long : sa matrice compte autant de lots que le total de son --lot (ou de son --shard).
    const jobs = workflow.split(/\n {2}(?=[a-z-]+:\n)/).slice(1);
    const lances = new Set<string>();
    for (const job of jobs) {
      const etape = /npm run ([\w:]+) -- --(?:lot|shard)=\$\{\{ matrix\.(\w+) \}\}\/(\d+)/.exec(job);
      if (etape === null) continue;
      const [, step = '', cle = '', total = ''] = etape;
      lances.add(step);
      const valeurs = new RegExp(`${cle}: \\[([\\d, ]+)\\]`).exec(job)?.[1]?.split(',').map((valeur) => Number(valeur.trim()));
      expect(valeurs, step).toEqual(Array.from({ length: Number(total) }, (_, rang) => rang + 1));
    }
    expect([...lances].sort()).toEqual([...LONGUES].sort());
  });
});
