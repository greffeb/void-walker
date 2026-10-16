import type {
  Apercu,
  Cible,
  Consultation,
  Danger,
  Evenement,
  MomentMessage,
  Observation,
  OptionMenu,
  Partie,
  RaisonRefus,
  RefPassage,
  RefPiece,
  Resultat,
  Savoir,
  SourceEvacuation,
} from '../../engine';
import { choisirVariante, ErreurTexte, former, remplir } from './gabarit';
import type { CleEvacuation, Nom, TextesMonde, Variantes } from './types';

/** Repère pour choisir les variantes : la graine de la partie et le numéro de l'action. */
export interface CleTexte {
  readonly graine: number;
  readonly action: number;
}

/**
 * Nom public d'une cible ; un passage se nomme par sa destination (« la porte de l’atelier », C-06 OP-03), ou par son seul
 * nom tant que sa destination n'est pas connue (« la grille »).
 */
export function nomDe(textes: TextesMonde, cible: Cible): Nom {
  if (cible.sorte === 'passage') return nomPassage(textes, cible.nom, cible.vers);
  const nom = textes.noms[cible.nom];
  if (nom === undefined) throw new ErreurTexte(`Nom sans texte : ${cible.nom}.`);
  return nom;
}

/** Nom d'un passage par sa clé de nom et sa destination, si elle est connue ; partagé avec la carte (14 §2.8). */
export function nomPassage(textes: TextesMonde, nom: string, vers: RefPiece | null): Nom {
  const passage = textes.noms[nom];
  if (passage === undefined) throw new ErreurTexte(`Nom sans texte : ${nom}.`);
  return vers === null ? passage : { ...passage, texte: `${passage.texte} ${former('de', nomDe(textes, vers))}` };
}

function valeursEvenement(textes: TextesMonde, evenement: Evenement): Record<string, Nom | readonly Nom[]> {
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
    case 'passage_decouvert': {
      const { vers } = evenement.passage;
      if (vers === null) throw new ErreurTexte('Passage découvert sans destination.');
      return { passage: nomDe(textes, { ...evenement.passage, vers: null }), vers: nomDe(textes, vers) };
    }
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
    case 'evacuation':
    case 'assistance':
    case 'creature_expulsee':
    case 'creature_inerte':
      return {};
    case 'combinaison_enfilee':
    case 'combinaison_retiree':
    case 'breche_ouverte':
    case 'breche_rebouchee':
      return { objet: nomDe(textes, evenement.objet) };
    case 'air_perdu':
    case 'air_revenu':
      return { pieces: nomsDe(textes, evenement.pieces) };
    case 'soin_indemne':
    case 'soin_blesse':
    case 'alarme_declenchee':
    case 'circuit_active':
      return { objet: nomDe(textes, evenement.objet) };
    case 'objet_installe':
      return { objet: nomDe(textes, evenement.objet), capsule: nomDe(textes, evenement.capsule) };
    case 'objet_deplace':
      return { objet: nomDe(textes, evenement.objet), position: nomDe(textes, evenement.position) };
    case 'feu_gagne':
    case 'feu_eteint':
      return { piece: nomDe(textes, evenement.piece) };
    case 'huile_versee':
    case 'pont_place':
    case 'pont_cede':
      return { objet: nomDe(textes, evenement.objet), passage: nomDe(textes, evenement.passage) };
    case 'derive':
    case 'bruit_couvert':
    case 'chute_entendue':
      return { passage: nomDe(textes, evenement.passage) };
    case 'machines_arretees':
    case 'machines_relancees':
    case 'cloison_deverrouillee':
      return { objet: nomDe(textes, evenement.objet) };
    case 'gravite_coupee':
    case 'gravite_retablie':
      return { piece: nomDe(textes, evenement.piece) };
    case 'chambre_bouclee':
      return { objet: nomDe(textes, evenement.objet), piece: nomDe(textes, evenement.piece) };
  }
}

function nomsDe(textes: TextesMonde, pieces: readonly RefPiece[]): Nom[] {
  return pieces.map((piece) => nomDe(textes, piece));
}

