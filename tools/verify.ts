import { spawnSync } from 'node:child_process';
import { isMainModule } from './repo-files';

// Vérification complète (AP-08) : une étape = un script npm, dans l'ordre, jusqu'au premier échec. Ajouter les suivantes ici.
// Les étapes longues se partagent elles-mêmes entre les cœurs (check:stations, check:texts, vitest) : les lancer en même
// temps n'y gagne presque rien et fait dépasser leurs délais aux tests (#180). La CI lance les mêmes étapes en jobs
// parallèles (.github/workflows/verification.yml).
export const STEPS: readonly string[] = ['lint', 'typecheck', 'check:imports', 'check:links', 'check:texts', 'check:stations', 'check:sortie', 'test', 'parcours', 'build'];

/** Étapes longues, en jobs à part dans la CI. */
export const LONGUES: readonly string[] = ['check:texts', 'check:stations', 'check:sortie', 'test'];

/**
 * Mode complet (#180), facultatif, hors CI : tout refaire en entier. Catalogue prouvé deux fois (check:stations et le test
 * du catalogue), 1 000 plans par chemin et les 1 000 tirages de NOUVELLE PARTIE, aucun verdict repris du cache.
 */
export const ARGUMENTS_COMPLETS: Readonly<Record<string, readonly string[]>> = {
  'check:texts': ['--sans-cache'],
  'check:stations': ['--complet'],
};
/** Variable qui active, dans `npm run test`, les tests du catalogue entier (tools/catalogue-complet.test.ts). */
export const VARIABLE_COMPLET = 'VERIFY_COMPLET';

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

/** Étapes demandées : toutes, moins celles de `--sauf=a,b` ; une étape inconnue est une erreur. */
export function stepsDemandees(argumentsCli: readonly string[]): string[] {
  const sauf = argumentsCli.find((argument) => argument.startsWith('--sauf='))?.slice('--sauf='.length).split(',').filter(Boolean) ?? [];
  const inconnue = sauf.find((step) => !STEPS.includes(step));
  if (inconnue !== undefined) throw new Error(`Étape inconnue : ${inconnue}.`);
  return STEPS.filter((step) => !sauf.includes(step));
}

function commande(step: string, complet: boolean): string {
  const extra = complet ? (ARGUMENTS_COMPLETS[step] ?? []) : [];
  // Commande en une seule chaîne : même syntaxe pour cmd.exe et sh.
  return `npm run ${step}${extra.length > 0 ? ` -- ${extra.join(' ')}` : ''}`;
}

function environnement(complet: boolean): NodeJS.ProcessEnv {
  return complet ? { ...process.env, [VARIABLE_COMPLET]: '1' } : process.env;
}

function runNpmScript(step: string, label: string, complet: boolean): number {
  console.log(`\n[${label}] ${commande(step, complet)}`);
  const result = spawnSync(commande(step, complet), { shell: true, stdio: 'inherit', env: environnement(complet) });
  return result.status ?? 1;
}

async function main(): Promise<void> {
  const argumentsCli = process.argv.slice(2);
  const inconnu = argumentsCli.find((argument) => argument !== '--complet' && !argument.startsWith('--sauf='));
  if (inconnu !== undefined) throw new Error(`Option inconnue : ${inconnu}.`);
  const complet = argumentsCli.includes('--complet');
  const steps = stepsDemandees(argumentsCli);
  const debut = performance.now();
  const results = runSteps(steps, (step, index) => runNpmScript(step, `${index + 1}/${steps.length}`, complet));
  console.log(`\nRésumé de la vérification ${complet ? 'complète, mode complet' : 'complète'} :`);
  for (const result of results) {
    const duration = result.seconds === undefined ? '' : `${result.seconds.toFixed(1)} s`;
    console.log(`  ${result.status.padEnd(10)} ${result.step.padEnd(14)} ${duration}`.trimEnd());
  }
  console.log(`  ${'durée'.padEnd(10)} ${''.padEnd(14)} ${((performance.now() - debut) / 1000).toFixed(1)} s`);
  const failure = results.find((result) => result.status === 'KO');
  if (failure === undefined) {
    console.log('\nVérification complète : toutes les étapes sont vertes.');
  } else {
    console.error(`\nÉCHEC à l'étape « ${failure.step} » (code ${failure.exitCode}) : vérification interrompue.`);
    process.exitCode = 1;
  }
}

if (isMainModule(import.meta.url)) {
  main().catch((erreur: unknown) => {
    console.error(erreur instanceof Error ? erreur.message : String(erreur));
    process.exitCode = 1;
  });
}
