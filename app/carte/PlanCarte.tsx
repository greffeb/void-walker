import { useRef, type CSSProperties, type PointerEvent, type WheelEvent } from 'react';
import type { CartePublique, PassageCarte, PieceCarte } from '../../engine';
import { libellePiece, nomDe, regardDe, type TextesMonde } from '../../content';
import { pointsTrace, rectCapsule, segmentOuverture } from './dessin';
import { enPixels, etiquettes, glisser, montrer, pincer, SEUIL_GLISSER_PX, TEXTE_MARQUE, zoneTouchable, type Point, type Vue } from './vue';

export interface PropsPlan {
  readonly carte: CartePublique;
  readonly textes: TextesMonde;
  readonly vue: Vue;
  /** Une case au zoom 1, mesurée à l'écran : 34 px fois l'échelle du texte (14 §2.3). */
  readonly casePx: number;
  readonly zoomMin: number;
  readonly changerVue: (maj: (vue: Vue) => Vue) => void;
  readonly toucher: (piece: PieceCarte, bouton: HTMLButtonElement) => void;
  /** Pièce dont la fiche est ouverte, par identifiant public. */
  readonly ouverte: string | null;
}

/** Losange de la créature (14 §2.5), avec son point, dans le coin de la pièce. */
function Losange({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <g className="losange">
      <polygon points={`${x},${y - 7} ${x + 7},${y} ${x},${y + 7} ${x - 7},${y}`} />
      <circle cx={x} cy={y} r="1.5" />
    </g>
  );
}

/** Ouverture d'un passage (14 §2.6) : dans son mur, ou tracé d'un conduit découvert. */
function Ouverture({ passage, point }: { readonly passage: PassageCarte; readonly point: (x: number, y: number) => Point }) {
  const emplacement = passage.emplacement;
  if (emplacement === null) return null;
  if (emplacement.type === 'trace') {
    const points = pointsTrace(emplacement.cases).map(([x, y]) => {
      const p = point(x, y);
      return `${p.x},${p.y}`;
    });
    return <polyline className="conduit" points={points.join(' ')} />;
  }
  const { x1, y1, x2, y2 } = segmentOuverture(emplacement);
  const a = point(x1, y1);
  const b = point(x2, y2);
  const segment = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  const milieu = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return (
    <g>
      <line className="ouverture" {...segment} />
      {passage.dessin === 'tirets' ? <line className="ouverture-tirets" {...segment} /> : !passage.ouvert && <line className="ouverture-fermee" {...segment} />}
      {passage.voyant !== null && <circle className={`voyant voyant-${passage.voyant}`} cx={milieu.x} cy={milieu.y} r="4" />}
      {passage.entre === null && (
        <text className="ouverture-inconnue" x={milieu.x + 6} y={milieu.y - 6}>
          ?
        </text>
      )}
    </g>
  );
}

/**
 * Plan de pont (14 §2.4 à §2.6) : traits en SVG, pièces en boutons par-dessus. Glisser d'un doigt le parcourt, pincer le zoome
 * (14 §2.3) ; un toucher sans glissement ouvre la fiche d'une pièce. Aucune animation.
 */