/** Clé des textes d'une évacuation, selon ses sources. */
export function cleEvacuation(sources: readonly SourceEvacuation[]): CleEvacuation {
  if (sources.includes('circuit')) return sources.includes('bloc') ? 'circuit_bloc' : 'circuit';
  if (sources.includes('bloc')) return 'bloc';
  if (sources.includes('reserve')) return 'reserve';
  throw new ErreurTexte('Évacuation sans source.');
}

/**
 * Textes possibles d'un événement ; une défaite par le vide a les siens, une aggravation due au feu aussi (D-188), puis celle
 * due au froid (D-240), une évacuation selon ses sources.
 */
export function variantesDe(textes: TextesMonde, evenement: Evenement): Variantes {
  if (evenement.type === 'defaite' && evenement.causes.includes('vide')) return textes.asphyxie;
  if (evenement.type === 'aggravation_blesse' || evenement.type === 'aggravation_critique' || evenement.type === 'defaite') {
    const griffes = evenement.causes.includes('griffes');
    if (evenement.causes.includes('feu')) return textes.brulures[griffes ? 'griffes_feu' : 'feu'][evenement.type];
    if (evenement.causes.includes('froid')) return textes.gelures[griffes ? 'griffes_froid' : 'froid'][evenement.type];
  }
  if (evenement.type === 'evacuation') return textes.evacuations[cleEvacuation(evenement.sources)];
  if (evenement.type === 'assistance') throw new ErreurTexte('Un message d’assistance ne se raconte pas.');
  return textes.evenements[evenement.type];
}

/** Une phrase par événement appliqué (C-07 NP-01) ; les messages d'assistance se lisent à part (`rendreAssistance`). */
export function rendreEvenements(textes: TextesMonde, evenements: readonly Evenement[], cle: CleTexte): string[] {
  return evenements.flatMap((evenement, index) => {
    if (evenement.type === 'assistance') return [];
    const variante = choisirVariante(variantesDe(textes, evenement), `${cle.graine}:${cle.action}:${index}:${evenement.type}`);
    return [remplir(variante, valeursEvenement(textes, evenement))];
  });
}

/** Nature du danger dont la phrase d'un événement annonce l'arrivée à la vue : feu ou vide (D-233). */
export type NatureDanger = 'feu' | 'vide';

const DANGERS: Partial<Record<Evenement['type'], NatureDanger>> = { feu_derriere: 'feu', feu_gagne: 'feu', air_perdu: 'vide' };

/** Pour chaque phrase du récit de `rendreEvenements`, le danger qu'elle annonce, ou `null` (D-233). */
export function dangersDuRecit(evenements: readonly Evenement[]): (NatureDanger | null)[] {
  return evenements.filter((evenement) => evenement.type !== 'assistance').map((evenement) => DANGERS[evenement.type] ?? null);
}

/**
 * Rangs des phrases du récit de `rendreEvenements` qui annoncent la créature ou un dégât subi : son arrivée sous les yeux du passager, le premier
 * contact, la menace (attaque sans blessure), et tout dégât subi (griffes, feu, froid, vide) : en rouge, comme les dangers apparus.
 */
export function alertesMenace(evenements: readonly Evenement[]): number[] {
  return evenements
    .filter((evenement) => evenement.type !== 'assistance')
    .flatMap((evenement, rang) => (estMenaceOuDegat(evenement) ? [rang] : []));
}

function estMenaceOuDegat(evenement: Evenement): boolean {
  switch (evenement.type) {
    case 'creature_entre':
    case 'premier_contact':
    case 'menace':
      return true;
    case 'aggravation_blesse':
    case 'aggravation_critique':
    case 'defaite':
      return true;
    default:
      return false;
  }
}

/** Phrase d'observation d'un danger en vue : dans la pièce du passager, ou derrière un passage (mêmes textes que « Regarder »). */
export function rendreDangerVu(textes: TextesMonde, nature: NatureDanger, passage: RefPassage | null): string {
  const modele = textes.observation;
  if (passage === null) return remplir(nature === 'feu' ? modele.feu : modele.sansAir, {});
  return remplir(nature === 'feu' ? modele.passageEnFeu : modele.passageVide, { passage: nomDe(textes, passage) });
}

