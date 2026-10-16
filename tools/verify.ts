import { spawn, spawnSync } from 'node:child_process';
import { isMainModule } from './repo-files';

// Vérification complète (AP-08) : une étape = un script npm. Ajouter les suivantes ici. Les étapes courtes d'abord, dans
// l'ordre, jusqu'au premier échec ; puis les longues en même temps, chacune dans son processus (#180). La CI lance les mêmes
// étapes en jobs parallèles (.github/workflows/verification.yml).
export const STEPS: readonly string[] = ['lint', 'typecheck', 'check:imports', 'check:links', 'check:texts', 'check:stations', 'test', 'parcours', 'build'];

/** Étapes longues, lancées en parallèle en local, en jobs à part dans la CI. */
export const LONGUES: readonly string[] = ['check:texts', 'check:stations', 'test'];

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

/** Lance les étapes toutes en même temps ; chaque résultat garde sa durée. */
export async function runStepsTogether(steps: readonly string[], run: (step: string) => Promise<number>): Promise<StepResult[]> {
  return Promise.all(
    steps.map(async (step) => {
      const start = performance.now();
      const exitCode = await run(step);
      return { step, status: exitCode === 0 ? 'OK' : 'KO', exitCode, seconds: (performance.now() - start) / 1000 } as const;
    }),
  );
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

/** Étape longue : sa sortie est gardée puis affichée d'un bloc quand elle finit, pour ne pas mêler les étapes. */
function runNpmScriptBuffered(step: string, complet: boolean): Promise<number> {
  return new Promise((resolve) => {
    const enfant = spawn(commande(step, complet), { shell: true, stdio: ['ignore', 'pipe', 'pipe'], env: environnement(complet) });
    const morceaux: Buffer[] = [];
    enfant.stdout.on('data', (morceau: Buffer) => morceaux.push(morceau));
    enfant.stderr.on('data', (morceau: Buffer) => morceaux.push(morceau));
    enfant.on('close', (code) => {
      console.log(`\n[en parallèle] ${commande(step, complet)}`);
      process.stdout.write(Buffer.concat(morceaux));
      resolve(code ?? 1);
    });
  });
}

async function main(): Promise<void> {
  const argumentsCli = process.argv.slice(2);
  const inconnu = argumentsCli.find((argument) => argument !== '--complet' && argument !== '--sequentiel' && !argument.startsWith('--sauf='));
  if (inconnu !== undefined) throw new Error(`Option inconnue : ${inconnu}.`);
  const complet = argumentsCli.includes('--complet');
  const steps = stepsDemandees(argumentsCli);
  const debut = performance.now();
  let results: StepResult[];
  if (argumentsCli.includes('--sequentiel')) {
    results = runSteps(steps, (step, index) => runNpmScript(step, `${index + 1}/${steps.length}`, complet));
  } else {
    const courtes = steps.filter((step) => !LONGUES.includes(step));
    const longues = steps.filter((step) => LONGUES.includes(step));
    results = runSteps(courtes, (step, index) => runNpmScript(step, `${index + 1}/${courtes.length}`, complet));
    if (results.every((result) => result.status === 'OK') && longues.length > 0) {
      console.log(`\nÉtapes longues en parallèle : ${longues.join(', ')}…`);
      results.push(...(await runStepsTogether(longues, (step) => runNpmScriptBuffered(step, complet))));
    } else {
      results.push(...longues.map((step) => ({ step, status: 'non lancée' }) as const));
    }
    results.sort((a, b) => STEPS.indexOf(a.step) - STEPS.indexOf(b.step));
  }
  console.log(`\nRésumé de la vérification ${complet ? 'complète, mode complet' : 'complète'} :`);
  for (const result of results) {
    const duration = result.seconds === undefined ? '' : `${result.seconds.toFixed(1)} s`;
    console.log(`  ${result.status.padEnd(10)} ${result.step.padEnd(14)} ${duration}`.trimEnd());
  }
  console.log(`  ${'durée'.padEnd(10)} ${''.padEnd(14)} ${((performance.now() - debut) / 1000).toFixed(1)} s`);
  const echecs = results.filter((result) => result.status === 'KO');
  if (echecs.length === 0) {
    console.log('\nVérification complète : toutes les étapes sont vertes.');
  } else {
    console.error(`\nÉCHEC aux étapes ${echecs.map((echec) => `« ${echec.step} » (code ${echec.exitCode})`).join(', ')} : vérification en échec.`);
    process.exitCode = 1;
  }
}

if (isMainModule(import.meta.url)) {
  main().catch((erreur: unknown) => {
    console.error(erreur instanceof Error ? erreur.message : String(erreur));
    process.exitCode = 1;
  });
}