export function PlanCarte({ carte, textes, vue, casePx, zoomMin, changerVue, toucher, ouverte }: PropsPlan) {
  const doigts = useRef(new Map<number, Point>());
  const depart = useRef<Point | null>(null);
  const glisse = useRef(false);
  const echelle = casePx * vue.zoom;
  const point = (x: number, y: number): Point => ({ x: vue.x + x * echelle, y: vue.y + y * echelle });

  const appuyer = (evenement: PointerEvent<HTMLDivElement>): void => {
    doigts.current.set(evenement.pointerId, { x: evenement.clientX, y: evenement.clientY });
    if (doigts.current.size === 1) {
      glisse.current = false;
      depart.current = { x: evenement.clientX, y: evenement.clientY };
    }
  };
  const bouger = (evenement: PointerEvent<HTMLDivElement>): void => {
    const avant = doigts.current.get(evenement.pointerId);
    if (avant === undefined) return;
    const maintenant = { x: evenement.clientX, y: evenement.clientY };
    const autre = [...doigts.current].find(([id]) => id !== evenement.pointerId)?.[1];
    if (autre === undefined) {
      const origine = depart.current;
      // Sous le seuil, c'est encore un toucher : il pourra ouvrir une fiche.
      if (!glisse.current && origine !== null && Math.hypot(maintenant.x - origine.x, maintenant.y - origine.y) < SEUIL_GLISSER_PX) return;
      glisse.current = true;
      doigts.current.set(evenement.pointerId, maintenant);
      changerVue((courante) => glisser(courante, maintenant.x - avant.x, maintenant.y - avant.y));
      return;
    }
    glisse.current = true;
    doigts.current.set(evenement.pointerId, maintenant);
    const ecartAvant = Math.hypot(avant.x - autre.x, avant.y - autre.y);
    if (ecartAvant === 0) return;
    const facteur = Math.hypot(maintenant.x - autre.x, maintenant.y - autre.y) / ecartAvant;
    const boite = evenement.currentTarget.getBoundingClientRect();
    const centre = { x: (maintenant.x + autre.x) / 2 - boite.left, y: (maintenant.y + autre.y) / 2 - boite.top };
    changerVue((courante) => pincer(courante, facteur, centre, zoomMin));
  };
  const lever = (evenement: PointerEvent<HTMLDivElement>): void => {
    doigts.current.delete(evenement.pointerId);
  };
  // Molette, ou pincement d'un pavé tactile : le même zoom, autour du pointeur.
  const molette = (evenement: WheelEvent<HTMLDivElement>): void => {
    const boite = evenement.currentTarget.getBoundingClientRect();
    const centre = { x: evenement.clientX - boite.left, y: evenement.clientY - boite.top };
    const facteur = evenement.deltaY < 0 ? 1.1 : 1 / 1.1;
    changerVue((courante) => pincer(courante, facteur, centre, zoomMin));
  };

  return (
    <div className="carte-plan" onPointerDown={appuyer} onPointerMove={bouger} onPointerUp={lever} onPointerCancel={lever} onWheel={molette}>
      <svg className="carte-traits" aria-hidden="true">
        <defs>
          <pattern id="carte-hachures" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect className="motif-feu" width="3" height="8" />
          </pattern>
          <pattern id="carte-points" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle className="motif-vide" cx="4" cy="4" r="1.5" />
          </pattern>
        </defs>
        {carte.pieces.map((piece) => {
          if (piece.rect === null) return null;
          const { gauche, haut, largeur, hauteur } = enPixels(piece.rect, vue, casePx);
          const forme = { x: gauche, y: haut, width: largeur, height: hauteur };
          return (
            <g key={piece.piece.id}>
              {piece.statut !== 'connue' && <rect className="sol" {...forme} />}
              {piece.feu !== null && <rect className="motif" fill="url(#carte-hachures)" {...forme} />}
              {piece.vide && <rect className="motif" fill="url(#carte-points)" {...forme} />}
              <rect className={`mur mur-${piece.statut}`} {...forme} />
              {piece.creature !== null && <Losange x={gauche + largeur - 12} y={haut + 12} />}
            </g>
          );
        })}
        {carte.capsules.map((capsule) => {
          const salle = carte.pieces.find((piece) => piece.piece.id === capsule.piece.id)?.rect;
          if (salle === null || salle === undefined) return null;
          const { gauche, haut, largeur, hauteur } = enPixels(rectCapsule(salle, capsule.pan), vue, casePx);
          return <rect key={capsule.objet.id} className="capsule" x={gauche} y={haut} width={largeur} height={hauteur} rx={Math.min(largeur, hauteur) / 2} />;
        })}
        {carte.passages.map((passage) => (
          <Ouverture key={passage.id} passage={passage} point={point} />
        ))}
      </svg>
      {carte.pieces.map((piece) => {
        if (piece.rect === null) return null;
        const cible = zoneTouchable(enPixels(piece.rect, vue, casePx));
        const textesPiece = etiquettes(piece, nomDe(textes, piece.piece).texte, regardDe(piece), vue.zoom);
        return (
          <button
            key={piece.piece.id}
            type="button"
            className="carte-piece"
            data-statut={piece.statut}
            aria-label={libellePiece(textes, piece)}
            aria-haspopup="dialog"
            aria-expanded={ouverte === piece.piece.id}
            // --texte-carte : le texte suit le plan quand on dézoome, jusqu'aux trois quarts (TEXTE_MIN).
            style={{ left: cible.gauche, top: cible.haut, width: cible.largeur, height: cible.hauteur, '--texte-carte': textesPiece.texte } as CSSProperties}
            // Un clic au clavier (detail 0) ouvre toujours ; le clic qui termine un glissement n'ouvre rien, et lui seul : une
            // activation suivante sans nouvel appui, comme celle d'un lecteur d'écran, ouvre la fiche.
            onClick={(evenement) => {
              if (evenement.detail > 0 && glisse.current) {
                glisse.current = false;
                return;
              }
              toucher(piece, evenement.currentTarget);
            }}
            // Au clavier, une pièce hors de l'écran y est ramenée quand elle prend le focus (12 §7).
            onFocus={(evenement) => {
              const rect = piece.rect;
              const plan = evenement.currentTarget.parentElement?.getBoundingClientRect();
              if (rect === null || plan === undefined) return;
              changerVue((courante) => montrer(courante, enPixels(rect, courante, casePx), { largeur: plan.width, hauteur: plan.height }));
            }}
          >
            <span className="carte-textes" aria-hidden="true">
              {textesPiece.nom.map((ligne) => (
                <span key={ligne} className="carte-nom">
                  {ligne}
                </span>
              ))}
              {textesPiece.etats.map((ligne) => (
                <span key={ligne.join(' ')} className="carte-etats">
                  {ligne.map((marque) => (
                    <span key={marque} className="carte-etiquette" data-marque={marque}>
                      {TEXTE_MARQUE[marque]}
                    </span>
                  ))}
                </span>
              ))}
              {textesPiece.anciennete.map((ligne) => (
                <span key={ligne} className="carte-anciennete">
                  {ligne}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
