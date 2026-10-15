import { nouvellePartie, observer, jouer, type Des, type EtatPartie, type OptionMenu, type Partie } from '../engine';
import type { EntreeMonde, EtapeParcours, Parcours } from '../content';
import { CATALOGUE } from './catalogue';
import { executerParcours, trouverOption } from './rejouer-parcours';
import { isMainModule } from './repo-files';

const VERSION = 'verifier-station';
const GRAINE = 20261010;
const MAX_ETATS = 150000;

export interface OptionsVerification {
  readonly maxEtats?: number;
}

export interface RapportStation {
  readonly verdict: 'prouvee' | 'sans_sortie_sure' | 'non_prouvee';
  readonly etats: number;
  readonly secondes: number;
  readonly diagnostic: string;
  readonly parcours: Parcours | null;
  readonly ecartes: { readonly des: number; readonly blessures: number };
}

export function cleEtatRegles(etat: EtatPartie): string {
  return JSON.stringify({ ...etat, actions: 0, generateur: null, memoire: null, reperes: null, messages: [], visitees: [] });
}

function plafond(options: OptionsVerification): number {
  const maxEtats = options.maxEtats ?? MAX_ETATS;
  if (!Number.isSafeInteger(maxEtats) || maxEtats < 1) throw new RangeError('Le plafond doit être un entier positif.');
  return maxEtats;
}

function sansJournal(partie: Partie): Partie {
  return { ...partie, enregistrement: { ...partie.enregistrement, actions: [] }, derniers: [] };
}

function etapeDe(option: OptionMenu): EtapeParcours {
  const vers = option.cible.sorte === 'passage' ? option.cible.vers?.nom : undefined;
  const parametre = option.parametre?.sorte === 'passage' ? option.parametre.vers?.nom : option.parametre?.nom;
  return {
    action: option.action,
    cible: option.cible.nom,
    cibleId: option.cible.id,
    ...(vers === undefined ? {} : { vers }),
    ...(parametre === undefined ? {} : { parametre }),
    ...(option.parametre === undefined ? {} : { parametreId: option.parametre.id }),
  };
}

interface Parent {
  readonly precedent: number;
  readonly etape: EtapeParcours;
}

function temoin(entree: EntreeMonde, parents: readonly (Parent | null)[], fin: number): Parcours {
  const etapes: EtapeParcours[] = [];
  let indice = fin;
  while (indice > 0) {
    const parent = parents[indice];
    if (parent === undefined || parent === null) throw new Error('Chaîne du témoin incomplète.');
    etapes.push(parent.etape);
    indice = parent.precedent;
  }
  etapes.reverse();
  let partie = nouvellePartie(entree.monde, { version: VERSION, graine: GRAINE });
  for (const etape of etapes) {
    const option = trouverOption(observer(entree.monde, partie.etat), etape);
    if (option === undefined || !option.disponible) throw new Error('Commande du témoin introuvable.');
    const resultat = jouer(entree.monde, partie, option.commande);
    if (resultat.type !== 'engagee' || resultat.tirages.length > 0 || resultat.partie.etat.sante !== 'indemne') throw new Error('Témoin non sûr.');
    partie = resultat.partie;
  }
  const observation = observer(entree.monde, partie.etat);
  const parcours: Parcours = {
    nom: `${entree.monde.id} : preuve automatique sans dé ni blessure`,
    etapes,
    attendu: {
      piece: observation.piece.nom,
      objetsIci: observation.objets.map((objet) => objet.nom),
      inventaire: observation.inventaire.map((objet) => objet.nom),
      passagesOuverts: observation.passages.filter((passage) => passage.ouvert).map((passage) => passage.nom),
      actions: observation.actions,
      issue: 'evacuation',
      sante: 'indemne',
      sansDe: true,
    },
  };
  const rapport = executerParcours(entree, parcours, VERSION, GRAINE);
  if (rapport.erreurs.length > 0) throw new Error(`Rejeu de la preuve refusé : ${rapport.erreurs.join('; ')}`);
  return parcours;
}

export function verifierStation(entree: EntreeMonde, options: OptionsVerification = {}): RapportStation {
  const debut = performance.now();
  const maxEtats = plafond(options);
  const initiale = nouvellePartie(entree.monde, { version: VERSION, graine: GRAINE });
  const vus = new Set([cleEtatRegles(initiale.etat)]);
  const file: (Partie | undefined)[] = [sansJournal(initiale)];
  const parents: (Parent | null)[] = [null];
  const ecartes = { des: 0, blessures: 0 };
  const conclure = (verdict: RapportStation['verdict'], diagnostic: string, parcours: Parcours | null = null): RapportStation => ({
    verdict, diagnostic, parcours, etats: vus.size, secondes: (performance.now() - debut) / 1000, ecartes,
  });
  for (let position = 0; position < file.length; position++) {
    const partie = file[position];
    file[position] = undefined;
    if (partie === undefined) throw new Error('État de recherche absent.');
    for (const option of observer(entree.monde, partie.etat).menu) {
      if (!option.disponible || option.action === 'regarder') continue;
      const resultat = jouer(entree.monde, partie, option.commande);
      if (resultat.type !== 'engagee') continue;
      if (resultat.tirages.length > 0) { ecartes.des++; continue; }
      if (resultat.partie.etat.sante !== 'indemne') { ecartes.blessures++; continue; }
      const cle = cleEtatRegles(resultat.partie.etat);
      if (vus.has(cle)) continue;
      if (vus.size >= maxEtats) return conclure('non_prouvee', `Recherche interrompue au plafond de ${maxEtats} états : évacuation non prouvée.`);
      vus.add(cle);
      parents.push({ precedent: position, etape: etapeDe(option) });
      if (resultat.partie.etat.fin === 'evacuation') {
        const parcours = temoin(entree, parents, parents.length - 1);
        return conclure('prouvee', `Évacuation sans dé ni blessure prouvée en ${parcours.etapes.length} actions ; témoin et export rejoués.`, parcours);
      }
      file.push(sansJournal(resultat.partie));
    }
  }
  return conclure('sans_sortie_sure', `Aucune évacuation sans dé ni blessure après exploration complète : ${ecartes.des} transitions avec dé, ${ecartes.blessures} avec blessure écartées.`);
}

