import type {
  Apercu,
  Cible,
  Consultation,
  Danger,
  Evenement,
  Observation,
  OptionMenu,
  Partie,
  RaisonRefus,
  Resultat,
  Savoir,
} from '../../engine';
import { choisirVariante, ErreurTexte, former, remplir } from './gabarit';
import type { Nom, TextesMonde, Variantes } from './types';

/** Repère pour choisir les variantes : la graine de la partie et le numéro de l'action. */
export interface CleTexte {
  readonly graine: number;
  readonly action: number;
}

/** Nom public d'une cible ; un passage se nomme par sa destination (« la porte de l’atelier », C-06 OP-03). */
export function nomDe(textes: TextesMonde, cible: Cible): Nom {
  const nom = textes.noms[cible.nom];
  if (nom === undefined) throw new ErreurTexte(`Nom sans texte : ${cible.nom}.`);
  if (cible.sorte !== 'passage') return nom;
  return { ...nom, texte: `${nom.texte} ${former('de', nomDe(textes, cible.vers))}` };
}

function valeursEvenement(textes: TextesMonde, evenement: Evenement): Record<string, Nom> {
  switch (evenement.type) {
    case 'reveil':
    case 'piece_decouverte':
      return { piece: nomDe(textes, evenement.piece) };
    case 'objet_pris':
    case 'objet_pose':
      return { objet: nomDe(textes, evenement.objet), piece: nomDe(textes, evenement.piece) };
    case 'passage_ouvert':
    case 'passage_ferme':
      return { passage: nomDe(textes, evenement.passage) };
    case 'deplacement':
      return { passage: nomDe(textes, evenement.passage), piece: nomDe(textes, evenement.piece) };
    case 'bruit_mecanisme':
    case 'bruit_creature':
    case 'creature_entre':
    case 'feu_derriere':
    case 'creature_glisse':
      return { passage: nomDe(textes, evenement.passage) };
    case 'premier_contact':
    case 'menace':
    case 'aggravation_blesse':
    case 'aggravation_critique':
    case 'defaite':
      return {};
    case 'soin_indemne':
    case 'soin_blesse':
    case 'alarme_declenchee':
      return { objet: nomDe(textes, evenement.objet) };
    case 'objet_deplace':
      return { objet: nomDe(textes, evenement.objet), position: nomDe(textes, evenement.position) };
    case 'feu_gagne':
    case 'feu_eteint':
      return { piece: nomDe(textes, evenement.piece) };
    case 'huile_versee':
      return { objet: nomDe(textes, evenement.objet), passage: nomDe(textes, evenement.passage) };
  }
}

/** Textes possibles d'un événement ; une aggravation due au feu a les siens (D-188). */
function variantesDe(textes: TextesMonde, evenement: Evenement): Variantes {
  if (evenement.type === 'aggravation_blesse' || evenement.type === 'aggravation_critique' || evenement.type === 'defaite') {
    if (evenement.causes.includes('feu')) return textes.brulures[evenement.causes.includes('griffes') ? 'griffes_feu' : 'feu'][evenement.type];
  }
  return textes.evenements[evenement.type];
}

/** Une phrase par événement appliqué (C-07 NP-01). */
export function rendreEvenements(textes: TextesMonde, evenements: readonly Evenement[], cle: CleTexte): string[] {
  return evenements.map((evenement, index) => {
    const variante = choisirVariante(variantesDe(textes, evenement), `${cle.graine}:${cle.action}:${index}:${evenement.type}`);
    return remplir(variante, valeursEvenement(textes, evenement));
  });
}

export function rendreConsultation(textes: TextesMonde, consultation: Consultation, cle: CleTexte): string {
  // Une même chose garde la même description pendant toute la partie.
  const repere = `${cle.graine}:${consultation.type}:${consultation.cible.id}`;
  if (consultation.type === 'regarder_passage') {
    const { cible } = consultation;
    const variantes = cible.ouvert ? textes.passages.ouvert : textes.passages.ferme;
    return remplir(choisirVariante(variantes, repere), { passage: nomDe(textes, cible), vers: nomDe(textes, cible.vers) });
  }
  const description = textes.descriptions[consultation.cible.nom];
  if (description === undefined) throw new ErreurTexte(`Description absente : ${consultation.cible.nom}.`);
  return remplir(choisirVariante(description, repere), {});
}

export function rendreRefus(textes: TextesMonde, raison: RaisonRefus): string {
  return remplir(textes.refus[raison], {});
}

function repere(partie: Partie): CleTexte {
  return { graine: partie.enregistrement.graine, action: partie.etat.actions };
}

/** Récit de la dernière action engagée, identique après une reprise ou un rejeu. */
export function raconterDerniers(textes: TextesMonde, partie: Partie): string[] {
  return rendreEvenements(textes, partie.derniers, repere(partie));
}

/** Récit d'un résultat, le même pour l'appli et la CLI (C-06 K-07). */
export function raconter(textes: TextesMonde, resultat: Resultat): string[] {
  switch (resultat.type) {
    case 'refus':
      return [rendreRefus(textes, resultat.raison)];
    case 'consultation':
      return [rendreConsultation(textes, resultat.consultation, repere(resultat.partie))];
    case 'engagee':
      return rendreEvenements(textes, resultat.evenements, repere(resultat.partie));
  }
}

