import type { Consultation } from '../../engine';
import { analyserGabarit, ErreurTexte, remplir } from './gabarit';
import type { SupportDocument, TextesMonde } from './types';

// Rendu structuré d'un document (spec 2026-10-18 §8.5), commun à l'appli et à la CLI (C-06 K-07) : l'appli met chaque support en
// forme, la CLI et le lecteur d'écran lisent `texteDocument`.

/** Une ligne de la fiche : un paragraphe, une entrée de journal (`heure`) ou une didascalie de message (`didascalie`, crochets compris). */
export interface LigneDocument {
  readonly texte: string;
  readonly heure?: string;
  readonly didascalie?: boolean;
}

export interface DocumentRendu {
  readonly support: SupportDocument;
  /** Étiquette du support, que l'appli met en capitales. */
  readonly libelleSupport: string;
  readonly ou: string;
  readonly corps: readonly LigneDocument[];
  /** Note : prénom de l'auteur. */
  readonly signature?: string;
  /** Nom de la pièce désignée, sans article, que l'appli souligne partout où le trou l'a nommée, lettre comprise. */
  readonly piece?: string;
}

/** Le seul trou d'un document : la pièce d'une note de rangement, sous ses formes « le », « de » et « à », avec ou sans majuscule. */
const FORMES_PIECE = ['le', 'de', 'a'];
const FORME_DU_TROU = /\{([^{}:]*):/g;
const ENTREE_JOURNAL = /^(\d{2}:\d{2}) {2}(\S.*)$/su;
const DIDASCALIE = /(\[[^\]]*\])/u;

/**
 * Document que l'on regarde, avec la pièce que désigne une note de rangement ; un trou sans pièce, autre que la pièce ou hors du
 * corps lève une erreur.
 */
export function rendreDocument(textes: TextesMonde, consultation: Extract<Consultation, { type: 'regarder_document' }>): DocumentRendu {
  const { cible, designe } = consultation;
  const document = Object.hasOwn(textes.documents, cible.nom) ? textes.documents[cible.nom] : undefined;
  if (document === undefined) throw new ErreurTexte(`Document sans texte : ${cible.nom}.`);
  const piece = designe === undefined ? undefined : Object.hasOwn(textes.noms, designe.nom) ? textes.noms[designe.nom] : undefined;
  if (designe !== undefined && piece === undefined) throw new ErreurTexte(`Nom sans texte : ${designe.nom}.`);
  // Le seul trou d'un document est la pièce, dans le corps : la ligne « où » et la signature n'en ont aucun.
  const plein = (texte: string, roles: readonly string[] = []): string => {
    const erreurs = analyserGabarit(texte, roles);
    for (const [, forme = ''] of texte.matchAll(FORME_DU_TROU)) if (!FORMES_PIECE.includes(forme.toLowerCase())) erreurs.push(`forme « ${forme} » interdite`);
    if (erreurs.length > 0) throw new ErreurTexte(`Document ${cible.nom} : ${erreurs.join(', ')}.`);
    return remplir(texte, piece === undefined ? {} : { piece });
  };
  const corps = document.corps.flatMap((ligne): LigneDocument[] => {
    const texte = plein(ligne, ['piece']);
    if (document.support === 'journal') {
      const [, heure, entree] = ENTREE_JOURNAL.exec(texte) ?? [];
      if (heure === undefined || entree === undefined) throw new ErreurTexte(`Document ${cible.nom} : entrée de journal sans « hh:mm  texte » : « ${texte} ».`);
      return [{ heure, texte: entree }];
    }
    if (document.support !== 'message') return [{ texte }];
    // Le découpage garde les didascalies aux rangs impairs ; leurs crochets restent dans le texte, pour la CLI et le lecteur d'écran.
    return texte.split(DIDASCALIE).flatMap((segment, rang) => {
      const net = segment.trim();
      return net === '' ? [] : [rang % 2 === 1 ? { texte: net, didascalie: true } : { texte: net }];
    });
  });
  return {
    support: document.support,
    libelleSupport: textes.supports[document.support],
    ou: plein(document.ou),
    corps,
    ...(document.signature === undefined ? {} : { signature: plein(document.signature) }),
    ...(piece === undefined ? {} : { piece: piece.texte }),
  };
}

/** Chaîne du lecteur d'écran et de l'historique : le support, la ligne « où », le corps (« hh:mm texte » pour un journal), la signature. */
export function texteDocument(rendu: DocumentRendu): string {
  const lignes = rendu.corps.map(({ heure, texte }) => (heure === undefined ? texte : `${heure} ${texte}`));
  return [rendu.libelleSupport, rendu.ou, ...lignes, ...(rendu.signature === undefined ? [] : [rendu.signature])].join(' ');
}