/** Messages d'assistance reçus à ce pas, dans l'ordre, écrits à la main (C-07). */
export function rendreAssistance(textes: TextesMonde, evenements: readonly Evenement[]): string[] {
  return evenements.flatMap((evenement) => (evenement.type === 'assistance' ? [texteAssistance(textes, evenement.message)] : []));
}

/** Texte d'un message d'assistance, par son identifiant. */
export function texteAssistance(textes: TextesMonde, message: string): string {
  const texte = Object.hasOwn(textes.assistance, message) ? textes.assistance[message] : undefined;
  if (texte === undefined) throw new ErreurTexte(`Message d’assistance sans texte : ${message}.`);
  return texte;
}

/** Repère du moment où un message a été reçu, sans heure : « au réveil · Salon de transit » (12 §3.9). */
export function rendreMoment(textes: TextesMonde, moment: MomentMessage): string {
  const { momentReveil, momentArrivee, momentEvacuation } = textes.observation;
  if (moment.type === 'evacuation') return remplir(momentEvacuation, {});
  return remplir(moment.type === 'reveil' ? momentReveil : momentArrivee, { piece: nomDe(textes, moment.piece) });
}

export function rendreConsultation(textes: TextesMonde, consultation: Consultation, cle: CleTexte): string {
  // Une même chose garde la même description pendant toute la partie.
  const repere = `${cle.graine}:${consultation.type}:${consultation.cible.id}`;
  if (consultation.type === 'regarder_passage') {
    const { cible } = consultation;
    if (cible.vers === null) {
      const variantes = cible.ouvert ? textes.passages.ouvertSansDestination : textes.passages.fermeSansDestination;
      return remplir(choisirVariante(variantes, repere), { passage: nomDe(textes, cible) });
    }
    const variantes = cible.gouffre ? textes.passages.gouffre : cible.ouvert ? textes.passages.ouvert : textes.passages.ferme;
    const regard = remplir(choisirVariante(variantes, repere), { passage: nomDe(textes, cible), vers: nomDe(textes, cible.vers) });
    // Le voyant d'une porte étanche dit l'air de l'autre côté (VP-03).
    return cible.vide ? `${regard} ${remplir(textes.passages.voyantVide, {})}` : regard;
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
    // Un vide de passerelle se dit sans porte ; s'il donne sur des flammes, il se raconte comme tout passage ouvert sur le feu.
    if (passage.gouffre && !passage.feu) {
      lignes.push(remplir(modele.gouffre, { passage: nomDe(textes, passage), vers: nomDe(textes, passage.vers ?? passage) }));
      continue;
    }
    const modeleOuvert = passage.feu ? modele.passageEnFeu : modele.passageOuvert;
    lignes.push(remplir(passage.ouvert ? modeleOuvert : modele.passageFerme, { passage: nomDe(textes, passage) }));
    if (passage.huile) lignes.push(remplir(modele.huile, { passage: nomDe(textes, passage) }));
    if (passage.vide) lignes.push(remplir(modele.passageVide, { passage: nomDe(textes, passage) }));
  }
  for (const { objet, position } of observation.placements) {
    lignes.push(remplir(modele.placement, { objet: nomDe(textes, objet), position: nomDe(textes, position) }));
  }
  for (const { objet, capsule } of observation.installes) {
    lignes.push(remplir(modele.installe, { objet: nomDe(textes, objet), capsule: nomDe(textes, capsule) }));
  }
  for (const objet of observation.actives) lignes.push(remplir(modele.active, { objet: nomDe(textes, objet) }));
  if (observation.feu) lignes.push(remplir(modele.feu, {}));
  if (observation.sansAir) lignes.push(remplir(modele.sansAir, {}));
  for (const objet of observation.percees) lignes.push(remplir(modele.percee, { objet: nomDe(textes, objet) }));
  for (const objet of observation.rebouchees) lignes.push(remplir(modele.rebouchee, { objet: nomDe(textes, objet) }));
  if (observation.creatureVisible) lignes.push(remplir(observation.creatureATerre ? modele.creatureATerre : modele.creature, {}));
  if (observation.creatureRalentie) lignes.push(remplir(observation.creatureEngourdie ? modele.creatureEngourdie : modele.creatureRalentie, {}));
  if (observation.creatureInerte) lignes.push(remplir(modele.creatureInerte, {}));
  for (const { objet, passage } of observation.ponts) lignes.push(remplir(modele.pont, { objet: nomDe(textes, objet), passage: nomDe(textes, passage) }));
  for (const { objet, passage } of observation.pontsBrises) lignes.push(remplir(modele.pontBrise, { objet: nomDe(textes, objet), passage: nomDe(textes, passage) }));
  if (observation.machines !== null) lignes.push(remplir(observation.machines === 'marche' ? modele.machinesMarche : modele.machinesArret, {}));
  if (observation.gravite === 'coupee') lignes.push(remplir(modele.sansGravite, {}));
  if (observation.froid) lignes.push(remplir(modele.froid, {}));
  if (observation.enfilee !== null) lignes.push(remplir(modele.enfilee, { objet: nomDe(textes, observation.enfilee) }));
  lignes.push(
    observation.inventaire.length > 0
      ? remplir(modele.inventaire, { liste: observation.inventaire.map((objet) => nomDe(textes, objet)) })
      : remplir(modele.inventaireVide, {}),
  );
  if (observation.issue === 'evacuation') lignes.push(remplir(modele.evacuee, {}));
  else if (observation.terminee) lignes.push(remplir(modele.terminee, {}));
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

function valeursSavoir(textes: TextesMonde, savoir: Savoir): Record<string, Nom | readonly Nom[]> {
  switch (savoir.type) {
    case 'portera':
    case 'protegera':
    case 'gardera':
    case 'percera':
    case 'rebouchera':
      return { objet: nomDe(textes, savoir.objet) };
    case 'perdront_air':
    case 'retrouveront_air':
      return { pieces: nomsDe(textes, savoir.pieces) };
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
    case 'alimentera':
      return { objet: nomDe(textes, savoir.objet) };
    case 'installera':
      return { objet: nomDe(textes, savoir.objet), capsule: nomDe(textes, savoir.capsule) };
    case 'partira':
      return {};
    case 'placera':
      return { objet: nomDe(textes, savoir.objet), passage: nomDe(textes, savoir.passage) };
    case 'derivera':
      return { passage: nomDe(textes, savoir.passage) };
    case 'arreteront':
    case 'relanceront':
    case 'coupera':
    case 'retablira':
    case 'bouclera':
      return { piece: nomDe(textes, savoir.piece) };
    case 'deverrouillera':
      return { objet: nomDe(textes, savoir.objet) };
  }
}

function valeursDanger(textes: TextesMonde, danger: Danger): Record<string, Nom> {
  switch (danger.type) {
    case 'interception':
    case 'interception_mortelle':
    case 'brulure':
    case 'brulure_mortelle':
    case 'asphyxie':
    case 'froid':
    case 'froid_mortel':
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
  if (cible.sorte === 'passage' && cible.vers !== null) valeurs.vers = nomDe(textes, cible.vers);
  // Paramètre : la position visée, le passage et la pièce derrière lui (le passage seul si elle est inconnue), ou la pièce elle-même.
  if (parametre?.sorte === 'position') valeurs.position = nomDe(textes, parametre);
  if (parametre?.sorte === 'passage') {
    valeurs.passage = nomDe(textes, parametre);
    valeurs.piece = nomDe(textes, parametre.vers ?? parametre);
  }
  if (parametre?.sorte === 'piece') valeurs.piece = nomDe(textes, parametre);
  const gabarit = option.action === 'aller' && cible.sorte === 'passage' && cible.vers === null ? textes.allerSansDestination : textes.libelles[option.action];
  const libelle = remplir(gabarit, valeurs);
  if (option.disponible) return { libelle, raison: null };
  if (option.raison === undefined) throw new ErreurTexte(`Option indisponible sans raison : ${option.action}.`);
  return { libelle, raison: remplir(textes.indisponibilites[option.raison], { cible: valeurs.cible as Nom }) };
}
