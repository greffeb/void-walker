import {
  ACTIONS,
  jouer,
  nouvellePartie,
  observer,
  RAISONS_INDISPONIBILITE,
  RAISONS_REFUS,
  TYPES_EVENEMENT,
  type Partie,
  type TypeEvenement,
} from '../engine';
import {
  analyserGabarit,
  libelleOption,
  MONDES,
  rendreConsultation,
  rendreEvenements,
  rendreObservation,
  rendreRefus,
  ROLES_EVENEMENT,
  ROLES_INDISPONIBILITE,
  ROLES_LIBELLE,
  ROLES_OBSERVATION,
  ROLES_PASSAGE,
  type EntreeMonde,
  type TextesMonde,
} from '../content';
import { isMainModule } from './repo-files';

// Contrôles des textes (C-07 §4, AP-08) : NP-01 un événement un texte, NP-02 trous sûrs, D-111 longueur.

const ID_PUBLIC = /\be[0-9a-f]{8}\b/;

export function compterPhrases(texte: string): number {
  return texte.split(/[.!?…]+(?:\s|$)/).filter((morceau) => morceau.trim() !== '').length;
}

function verifierVariantes(erreurs: string[], ou: string, variantes: unknown, roles: readonly string[]): void {
  if (!Array.isArray(variantes) || variantes.length === 0) {
    erreurs.push(`${ou} : aucun texte (NP-01).`);
    return;
  }
  variantes.forEach((variante: unknown, index) => {
    if (typeof variante !== 'string') {
      erreurs.push(`${ou} [${index}] : texte manquant.`);
      return;
    }
    for (const erreur of analyserGabarit(variante, roles)) erreurs.push(`${ou} [${index}] : ${erreur}.`);
  });
}

function verifierGabarit(erreurs: string[], ou: string, gabarit: unknown, roles: readonly string[]): void {
  if (typeof gabarit !== 'string') {
    erreurs.push(`${ou} : aucun texte (NP-01).`);
    return;
  }
  for (const erreur of analyserGabarit(gabarit, roles)) erreurs.push(`${ou} : ${erreur}.`);
}

function verifierStructure(erreurs: string[], { monde, textes }: EntreeMonde): void {
  for (const type of TYPES_EVENEMENT) verifierVariantes(erreurs, `événement ${type}`, textes.evenements[type], ROLES_EVENEMENT[type]);
  for (const raison of RAISONS_REFUS) verifierGabarit(erreurs, `refus ${raison}`, textes.refus[raison], []);
  for (const raison of RAISONS_INDISPONIBILITE) {
    verifierGabarit(erreurs, `indisponibilité ${raison}`, textes.indisponibilites[raison], ROLES_INDISPONIBILITE);
  }
  for (const action of ACTIONS) verifierGabarit(erreurs, `libellé ${action}`, textes.libelles[action], ROLES_LIBELLE[action]);
  verifierVariantes(erreurs, 'regarder un passage ouvert', textes.passages.ouvert, ROLES_PASSAGE);
  verifierVariantes(erreurs, 'regarder un passage fermé', textes.passages.ferme, ROLES_PASSAGE);
  for (const [cle, roles] of Object.entries(ROLES_OBSERVATION)) {
    verifierGabarit(erreurs, `observation ${cle}`, textes.observation[cle as keyof TextesMonde['observation']], roles);
  }

  for (const entite of [...monde.pieces, ...monde.liaisons, ...monde.objets]) {
    const nom = textes.noms[entite.nom];
    if (nom === undefined) {
      erreurs.push(`nom « ${entite.nom} » sans texte (NP-02).`);
      continue;
    }
    if (nom.texte.trim() === '' || !['m', 'f'].includes(nom.genre) || !['s', 'p'].includes(nom.nombre) || typeof nom.elision !== 'boolean') {
      erreurs.push(`nom « ${entite.nom} » : texte, genre, nombre ou élision manquant (NP-02).`);
    }
  }
  for (const entite of [...monde.pieces, ...monde.objets]) {
    verifierVariantes(erreurs, `description de « ${entite.nom} »`, textes.descriptions[entite.nom], []);
  }
}

/** Phrases minimales et maximales qu'une suite d'événements peut produire, toutes variantes confondues. */
function bornesPhrases(textes: TextesMonde, types: readonly TypeEvenement[]): [number, number] {
  let minimum = 0;
  let maximum = 0;
  for (const type of types) {
    const comptes = textes.evenements[type].map(compterPhrases);
    minimum += Math.min(...comptes);
    maximum += Math.max(...comptes);
  }
  return [minimum, maximum];
}

