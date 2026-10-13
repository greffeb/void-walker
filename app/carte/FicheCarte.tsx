import { MOTS_CARTE, type FicheTexte } from '../../content';
import { BulleAncree } from '../bulle';

/** Fiche d'une pièce (14 §2.7, D-210) : bulle ancrée sur la pièce, gratuite ; le nom, l'état vu, les objets vus, rien d'autre. */
export function FicheCarte({ fiche, ancre, fermer }: { readonly fiche: FicheTexte; readonly ancre: HTMLElement; readonly fermer: () => void }) {
  return (
    <BulleAncree ancre={ancre} classe="bulle-objet bulle-carte" etape={fiche.titre} titre={fiche.titre} fermer={fermer}>
      <p className="fiche-sous-titre">{fiche.sousTitre}</p>
      {fiche.etats.length > 0 && (
        <>
          <p className="fiche-section">{MOTS_CARTE.etatVu}</p>
          <ul className="fiche-liste">
            {fiche.etats.map((etat) => (
              <li key={etat}>{etat}</li>
            ))}
          </ul>
        </>
      )}
      {fiche.objets !== null && (
        <>
          <p className="fiche-section">{MOTS_CARTE.objetsVus}</p>
          <ul className="fiche-liste">
            {fiche.objets.map((objet, index) => (
              <li key={index}>{objet}</li>
            ))}
          </ul>
        </>
      )}
    </BulleAncree>
  );
}
