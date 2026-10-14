import { STEPS, runSteps } from './verify';

describe('runSteps', () => {
  it('suit l’ordre de la vérification complète', () => {
    expect(STEPS).toEqual(['lint', 'typecheck', 'check:imports', 'check:links', 'check:texts', 'check:stations', 'test', 'parcours', 'build']);
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
