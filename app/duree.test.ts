import { ABSENCE_MS, BATTEMENT_MS, creerChronometre, type PartieChronometree } from './duree';

const CLE = 'void-walker:duree:/test/';

const partie = (graine: number, actions = 0): PartieChronometree => ({ enregistrement: { monde: 'm-07-a', graine }, etat: { actions } });

/** Horloge à la main et appareil factice ; `battre` avance d'un battement, comme le minuteur de la page. */
function banc(options: { visible?: boolean; ecritureRefusee?: boolean; appareil?: Map<string, string> } = {}) {
  const appareil = options.appareil ?? new Map<string, string>();
  let maintenant = 1_000;
  const chrono = creerChronometre({
    cle: CLE,
    lire: (cle) => appareil.get(cle) ?? null,
    ecrire: (cle, valeur) => {
      if (options.ecritureRefusee === true) throw new Error('QuotaExceededError');
      appareil.set(cle, valeur);
    },
    maintenant: () => maintenant,
    visible: options.visible ?? true,
  });
  const avancer = (ms: number): void => {
    maintenant += ms;
  };
  /** `ms` d'écran allumé, battement après battement. */
  const jouer = (ms: number): void => {
    for (let reste = ms; reste > 0; reste -= BATTEMENT_MS) {
      avancer(Math.min(BATTEMENT_MS, reste));
      chrono.battre();
    }
  };
  return { chrono, appareil, avancer, jouer };
}

describe('durée d’une partie, écran allumé (#204)', () => {
  it('compte le temps passé dans la partie, du réveil à maintenant', () => {
    const { chrono, jouer } = banc();
    const p = partie(1);
    chrono.suivre(p);
    jouer(42_000);
    expect(chrono.secondes(p)).toBe(42);
  });

  it('se met en pause quand l’écran s’éteint et reprend au retour', () => {
    const { chrono, jouer, avancer } = banc();
    const p = partie(1);
    chrono.suivre(p);
    jouer(30_000);
    chrono.cacher();
    avancer(10 * 60_000);
    chrono.battre();
    chrono.montrer();
    jouer(20_000);
    expect(chrono.secondes(p)).toBe(50);
  });

  it('ne compte pas une longue absence sans signal de la page (appareil endormi)', () => {
    const { chrono, jouer, avancer } = banc();
    const p = partie(1);
    chrono.suivre(p);
    jouer(10_000);
    avancer(ABSENCE_MS + 1);
    chrono.battre();
    jouer(10_000);
    expect(chrono.secondes(p)).toBe(20);
  });

  it('une absence découverte par un geste plutôt qu’un battement ne compte pas non plus', () => {
    const { chrono, jouer, avancer } = banc();
    const p = partie(1, 3);
    chrono.suivre(partie(1));
    jouer(10_000);
    avancer(3_600_000);
    chrono.suivre(p);
    jouer(5_000);
    expect(chrono.secondes(p)).toBe(15);
  });

  it('survit à la fermeture et à la réouverture du jeu en cours de partie', () => {
    const premier = banc();
    premier.chrono.suivre(partie(1));
    premier.jouer(61_000);
    premier.chrono.cacher();
    const second = banc({ appareil: premier.appareil });
    const reprise = partie(1, 12);
    second.chrono.suivre(reprise);
    second.jouer(9_000);
    expect(second.chrono.secondes(reprise)).toBe(70);
  });

  it('garde la durée à chaque battement, même si la page est tuée sans prévenir', () => {
    const premier = banc();
    premier.chrono.suivre(partie(1));
    premier.jouer(BATTEMENT_MS * 4);
    const second = banc({ appareil: premier.appareil });
    expect(second.chrono.secondes(partie(1, 5))).toBe(20);
  });

  it('s’arrête à la fin de la partie et garde sa durée pour le rapport', () => {
    const { chrono, jouer } = banc();
    const p = partie(1);
    chrono.suivre(p);
    jouer(25_000);
    chrono.suivre(null);
    jouer(60_000);
    expect(chrono.secondes(p)).toBe(25);
  });

  it('une autre partie, même sur la même station (REJOUER), repart de zéro', () => {
    const { chrono, jouer } = banc();
    chrono.suivre(partie(1));
    jouer(40_000);
    chrono.suivre(null);
    const autre = partie(2);
    chrono.suivre(autre);
    jouer(5_000);
    expect(chrono.secondes(autre)).toBe(5);
  });

  it('lit sur l’appareil la durée d’une partie qui n’est pas à l’écran (options depuis l’accueil)', () => {
    const premier = banc();
    premier.chrono.suivre(partie(1));
    premier.jouer(33_000);
    premier.chrono.cacher();
    const second = banc({ appareil: premier.appareil });
    second.chrono.suivre(null);
    expect(second.chrono.secondes(partie(1, 8))).toBe(33);
    expect(second.chrono.secondes(partie(2, 8))).toBeNull();
  });

  it('une partie déjà commencée dont la durée n’a pas été gardée n’est pas mesurée', () => {
    const { chrono, jouer, appareil } = banc();
    const p = partie(1, 7);
    chrono.suivre(p);
    jouer(30_000);
    expect(chrono.secondes(p)).toBeNull();
    expect(appareil.has(CLE)).toBe(false);
  });

  it('page cachée au lancement : rien ne compte avant qu’elle se montre', () => {
    const { chrono, jouer } = banc({ visible: false });
    const p = partie(1);
    chrono.suivre(p);
    jouer(30_000);
    chrono.montrer();
    jouer(10_000);
    expect(chrono.secondes(p)).toBe(10);
  });

  it('un enregistrement illisible est ignoré', () => {
    const appareil = new Map([[CLE, '{"monde":"m-07-a","graine":1,"ms":"beaucoup"}']]);
    const { chrono, jouer } = banc({ appareil });
    const p = partie(1);
    expect(chrono.secondes(p)).toBeNull();
    chrono.suivre(p);
    jouer(5_000);
    expect(chrono.secondes(p)).toBe(5);
  });

  it('si l’appareil refuse d’écrire, la durée compte quand même pendant la session', () => {
    const { chrono, jouer } = banc({ ecritureRefusee: true });
    const p = partie(1);
    chrono.suivre(p);
    jouer(15_000);
    expect(chrono.secondes(p)).toBe(15);
  });
});