interface Rendu {
  readonly texte: string;
  readonly ou: string;
  /** Bornes de phrases toutes variantes confondues, pour le récit d'une action engagée (D-111). */
  readonly phrases?: [number, number];
}

/** Parcourt tous les états atteignables et rend chaque texte que le joueur peut voir. */
function rendreToutAtteignable(entree: EntreeMonde, version: string): Rendu[] {
  const { monde, textes } = entree;
  const rendus: Rendu[] = [];
  const depart = nouvellePartie(monde, { version, graine: 1 });
  rendus.push({ texte: rendreEvenements(textes, depart.derniers, { graine: 1, action: 0 }).join(' '), ou: 'réveil' });
  for (const raison of RAISONS_REFUS) rendus.push({ texte: rendreRefus(textes, raison), ou: `refus ${raison}` });
  const vus = new Set<string>();
  let frontiere: Partie[] = [depart];
  while (frontiere.length > 0) {
    const suivante: Partie[] = [];
    for (const partie of frontiere) {
      const cle = JSON.stringify({ ...partie.etat, actions: 0, generateur: null });
      if (vus.has(cle)) continue;
      vus.add(cle);
      const observation = observer(monde, partie.etat);
      for (const ligne of rendreObservation(textes, observation)) rendus.push({ texte: ligne, ou: 'observation' });
      for (const option of observation.menu) {
        const { libelle, raison } = libelleOption(textes, option);
        rendus.push({ texte: libelle, ou: `libellé ${option.action}` });
        if (raison !== null) rendus.push({ texte: raison, ou: `indisponibilité ${option.action}` });
        const resultat = jouer(monde, partie, option.commande);
        const repere = { graine: 1, action: partie.etat.actions + 1 };
        if (resultat.type === 'consultation') {
          rendus.push({ texte: rendreConsultation(textes, resultat.consultation, repere), ou: `consultation ${option.action}` });
        } else if (resultat.type === 'engagee') {
          rendus.push({
            texte: rendreEvenements(textes, resultat.evenements, repere).join(' '),
            ou: `action ${option.action}`,
            phrases: bornesPhrases(textes, resultat.evenements.map((evenement) => evenement.type)),
          });
          suivante.push(resultat.partie);
        }
      }
    }
    frontiere = suivante;
  }
  return rendus;
}

export function verifierTextes(entree: EntreeMonde, version = 'controle-textes'): string[] {
  const erreurs: string[] = [];
  verifierStructure(erreurs, entree);
  if (erreurs.length > 0) return erreurs;

  const internes = [entree.monde.id, ...[...entree.monde.pieces, ...entree.monde.liaisons, ...entree.monde.objets].map((entite) => entite.id)];
  let rendus: Rendu[];
  try {
    rendus = rendreToutAtteignable(entree, version);
  } catch (erreur) {
    return [`rendu impossible : ${erreur instanceof Error ? erreur.message : String(erreur)}`];
  }
  for (const { texte, ou, phrases } of rendus) {
    if (/[{}]/.test(texte)) erreurs.push(`${ou} : trou non rempli dans « ${texte} ».`);
    const fuite = internes.find((id) => texte.includes(id));
    if (fuite !== undefined || ID_PUBLIC.test(texte)) erreurs.push(`${ou} : identifiant affiché dans « ${texte} » (NP-02).`);
    if (phrases !== undefined && (phrases[0] < 2 || phrases[1] > 4)) {
      erreurs.push(`${ou} : de ${phrases[0]} à ${phrases[1]} phrase(s) selon les variantes, 2 à 4 attendues (D-111).`);
    }
  }
  return [...new Set(erreurs)];
}

if (isMainModule(import.meta.url)) {
  let total = 0;
  for (const [id, entree] of Object.entries(MONDES)) {
    const erreurs = verifierTextes(entree);
    total += erreurs.length;
    for (const erreur of erreurs) console.error(`${id} : ${erreur}`);
    if (erreurs.length === 0) console.log(`${id} : textes complets, trous sûrs, aucun identifiant affiché.`);
  }
  if (total > 0) {
    console.error(`\n${total} erreur(s) dans les textes (docs/contrats/C-07-textes.md §4).`);
    process.exitCode = 1;
  }
}
