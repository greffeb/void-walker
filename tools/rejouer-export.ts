import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { empreinteEtat, lireExport, observer, rejouer } from '../engine';
import { extrairePartie } from '../report-service/src/rapport';
import { rendreEvenements, rendreObservation } from '../content';
import { CATALOGUE } from './catalogue';
import { isMainModule } from './repo-files';
import { versionDuJeu } from './version';

// Rejoueur d'export (AP-01, C-09 S-03) : rejoue un fichier exporté et confirme le même état final. Accepte aussi un
// rapport de joueur (C-10 PR-02) : l'adresse d'une issue ou d'un commentaire de PR, ou leur texte enregistré dans un fichier.

const ADRESSE_RAPPORT = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/(?:issues|pull)\/(\d+)(?:#issuecomment-(\d+))?$/;

/** Texte Markdown d'une issue ou d'un commentaire, lu avec la CLI GitHub de l'agent. */
function corpsGithub(depot: string, numero: string, commentaire: string | undefined): string {
  const chemin = commentaire === undefined ? `repos/${depot}/issues/${numero}` : `repos/${depot}/issues/comments/${commentaire}`;
  return execFileSync('gh', ['api', chemin, '--jq', '.body'], { encoding: 'utf8' });
}

/** JSON de l'export désigné : fichier exporté, fichier contenant un rapport, ou adresse d'un rapport sur GitHub. */
export async function lireSource(source: string, lire: (chemin: string) => string = (chemin) => readFileSync(chemin, 'utf8'), github = corpsGithub): Promise<string> {
  const adresse = ADRESSE_RAPPORT.exec(source);
  const texte = adresse === null ? lire(source) : github(adresse[1] ?? '', adresse[2] ?? '', adresse[3]);
  if (texte.trimStart().startsWith('{')) return texte;
  const partie = await extrairePartie(texte);
  if (partie === null) throw new Error('Ni export, ni rapport avec une partie jointe.');
  return partie;
}

export interface RapportRejeu {
  readonly lignes: readonly string[];
  readonly identique: boolean;
}

export function rejouerExport(contenu: string, version: string): RapportRejeu {
  const fichier = lireExport(JSON.parse(contenu) as unknown);
  const entree = CATALOGUE.resoudre(fichier.monde);
  if ('refus' in entree) throw new Error(`Monde inconnu : ${fichier.monde}. ${entree.refus}`);
  const { partie, etapes } = rejouer(entree.monde, fichier, version);
  const lignes = [`Export : monde « ${fichier.monde} », version ${fichier.version}, graine ${fichier.graine}, ${fichier.actions.length} actions.`];
  if (fichier.commentaire !== undefined) lignes.push(`Commentaire : ${fichier.commentaire}`);
  etapes.forEach((evenements, index) => {
    const { action } = fichier.actions[index]?.commande ?? { action: '?' };
    lignes.push(`${index + 1}. [${action}] ${rendreEvenements(entree.textes, evenements, { graine: fichier.graine, action: index + 1 }).join(' ')}`);
  });
  const observation = observer(entree.monde, partie.etat);
  lignes.push('', ...rendreObservation(entree.textes, observation), '');
  const memeEtat = empreinteEtat(partie.etat) === fichier.empreinte;
  const memeObservation = JSON.stringify(observation) === JSON.stringify(fichier.observation);
  lignes.push(`Même état final : ${memeEtat ? 'oui' : 'NON'} (empreinte ${empreinteEtat(partie.etat)}, attendue ${fichier.empreinte}).`);
  lignes.push(`Même observation finale : ${memeObservation ? 'oui' : 'NON'}.`);
  return { lignes, identique: memeEtat && memeObservation };
}

if (isMainModule(import.meta.url)) {
  const chemin = process.argv[2];
  if (chemin === undefined) {
    console.error('Usage : npm run rejouer -- <fichier exporté | adresse d’une issue ou d’un commentaire de rapport>');
    process.exitCode = 1;
  } else {
    try {
      const rapport = rejouerExport(await lireSource(chemin), versionDuJeu());
      console.log(rapport.lignes.join('\n'));
      if (!rapport.identique) process.exitCode = 1;
    } catch (erreur) {
      console.error(`Rejeu impossible : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
      process.exitCode = 1;
    }
  }
}
