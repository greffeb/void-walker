import { spawnSync } from 'node:child_process';
import { isMainModule } from './repo-files';

// Vérification complète (AP-08), dans l'ordre : une étape = un script npm. Ajouter les suivantes ici.
export const STEPS: readonly string[] = ['lint', 'typecheck', 'check:imports', 'check:links', 'check:texts', 'test', 'parcours'];

export interface StepResult {
  readonly step: string;
  readonly status: 'OK' | 'KO' | 'non lancée';
  readonly exitCode?: number;
  readonly seconds?: number;
}

/** Lance les étapes dans l'ordre et s'arrête au premier code de sortie non nul. */
export function runSteps(steps: readonly string[], run: (step: string, index: number) => number): StepResult[] {
  const results: StepResult[] = [];
  let failed = false;
  steps.forEach((step, index) => {
    if (failed) {
      results.push({ step, status: 'non lancée' });
      return;
    }
    const start = performance.now();
    const exitCode = run(step, index);
    failed = exitCode !== 0;
    results.push({ step, status: failed ? 'KO' : 'OK', exitCode, seconds: (performance.now() - start) / 1000 });
  });
  return results;
}

function runNpmScript(step: string, index: number): number {
  console.log(`\n[${index + 1}/${STEPS.length}] npm run ${step}`);
  // Commande en une seule chaîne : même syntaxe pour cmd.exe et sh.
  const result = spawnSync(`npm run ${step}`, { shell: true, stdio: 'inherit' });
  return result.status ?? 1;
}

if (isMainModule(import.meta.url)) {
  const results = runSteps(STEPS, runNpmScript);
  console.log('\nRésumé de la vérification complète :');
  for (const result of results) {
    const duration = result.seconds === undefined ? '' : `${result.seconds.toFixed(1)} s`;
    console.log(`  ${result.status.padEnd(10)} ${result.step.padEnd(14)} ${duration}`.trimEnd());
  }
  const failure = results.find((result) => result.status === 'KO');
  if (failure === undefined) {
    console.log('\nVérification complète : toutes les étapes sont vertes.');
  } else {
    console.error(`\nÉCHEC à l'étape « ${failure.step} » (code ${failure.exitCode}) : vérification interrompue.`);
    process.exitCode = 1;
  }
}
