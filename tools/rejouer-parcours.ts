import {
  empreinteEtat,
  exporter,
  jouer,
  lireExport,
  nouvellePartie,
  observer,
  rejouer,
  type Commande,
  type ExportPartie,
  type Observation,
  type OptionMenu,
  type Partie,
} from '../engine';
import { libelleOption, MONDES, rendreEvenements, rendreObservation, rendreRefus, type EntreeMonde, type EtapeParcours } from '../content';
import { isMainModule } from './repo-files';
import { versionDuJeu } from './version';

// Rejeu du parcours témoin (AP-08) : jouer par le menu public, vérifier la fin, exporter, rejouer l'export.

export interface RapportParcours {
  readonly lignes: readonly string[];
  readonly erreurs: readonly string[];
  readonly exportPartie: ExportPartie | null;
}

export function trouverOption(observation: Observation, etape: EtapeParcours): OptionMenu | undefined {
  return observation.menu.find(
    (option) =>
      option.action === etape.action &&
      option.cible.nom === etape.cible &&
      (etape.vers === undefined || (option.cible.sorte === 'passage' && option.cible.vers.nom === etape.vers)),
  );
}

function memesNoms(trouves: readonly { nom: string }[], attendus: readonly string[]): boolean {
  return JSON.stringify(trouves.map((element) => element.nom)) === JSON.stringify(attendus);
}

export function executerParcours(entree: EntreeMonde, version: string, graine = 20261010): RapportParcours {
  const { monde, textes, parcours } = entree;
  const lignes: string[] = [];
  const erreurs: string[] = [];
  const recit: string[][] = [];
  let partie: Partie = nouvellePartie(monde, { version, graine });
  lignes.push(`Parcours « ${parcours.nom} » — monde ${monde.id}, graine ${graine}, version ${version}`, '');
  lignes.push(...rendreEvenements(textes, partie.derniers, { graine, action: 0 }));

  const verifierRefus = (commande: Commande, quoi: string): void => {
    const avant = empreinteEtat(partie.etat);
    const resultat = jouer(monde, partie, commande);
    const intact =
      resultat.type === 'refus' &&
      resultat.partie === partie &&
      empreinteEtat(resultat.partie.etat) === avant &&
      resultat.partie.etat.actions === partie.etat.actions &&
      resultat.partie.enregistrement.actions.length === partie.enregistrement.actions.length;
    if (resultat.type === 'refus') lignes.push(`  [refus attendu : ${quoi}] ${rendreRefus(textes, resultat.raison)} (état et compteur inchangés : ${intact ? 'oui' : 'NON'})`);
    if (!intact) erreurs.push(`Refus attendu sans effet pour « ${quoi} », obtenu : ${resultat.type}.`);
  };

  const fermee = observer(monde, partie.etat).menu.find((option) => option.action === 'aller' && !option.disponible);
  if (fermee === undefined) erreurs.push('Aucune option « aller » indisponible au départ.');
  else verifierRefus(fermee.commande, 'aller par une porte fermée');

  let commandesPassees: Commande[] = [];
  for (const [index, etape] of parcours.etapes.entries()) {
    const observation = observer(monde, partie.etat);
    lignes.push('', ...rendreObservation(textes, observation));
    const option = trouverOption(observation, etape);
    if (option === undefined || !option.disponible) {
      erreurs.push(`Étape ${index + 1} (${etape.action} ${etape.cible}) : option absente ou indisponible.`);
      break;
    }
    lignes.push('', `> ${libelleOption(textes, option).libelle}`);
    const resultat = jouer(monde, partie, option.commande);
    if (resultat.type !== 'engagee') {
      erreurs.push(`Étape ${index + 1} : action non engagée (${resultat.type}).`);
      break;
    }
    partie = resultat.partie;
    const phrases = rendreEvenements(textes, resultat.evenements, { graine, action: partie.etat.actions });
    recit.push(phrases);
    lignes.push(phrases.join(' '));
    for (const ancienne of commandesPassees) verifierRefus(ancienne, `rejouer « ${ancienne.action} » déjà joué`);
    commandesPassees = etape.action === 'prendre' ? [option.commande] : [];
  }

  const fin = observer(monde, partie.etat);
  lignes.push('', ...rendreObservation(textes, fin));
  const { attendu } = parcours;
  const conforme =
    fin.piece.nom === attendu.piece &&
    memesNoms(fin.objets, attendu.objetsIci) &&
    memesNoms(fin.inventaire, attendu.inventaire) &&
    memesNoms(
      fin.passages.filter((passage) => passage.ouvert),
      attendu.passagesOuverts,
    ) &&
    fin.actions === attendu.actions;
  if (!conforme) erreurs.push(`État final différent de l'attendu : ${JSON.stringify(attendu)}.`);
  lignes.push('', `Fin attendue atteinte : ${conforme ? 'oui' : 'NON'} (${fin.actions} actions engagées).`);

  const exportPartie = exporter(monde, partie);
  try {
    const relu = lireExport(JSON.parse(JSON.stringify(exportPartie)));
    const { partie: rejouee, etapes } = rejouer(monde, relu, version);
    const recitRejoue = etapes.map((evenements, index) => rendreEvenements(textes, evenements, { graine, action: index + 1 }));
    const memeEtat = empreinteEtat(rejouee.etat) === relu.empreinte && relu.empreinte === empreinteEtat(partie.etat);
    const memeRecit = JSON.stringify(recitRejoue) === JSON.stringify(recit);
    lignes.push(`Export rejoué : même état ${memeEtat ? 'oui' : 'NON'} (empreinte ${relu.empreinte}), même récit ${memeRecit ? 'oui' : 'NON'}.`);
    if (!memeEtat) erreurs.push("Le rejeu de l'export ne redonne pas le même état.");
    if (!memeRecit) erreurs.push("Le rejeu de l'export ne redonne pas le même récit.");
  } catch (erreur) {
    erreurs.push(`Rejeu de l'export impossible : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
  }
  return { lignes, erreurs, exportPartie };
}

if (isMainModule(import.meta.url)) {
  const version = versionDuJeu();
  let echecs = 0;
  for (const entree of Object.values(MONDES)) {
    const rapport = executerParcours(entree, version);
    console.log(rapport.lignes.join('\n'));
    for (const erreur of rapport.erreurs) console.error(`ERREUR : ${erreur}`);
    echecs += rapport.erreurs.length;
  }
  if (echecs > 0) process.exitCode = 1;
  else console.log('\nParcours témoin : conforme, refus sans effet, export rejoué à l’identique.');
}
