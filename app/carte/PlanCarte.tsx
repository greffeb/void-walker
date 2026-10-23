import { useRef, type CSSProperties, type PointerEvent, type WheelEvent } from 'react';
import type { CartePublique, EtatCapteur, Palier, PassageCarte, PieceCarte } from '../../engine';
import { CASE_PX, libellePiece, nomDe, regardDe, type TextesMonde } from '../../content';
import { DEMI_PORTE, pointsTrace, rectCapsule, segmentOuverture } from './dessin';
import {
  centresIcones,
  enPixels,
  etiquettes,
  glisser,
  ICONE_ECHELLE,
  iconesDe,
  montrer,
  pincer,
  SEUIL_GLISSER_PX,
  TEXTE_MARQUE,
  zoneTouchable,
  type Point,
  type Vue,
} from './vue';

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

/**
 * Passager (D-273) : un point plein et trois ondes radar qui s'élargissent en s'estompant ; en mouvement réduit, deux anneaux fixes.
 * Dessiné autour de (0, 0), puis placé et mis à l'échelle.
 */
function Joueur({ centre, echelle }: { readonly centre: Point; readonly echelle: number }) {
  return (
    <g className="icone-joueur" transform={`translate(${centre.x} ${centre.y}) scale(${echelle})`}>
      {[0, 1, 2].map((onde) => (
        <circle key={onde} className={`onde onde-${onde}`} r="16" />
      ))}
      <circle className="anneau" r="8" />
      <circle className="anneau" r="13" />
      <circle className="point" r="3.5" />
    </g>
  );
}

/**
 * Créature vue (D-273) : un œil rouge dont l'intérieur clignote lentement, à l'instant et il y a un moment ; il y a longtemps, il est
 * fixe et passe en vert secondaire. Le contour et la pupille restent pleins : la forme ne dépend ni du rouge ni du clignotement.
 */
function Oeil({ centre, echelle, palier }: { readonly centre: Point; readonly echelle: number; readonly palier: Palier }) {
  const contour = 'M -9 0 Q 0 -8.5 9 0 Q 0 8.5 -9 0 Z';
  return (
    <g className="icone-creature" data-palier={palier} transform={`translate(${centre.x} ${centre.y}) scale(${echelle})`}>
      <path className="interieur" d={contour} />
      <path className="contour" d={contour} />
      <circle className="pupille" r="2.6" />
    </g>
  );
}

/**
 * Capteur posé (créature mobile lot 3) : un losange. Au mouvement il est plein rouge, avec deux ondes de chaque côté ; brouillé, ses
 * tirets et l'absence de point ; en panne, une barre. La forme dit l'état sans la couleur.
 */
function Capteur({ centre, echelle, etat }: { readonly centre: Point; readonly echelle: number; readonly etat: EtatCapteur }) {
  return (
    <g className="icone-capteur" data-etat={etat} transform={`translate(${centre.x} ${centre.y}) scale(${echelle})`}>
      {etat === 'mouvement' && <path className="onde" d="M-13 -7 a10 10 0 0 0 0 14 M13 -7 a10 10 0 0 1 0 14 M-17 -10 a15 15 0 0 0 0 20 M17 -10 a15 15 0 0 1 0 20" />}
      <path className="corps" d="M0 -9 L9 0 L0 9 L-9 0 Z" />
      {(etat === 'calme' || etat === 'mouvement') && <circle className="coeur" r="2.5" />}
      {etat === 'hs' && <path className="barre" d="M-11 -11 L11 11" />}
    </g>
  );
}

function Drone({ centre, echelle }: { readonly centre: Point; readonly echelle: number }) {
  return (
    <g className="icone-drone" transform={`translate(${centre.x} ${centre.y}) scale(${echelle})`} fill="var(--vert)" shapeRendering="crispEdges">
      <g transform="scale(0.75)">
        <path fillRule="evenodd" d="M-8-12H8V-10H10V4H8V6H-8V4H-10V-10H-8ZM-7-9V3H7V-9Z" />
        <path d="M-16-9H-12V-6H-16ZM-16-3H-12V0H-16ZM12-9H16V-6H12ZM12-3H16V0H12Z" />
        <rect x="-1.5" y="-7" width="3" height="3" />
        <path d="M-2 6H2V9H5V12H7V16H3V12H1V10H-1V12H-3V16H-7V12H-5V9H-2Z" />
      </g>
    </g>
  );
}