export function rendreObservation(textes: TextesMonde, observation: Observation): string[] {
  const modele = textes.observation;
  const lignes = [remplir(modele.lieu, { piece: nomDe(textes, observation.piece) })];
  if (observation.sante === 'blesse') lignes.push(remplir(modele.blesse, {}));
  if (observation.sante === 'critique') lignes.push(remplir(modele.critique, {}));
  lignes.push(
    observation.objets.length > 0
      ? remplir(modele.objets, { liste: observation.objets.map((objet) => nomDe(textes, objet)) })
      : remplir(modele.aucunObjet, {}),
  );
  for (const passage of observation.passages) {
    const modeleOuvert = passage.feu ? modele.passageEnFeu : modele.passageOuvert;
    lignes.push(remplir(passage.ouvert ? modeleOuvert : modele.passageFerme, { passage: nomDe(textes, passage) }));
    if (passage.huile) lignes.push(remplir(modele.huile, { passage: nomDe(textes, passage) }));
  }
  for (const { objet, position } of observation.placements) {
    lignes.push(remplir(modele.placement, { objet: nomDe(textes, objet), position: nomDe(textes, position) }));
  }
  if (observation.feu) lignes.push(remplir(modele.feu, {}));
  if (observation.creatureVisible) lignes.push(remplir(observation.creatureATerre ? modele.creatureATerre : modele.creature, {}));
  lignes.push(
    observation.inventaire.length > 0
      ? remplir(modele.inventaire, { liste: observation.inventaire.map((objet) => nomDe(textes, objet)) })
      : remplir(modele.inventaireVide, {}),
  );
  if (observation.terminee) lignes.push(remplir(modele.terminee, {}));
  return lignes;
}

export interface LibelleOption {
  readonly libelle: string;
  /** Raison publique d'indisponibilité, ou `null` si l'option est jouable. */
  readonly raison: string | null;
}

/** Aperçu mis en mots, le même pour l'appli et la CLI (C-01 A-05). */
export interface ApercuTexte {
  readonly risque: string;
  /** Danger connu, affiché après le niveau (12 §3.8) ; `null` s'il n'y en a pas. */
  readonly danger: string | null;
  readonly cout: string;
  readonly savoir: readonly string[];
}

function valeursSavoir(textes: TextesMonde, savoir: Savoir): Record<string, Nom> {
  switch (savoir.type) {
    case 'portera':
      return { objet: nomDe(textes, savoir.objet) };
    case 'laissera':
      return { objet: nomDe(textes, savoir.objet), piece: nomDe(textes, savoir.piece) };
    case 'ouvrira':
    case 'fermera':
      return { passage: nomDe(textes, savoir.passage) };
    case 'quittera':
      return { piece: nomDe(textes, savoir.piece) };
    case 'soignera':
      return {};
    case 'videra':
      return { objet: nomDe(textes, savoir.objet) };
    case 'deplacera':
      return { objet: nomDe(textes, savoir.objet), position: nomDe(textes, savoir.position) };
    case 'eteindra':
    case 'sonnera':
      return { piece: nomDe(textes, savoir.piece) };
    case 'huilera':
      return { passage: nomDe(textes, savoir.passage) };
  }
}

function valeursDanger(textes: TextesMonde, danger: Danger): Record<string, Nom> {
  switch (danger.type) {
    case 'interception':
    case 'interception_mortelle':
    case 'brulure':
    case 'brulure_mortelle':
      return {};
    case 'creature_entendue':
      return { passage: nomDe(textes, danger.passage) };
    default:
      return { piece: nomDe(textes, danger.piece) };
  }
}

export function rendreApercu(textes: TextesMonde, apercu: Apercu): ApercuTexte {
  const modele = textes.apercu;
  return {
    risque: modele.risques[apercu.risque],
    danger: apercu.danger === null ? null : remplir(modele.dangers[apercu.danger.type], valeursDanger(textes, apercu.danger)),
    cout: modele.couts[apercu.cout],
    savoir: apercu.savoir.map((savoir) => remplir(modele.savoir[savoir.type], valeursSavoir(textes, savoir))),
  };
}

export function libelleOption(textes: TextesMonde, option: OptionMenu): LibelleOption {
  const { cible, parametre } = option;
  const valeurs: Record<string, Nom> = { cible: nomDe(textes, cible) };
  if (cible.sorte === 'passage') valeurs.vers = nomDe(textes, cible.vers);
  // Paramètre : la position visée, le passage et la pièce derrière lui, ou la pièce elle-même.
  if (parametre?.sorte === 'position') valeurs.position = nomDe(textes, parametre);
  if (parametre?.sorte === 'passage') {
    valeurs.passage = nomDe(textes, parametre);
    valeurs.piece = nomDe(textes, parametre.vers);
  }
  if (parametre?.sorte === 'piece') valeurs.piece = nomDe(textes, parametre);
  const libelle = remplir(textes.libelles[option.action], valeurs);
  if (option.disponible) return { libelle, raison: null };
  if (option.raison === undefined) throw new ErreurTexte(`Option indisponible sans raison : ${option.action}.`);
  return { libelle, raison: remplir(textes.indisponibilites[option.raison], { cible: valeurs.cible as Nom }) };
}
