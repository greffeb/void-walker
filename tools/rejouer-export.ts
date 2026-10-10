import { readFileSync } from 'node:fs';
import { empreinteEtat, lireExport, observer, rejouer } from '../engine';
import { MONDES, rendreEvenements, rendreObservation } from '../content';
import { isMainModule } from './repo-files';
import { versionDuJeu } from './version';

// Rejoueur d'export (AP-01, C-09 S-03) : rejoue un fichier exporté et confirme le même état final.

export interface RapportRejeu {
  readonly lignes: readonly string[];
  readonly identique: boolean;
}

export function rejouerExport(contenu: string, version: string): RapportRejeu {
  const fichier = lireExport(JSON.parse(contenu) as unknown);
  const entree = MONDES[fichier.monde];
  if (entree === undefined) throw new Error(`Monde inconnu : ${fichier.monde}.`);
  const { partie, etapes } = rejouer(entree.monde, fichier, version);
  const lignes = [`Export du monde ${fichier.monde}, version ${fichier.version}, graine ${fichier.graine}, ${fichier.actions.length} actions.`];
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
    console.error('Usage : npm run rejouer -- <fichier exporté>');
    process.exitCode = 1;
  } else {
    try {
      const rapport = rejouerExport(readFileSync(chemin, 'utf8'), versionDuJeu());
      console.log(rapport.lignes.join('\n'));
      if (!rapport.identique) process.exitCode = 1;
    } catch (erreur) {
      console.error(`Rejeu impossible : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
      process.exitCode = 1;
    }
  }
}
