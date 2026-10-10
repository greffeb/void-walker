import type { Cible, Consultation, Evenement, Observation, OptionMenu, Partie, RaisonRefus, Resultat } from '../../engine';
import { choisirVariante, ErreurTexte, former, remplir } from './gabarit';
import type { Nom, TextesMonde } from './types';

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
  }
}

/** Une phrase par événement appliqué (C-07 NP-01). */
export function rendreEvenements(textes: TextesMonde, evenements: readonly Evenement[], cle: CleTexte): string[] {
  return evenements.map((evenement, index) => {
    const variante = choisirVariante(textes.evenements[evenement.type], `${cle.graine}:${cle.action}:${index}:${evenement.type}`);
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
  lignes.push(
    observation.objets.length > 0
      ? remplir(modele.objets, { liste: observation.objets.map((objet) => nomDe(textes, objet)) })
      : remplir(modele.aucunObjet, {}),
  );
  for (const passage of observation.passages) {
    lignes.push(remplir(passage.ouvert ? modele.passageOuvert : modele.passageFerme, { passage: nomDe(textes, passage) }));
  }
  lignes.push(
    observation.inventaire.length > 0
      ? remplir(modele.inventaire, { liste: observation.inventaire.map((objet) => nomDe(textes, objet)) })
      : remplir(modele.inventaireVide, {}),
  );
  return lignes;
}

export interface LibelleOption {
  readonly libelle: string;
  /** Raison publique d'indisponibilité, ou `null` si l'option est jouable. */
  readonly raison: string | null;
}

export function libelleOption(textes: TextesMonde, option: OptionMenu): LibelleOption {
  const { cible } = option;
  const valeurs: Record<string, Nom> = { cible: nomDe(textes, cible) };
  if (cible.sorte === 'passage') valeurs.vers = nomDe(textes, cible.vers);
  const libelle = remplir(textes.libelles[option.action], valeurs);
  if (option.disponible) return { libelle, raison: null };
  if (option.raison === undefined) throw new ErreurTexte(`Option indisponible sans raison : ${option.action}.`);
  return { libelle, raison: remplir(textes.indisponibilites[option.raison], { cible: valeurs.cible as Nom }) };
}
