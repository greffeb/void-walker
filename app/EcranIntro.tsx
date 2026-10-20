import { useCallback, useEffect, useRef, useState } from 'react';
import type { RectPlan } from '../engine';
import {
  CHARGEMENT,
  COMMANDE_BOOT,
  COMMANDE_CAMPAGNE,
  lignesDuTirage,
  MENACE,
  prete,
  RYTHME,
  SUITE,
  tirage,
  type Intro,
} from './intro';
import { useSon } from './son/contexte';
import { DUREE_STATIQUE, type SonIntro } from './son/recettes';

type Plan = readonly RectPlan[];

/** Cases de la mosaïque de plans, en fond du tirage. */
const CASES = 24;
/** Plans gardés pour le défilé : au-delà, on repioche parmi eux. */
const RESERVE = 40;

interface LigneBoot {
  readonly texte: string;
  readonly ton: 'commande' | 'faible' | 'ok';
}

/** Ce que montre l'écran à un instant de l'intro. */
interface Vue {
  readonly allume: boolean;
  readonly ouverture: boolean;
  readonly saut: boolean;
  readonly boot: readonly LigneBoot[];
  /** Commande en train d'être tapée, curseur au bout ; `null` sans invite. */
  readonly frappe: string | null;
  readonly tirage: boolean;
  readonly carte: Plan | null;
  readonly compteur: number | null;
  /** Station tirée : le plan se voile, le compteur s'arrête sur son numéro. */
  readonly voile: boolean;
  readonly mosaique: readonly (Plan | null)[];
  readonly lignes: number;
  readonly menace: boolean;
  readonly prete: boolean;
  readonly bouton: boolean;
}

const DEPART: Vue = {
  allume: false,
  ouverture: false,
  saut: false,
  boot: [],
  frappe: null,
  tirage: false,
  carte: null,
  compteur: null,
  voile: false,
  mosaique: [],
  lignes: 0,
  menace: false,
  prete: false,
  bouton: false,
};