/** Demi-longueur des taquets qui bordent une porte, en px, de part et d'autre du mur. */
const TAQUET_PX = 3;

/**
 * Ouverture d'un passage (14 §2.6) : dans son mur, ou tracé d'un conduit découvert. Une porte est bordée de deux taquets ; fermée,
 * une barre claire et épaisse la bouche (D-355).
 */
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
  const porte = passage.dessin !== 'tirets';
  const { x1, y1, x2, y2 } = segmentOuverture(emplacement, porte ? DEMI_PORTE : undefined);
  const a = point(x1, y1);
  const b = point(x2, y2);
  const segment = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  const milieu = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  // Taquet : petit trait en travers du mur, à chaque bord de la porte.
  const taquet = (bord: Point) =>
    emplacement.axe === 'v'
      ? { x1: bord.x - TAQUET_PX, y1: bord.y, x2: bord.x + TAQUET_PX, y2: bord.y }
      : { x1: bord.x, y1: bord.y - TAQUET_PX, x2: bord.x, y2: bord.y + TAQUET_PX };
  return (
    <g>
      <line className="ouverture" {...segment} />
      {!porte && <line className="ouverture-tirets" {...segment} />}
      {porte && <line className="taquet" {...taquet(a)} />}
      {porte && <line className="taquet" {...taquet(b)} />}
      {porte && !passage.ouvert && <line className="ouverture-fermee" {...segment} />}
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
 * (14 §2.3) ; un toucher sans glissement ouvre la fiche d'une pièce. Seules les icônes s'animent, en CSS, sauf en mouvement réduit.
 */
export function PlanCarte({ carte, textes, vue, casePx, zoomMin, changerVue, toucher, ouverte }: PropsPlan) {
  const doigts = useRef(new Map<number, Point>());
  const depart = useRef<Point | null>(null);
  const glisse = useRef(false);
  const echelle = casePx * vue.zoom;
  // Échelle de la taille du texte (1 à STANDARD) : les icônes la suivent, pas le zoom (14 §2.5).
  const echelleTexte = casePx / CASE_PX;
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
        {carte.pieces.map((piece) => {
          const icones = iconesDe(piece);
          if (piece.rect === null || icones.length === 0) return null;
          const textesPiece = etiquettes(piece, nomDe(textes, piece.piece).texte, regardDe(piece), vue.zoom);
          const boite = enPixels(piece.rect, vue, casePx);
          const centres = centresIcones(boite, textesPiece, icones, echelleTexte);
          // Trois présences doivent tenir dans la pièce, même quand le plan est réduit.
          const echelleIcones = icones.length > 2 ? Math.min(ICONE_ECHELLE * echelleTexte, boite.largeur / (32 * icones.length)) : ICONE_ECHELLE * echelleTexte;
          return (
            <g key={piece.piece.id}>
              {centres.joueur !== undefined && <Joueur centre={centres.joueur} echelle={echelleIcones} />}
              {centres.creature !== undefined && piece.creature !== null && (
                <Oeil centre={centres.creature} echelle={echelleIcones} palier={piece.creature} />
              )}
              {centres.drone !== undefined && <Drone centre={centres.drone} echelle={echelleIcones} />}
              {centres.capteur !== undefined && piece.capteur !== undefined && <Capteur centre={centres.capteur} echelle={echelleIcones} etat={piece.capteur} />}
            </g>
          );
        })}
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
                // Fin d'un glissement : ni fiche, ni son de bulle (la racine ne fait pas sonner un clic annulé).
                evenement.preventDefault();
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
            data-son="bulle"
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