class DemandeDe extends Error {
  constructor(readonly faces: number) { super('Tirage à explorer.'); }
}

export function explorerDes<Resultat>(executer: (des: Des) => Resultat): Resultat[] {
  const resultats: Resultat[] = [];
  const prefixes: number[][] = [[]];
  while (prefixes.length > 0) {
    const prefixe = prefixes.pop();
    if (prefixe === undefined) throw new Error('Préfixe de dés absent.');
    let position = 0;
    try {
      resultats.push(executer({ lancer: (faces) => {
        const face = prefixe[position++];
        if (face === undefined) throw new DemandeDe(faces);
        return face;
      } }));
    } catch (erreur) {
      if (!(erreur instanceof DemandeDe)) throw erreur;
      if (!Number.isSafeInteger(erreur.faces) || erreur.faces < 1) throw new RangeError('Nombre de faces invalide.', { cause: erreur });
      for (let face = erreur.faces; face >= 1; face--) prefixes.push([...prefixe, face]);
    }
  }
  return resultats;
}

export interface MesureStation {
  readonly verdict: 'complete' | 'non_prouvee';
  readonly etats: number;
  readonly transitions: number;
  readonly branchesDes: number;
  readonly evacuations: number;
  readonly defaites: number;
  readonly secondes: number;
  readonly diagnostic: string;
}

export function mesurerStation(entree: EntreeMonde, options: OptionsVerification = {}): MesureStation {
  const debut = performance.now();
  const maxEtats = plafond(options);
  const initiale = nouvellePartie(entree.monde, { version: VERSION, graine: GRAINE });
  const vus = new Set([cleEtatRegles(initiale.etat)]);
  const file: (Partie | undefined)[] = [sansJournal(initiale)];
  let transitions = 0;
  let branchesDes = 0;
  let evacuations = 0;
  let defaites = 0;
  const conclure = (verdict: MesureStation['verdict'], diagnostic: string): MesureStation => ({
    verdict, diagnostic, etats: vus.size, transitions, branchesDes, evacuations, defaites, secondes: (performance.now() - debut) / 1000,
  });
  for (let position = 0; position < file.length; position++) {
    const partie = file[position];
    file[position] = undefined;
    if (partie === undefined) throw new Error('État de mesure absent.');
    for (const option of observer(entree.monde, partie.etat).menu) {
      if (!option.disponible || option.action === 'regarder') continue;
      for (const resultat of explorerDes((des) => jouer(entree.monde, partie, option.commande, des))) {
        if (resultat.type !== 'engagee') continue;
        transitions++;
        if (resultat.tirages.length > 0) branchesDes++;
        const cle = cleEtatRegles(resultat.partie.etat);
        if (vus.has(cle)) continue;
        if (vus.size >= maxEtats) return conclure('non_prouvee', `Mesure interrompue au plafond de ${maxEtats} états : graphe incomplet.`);
        vus.add(cle);
        if (resultat.partie.etat.fin === 'evacuation') evacuations++;
        else if (resultat.partie.etat.sante === 'vaincu') defaites++;
        else file.push(sansJournal(resultat.partie));
      }
    }
  }
  return conclure('complete', 'Graphe complet : toutes les commandes et toutes les faces de dés explorées.');
}

if (isMainModule(import.meta.url)) {
  const argumentsCli = process.argv.slice(2);
  const mesure = argumentsCli.includes('--mesurer');
  const inconnu = argumentsCli.find((argument) => argument.startsWith('--') && argument !== '--mesurer' && !argument.startsWith('--max-etats='));
  if (inconnu !== undefined) throw new Error(`Option inconnue : ${inconnu}.`);
  const limite = argumentsCli.find((argument) => argument.startsWith('--max-etats='));
  const options = limite === undefined ? {} : { maxEtats: Number(limite.slice('--max-etats='.length)) };
  const demandes = argumentsCli.filter((argument) => !argument.startsWith('--'));
  for (const id of demandes.length > 0 ? demandes : ['ar-01', 'ar-02', 'm-07', 'm-08', 'm-09', 'm-10']) {
    const entree = CATALOGUE.mondes[id];
    if (entree === undefined) throw new Error(`Station inconnue : ${id}.`);
    const rapport = mesure ? mesurerStation(entree, options) : verifierStation(entree, options);
    console.log(JSON.stringify({ monde: id, ...rapport }));
    if (rapport.verdict !== (mesure ? 'complete' : 'prouvee')) process.exitCode = 1;
  }
}