function Silhouette({ plan }: { readonly plan: Plan | null }) {
  if (plan === null || plan.length === 0) return null;
  const xs = plan.flatMap(({ x, largeur }) => [x, x + largeur]);
  const ys = plan.flatMap(({ y, hauteur }) => [y, y + hauteur]);
  const x0 = Math.min(...xs) - 1;
  const y0 = Math.min(...ys) - 1;
  return (
    <svg className="intro-plan" viewBox={`${x0} ${y0} ${Math.max(...xs) + 1 - x0} ${Math.max(...ys) + 1 - y0}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {plan.map((rect, rang) => (
        <rect key={rang} x={rect.x} y={rect.y} width={rect.largeur} height={rect.hauteur} />
      ))}
    </svg>
  );
}

/**
 * Intro de NOUVELLE PARTIE (12 §4.1 bis, D-305 à D-309). Toucher l'écran l'amène tout de suite à son état final ; seul DÉMARRER
 * mène au réveil. `instantane` : effet machine à écrire coupé ou mouvement réduit, l'intro s'affiche d'emblée finie, sans son.
 */
export function EcranIntro({
  intro,
  numero,
  instantane,
  occupe,
  demarrer,
}: {
  readonly intro: Intro;
  readonly numero: number;
  readonly instantane: boolean;
  readonly occupe: boolean;
  readonly demarrer: () => void;
}) {
  const son = useSon();
  const reserve = useRef<Plan[]>([]);
  const derniere = useRef<Plan | null>(null);
  const passe = useRef(instantane);
  const attentes = useRef(new Set<() => void>());
  const ecran = useRef<HTMLElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const neige = useRef<HTMLCanvasElement>(null);
  const turbulence = useRef<SVGFETurbulenceElement>(null);
  const deplacement = useRef<SVGFEDisplacementMapElement>(null);

  /** Un plan pour le défilé : neuf, ou repioché parmi ceux déjà tirés une fois la réserve assez grande. */
  const unPlan = useCallback((): Plan | null => {
    const plans = reserve.current;
    if (plans.length >= 12 && intro.hasard() < 0.7) return plans[Math.floor(intro.hasard() * plans.length)] ?? null;
    const plan = intro.plan();
    if (plan !== null && plans.length < RESERVE) plans.push(plan);
    return plan ?? plans[0] ?? null;
  }, [intro]);

  const [lignes] = useState(() => lignesDuTirage(intro.hasard));
  const finale = useCallback(
    (vue: Vue, carte: Plan | null): Vue => ({
      ...vue,
      allume: true,
      ouverture: false,
      saut: false,
      frappe: null,
      tirage: true,
      carte,
      compteur: numero,
      voile: true,
      lignes: lignes.length,
      menace: true,
      prete: true,
      bouton: true,
    }),
    [numero, lignes],
  );
  const [vue, setVue] = useState<Vue>(() => (instantane ? finale(DEPART, unPlan()) : DEPART));

  const passer = useCallback(() => {
    if (passe.current) return;
    passe.current = true;
    for (const fin of [...attentes.current]) fin();
    const carte = derniere.current ?? unPlan();
    setVue((avant) => finale(avant, carte));
  }, [finale, unPlan]);

  // Déroulé (D-307) : chaque pas attend, sauf si le joueur a passé l'intro ; tout s'arrête alors, l'état final est déjà posé.
  useEffect(() => {
    if (passe.current) return;
    let actif = true;
    const enAttente = attentes.current;
    const enCours = (): boolean => actif && !passe.current;
    const dormir = (ms: number): Promise<void> =>
      enCours()
        ? new Promise((reveiller) => {
            const fin = (): void => {
              clearTimeout(minuteur);
              enAttente.delete(fin);
              reveiller();
            };
            const minuteur = setTimeout(fin, ms);
            enAttente.add(fin);
          })
        : Promise.resolve();
    const jouer = (nom: SonIntro): void => {
      if (enCours()) son.intro(nom);
    };
    const montrer = (changer: (avant: Vue) => Vue): void => {
      if (enCours()) setVue(changer);
    };
    const taper = async (texte: string, pas: number, nom: SonIntro): Promise<void> => {
      for (let n = 1; n <= texte.length && enCours(); n += 1) {
        if (texte[n - 1] !== ' ') jouer(nom);
        montrer((avant) => ({ ...avant, frappe: texte.slice(0, n) }));
        await dormir(pas);
      }
    };
    void (async () => {
      // 0:00 écran noir, puis mise sous tension tardive.
      await dormir(RYTHME.noir);
      if (!enCours()) return;
      jouer('interrupteur');
      montrer((avant) => ({ ...avant, allume: true, ouverture: true }));
      await dormir(RYTHME.allumage);
      if (!enCours()) return;
      montrer((avant) => ({ ...avant, ouverture: false }));

      // 0:01 saisie machine rapide ; 0:02 deux lignes d'un coup, curseur dessous ; 0:04 saisie au clavier mécanique.
      montrer((avant) => ({ ...avant, frappe: '' }));
      await taper(COMMANDE_BOOT, RYTHME.frappeMachine, 'cliquetis');
      montrer((avant) => ({ ...avant, frappe: null, boot: [{ texte: COMMANDE_BOOT, ton: 'commande' }] }));
      await dormir(RYTHME.apresBoot);
      if (!enCours()) return;
      jouer('relais');
      montrer((avant) => ({
        ...avant,
        boot: [...avant.boot, { texte: CHARGEMENT[0], ton: 'faible' }, { texte: CHARGEMENT[1], ton: 'ok' }],
        frappe: '',
      }));
      await dormir(RYTHME.apresChargement);
      if (!enCours()) return;
      await taper(COMMANDE_CAMPAGNE, RYTHME.frappeClavier, 'clac');
      await dormir(RYTHME.avantSaut);
      if (!enCours()) return;
      // 0:05 l'écran saute.
      jouer('statique');
      montrer((avant) => ({ ...avant, saut: true }));
      await dormir(DUREE_STATIQUE * 1000);
      if (!enCours()) return;
      montrer((avant) => ({ ...avant, saut: false, boot: [], frappe: null }));
      await dormir(RYTHME.apresSaut);
      if (!enCours()) return;

      // 0:06 des stations défilent de plus en plus lentement, puis s'arrêtent sur la station tirée, voilée.
      jouer('relais');
      const mosaique = Array.from({ length: CASES }, (_, rang) => reserve.current[rang] ?? null);
      montrer((avant) => ({ ...avant, tirage: true, mosaique }));
      let pause: number = RYTHME.defile.premier;
      for (let ecoule = 0; ecoule < RYTHME.defile.duree && enCours(); ecoule += pause, pause *= RYTHME.defile.ralentir) {
        const carte = unPlan();
        derniere.current = carte;
        const rang = Math.floor(intro.hasard() * CASES);
        const voisine = unPlan();
        const compteur = 1 + Math.floor(intro.hasard() * intro.total);
        jouer('tic');
        montrer((avant) => ({ ...avant, carte, compteur, mosaique: avant.mosaique.map((plan, n) => (n === rang ? voisine : plan)) }));
        await dormir(pause);
      }
      if (!enCours()) return;
      jouer('arret');
      montrer((avant) => ({ ...avant, compteur: numero, voile: true }));
      await dormir(RYTHME.apresArret);

      // Les lignes une par une, à un pas irrégulier ; puis l'erreur, en rouge.
      for (const [rang, ligne] of lignes.entries()) {
        if (!enCours()) return;
        jouer('ligne');
        montrer((avant) => ({ ...avant, lignes: rang + 1 }));
        await dormir(ligne.pas);
      }
      await dormir(RYTHME.avantMenace);
      if (!enCours()) return;
      jouer('relais');
      jouer('menace');
      montrer((avant) => ({ ...avant, menace: true }));
      await dormir(RYTHME.apresMenace);
      if (!enCours()) return;
      jouer('pret');
      montrer((avant) => ({ ...avant, prete: true }));
      await dormir(RYTHME.avantBouton);
      if (!enCours()) return;
      montrer((avant) => ({ ...avant, bouton: true }));
      passe.current = true;
    })();

    return () => {
      actif = false;
      for (const fin of [...enAttente]) fin();
    };
  }, [intro, lignes, numero, son, unPlan]);

  // Pendant le démarrage, la réserve de plans se remplit pour la mosaïque, un plan à la fois.
  useEffect(() => {
    if (passe.current) return;
    const minuteur = setInterval(() => {
      if (reserve.current.length >= CASES) clearInterval(minuteur);
      else unPlan();
    }, 120);
    return () => clearInterval(minuteur);
  }, [unPlan]);

  // Saut d'image : neige et distorsion redessinées toutes les 45 ms.
  useEffect(() => {
    if (!vue.saut) return;
    const contexte = neige.current?.getContext('2d') ?? null;
    const image = contexte?.createImageData(96, 200) ?? null;
    const tirer = (n: number): number => Math.floor(intro.hasard() * n);
    const dessiner = (): void => {
      if (contexte !== null && image !== null) {
        for (let i = 0; i < image.data.length; i += 4) {
          const v = intro.hasard() * 255;
          image.data[i] = v;
          image.data[i + 1] = v * 0.75;
          image.data[i + 2] = v * 0.45;
          image.data[i + 3] = 255;
        }
        contexte.putImageData(image, 0, 0);
      }
      turbulence.current?.setAttribute('seed', String(tirer(1000)));
      turbulence.current?.setAttribute('baseFrequency', `0.00${1 + tirer(4)} 0.0${3 + tirer(9)}`);
      deplacement.current?.setAttribute('scale', String(20 + tirer(70)));
    };
    dessiner();
    const minuteur = setInterval(dessiner, 45);
    return () => clearInterval(minuteur);
  }, [vue.saut, intro]);

  // Le focus suit l'écran, puis DÉMARRER dès qu'il paraît : Entrée ou Espace passent l'intro, puis démarrent.
  useEffect(() => {
    (vue.bouton ? bouton.current : ecran.current)?.focus({ preventScroll: true });
  }, [vue.bouton]);

  const classes = ['intro-crt', vue.allume && 'allume', vue.ouverture && 'ouverture', vue.saut && 'saut'].filter(Boolean).join(' ');
  return (
    <main
      ref={ecran}
      className="jeu intro"
      aria-label="Tirage de la station"
      tabIndex={-1}
      onPointerDown={passer}
      onKeyDown={(evenement) => {
        if (!vue.bouton && (evenement.key === 'Enter' || evenement.key === ' ')) {
          evenement.preventDefault();
          passer();
        }
      }}
    >
      <div className={classes}>
        <canvas ref={neige} className="intro-neige" width={96} height={200} aria-hidden="true" />
        <div className="intro-bande" aria-hidden="true" />
        <div className="intro-contenu" style={vue.saut ? { filter: 'url(#intro-distorsion) contrast(1.4) brightness(1.3)' } : undefined}>
          {!vue.tirage ? (
            <ul className="intro-terminal" aria-hidden="true">
              {vue.boot.map((ligne, rang) => (
                <li key={rang} className={ligne.ton === 'commande' ? undefined : ligne.ton}>
                  {ligne.ton === 'commande' ? `> ${ligne.texte}` : ligne.texte}
                </li>
              ))}
              {vue.frappe !== null && (
                <li>
                  {`> ${vue.frappe}`}
                  <span className="intro-curseur">█</span>
                </li>
              )}
            </ul>
          ) : (
            <>
              <div className="intro-mosaique" aria-hidden="true">
                {vue.mosaique.map((plan, rang) => (
                  <div key={rang}>
                    <Silhouette plan={plan} />
                  </div>
                ))}
              </div>
              <div className="intro-tirage">
                <div className="intro-centre">
                  <div className={vue.voile ? 'intro-carte intro-voilee' : 'intro-carte'} aria-hidden="true">
                    <Silhouette plan={vue.carte} />
                    {vue.voile && <span className="intro-inconnu">?</span>}
                  </div>
                  <p className="intro-compteur">
                    {vue.compteur !== null && `Station ${vue.compteur}`}
                    {vue.voile && <span className="intro-sur"> sur {intro.total}</span>}
                  </p>
                </div>
                <ul className="intro-terminal">
                  <li>{`> ${tirage(intro.total)}`}</li>
                  {lignes.slice(0, vue.lignes).map((ligne, rang) => (
                    <li key={rang} className="intro-ligne">
                      <span>{`> ${ligne.libelle}`}</span>
                      <span className="intro-points" aria-hidden="true" />
                      <span>{ligne.valeur}</span>
                    </li>
                  ))}
                  {vue.menace && (
                    <li className="intro-menace">
                      <span aria-hidden="true">▲ </span>
                      {MENACE}
                    </li>
                  )}
                  {vue.prete && (
                    <>
                      <li className="intro-blanc" aria-hidden="true" />
                      <li className="ok">
                        {`> ${prete(numero)}`}
                        <span className="intro-curseur" aria-hidden="true">
                          _
                        </span>
                      </li>
                      <li className="faible">{SUITE}</li>
                    </>
                  )}
                </ul>
                <div className="intro-bas">
                  {vue.bouton ? (
                    <button ref={bouton} type="button" className="principal" disabled={occupe} onClick={demarrer} data-son="confirmer">
                      Démarrer
                    </button>
                  ) : (
                    <p className="intro-passer">Toucher pour passer</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="intro-reflet" aria-hidden="true" />
      </div>
      <div className={vue.ouverture ? 'intro-faisceau va' : 'intro-faisceau'} aria-hidden="true" />
      <svg className="intro-filtres" width="0" height="0" aria-hidden="true">
        <filter id="intro-distorsion">
          <feTurbulence ref={turbulence} type="fractalNoise" baseFrequency="0.002 0.09" numOctaves={1} seed={3} result="bruit" />
          <feDisplacementMap ref={deplacement} in="SourceGraphic" in2="bruit" scale={40} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </main>
  );
}
