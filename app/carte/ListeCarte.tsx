import { MOTS_CARTE, type BlocListe } from '../../content';

/** Vue LISTE (14 §2.8) : le même contenu que le plan, en texte, pour le lecteur d'écran et les grandes tailles de texte. */
export function ListeCarte({ blocs }: { readonly blocs: readonly BlocListe[] }) {
  return (
    <div className="carte-liste">
      {blocs.map((bloc) => (
        <section key={bloc.titre} className="carte-bloc" aria-label={bloc.titre}>
          <h3 className="carte-bloc-titre">{`── ${bloc.titre} ──`}</h3>
          {bloc.entrees.length === 0 ? (
            <p className="carte-aucune">{MOTS_CARTE.aucune}</p>
          ) : (
            <ul>
              {bloc.entrees.map((entree, index) => (
                <li key={index}>
                  <span className="carte-entree-titre">{entree.titre}</span>
                  {entree.details.length > 0 && <span className="carte-entree-details">{` ${entree.details.join(' · ')}`}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
