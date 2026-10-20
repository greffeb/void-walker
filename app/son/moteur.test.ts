import { dureeRecette, RECETTES_GESTES, RECETTES_SIGNAUX, ESPACE_SIGNAUX, GESTES, NOTES_CREPITEMENT, SONS_INTRO } from './recettes';
import { creerMoteur, DEPART, gainDe, sessionAmbiante, type Niveaux } from './moteur';

// Faux contexte audio : il journalise ce que le moteur lui demande, sans produire de son.

class FauxParam {
  value: number;
  readonly journal: { readonly quoi: 'fixer' | 'rampe' | 'cible'; readonly valeur: number; readonly t: number }[] = [];
  constructor(valeur: number) {
    this.value = valeur;
  }
  setValueAtTime(valeur: number, t: number): this {
    this.journal.push({ quoi: 'fixer', valeur, t });
    this.value = valeur;
    return this;
  }
  exponentialRampToValueAtTime(valeur: number, t: number): this {
    this.journal.push({ quoi: 'rampe', valeur, t });
    return this;
  }
  setTargetAtTime(valeur: number, t: number): this {
    this.journal.push({ quoi: 'cible', valeur, t });
    this.value = valeur;
    return this;
  }
}

class FauxNoeud {
  readonly sorties: unknown[] = [];
  constructor(readonly ctx: FauxContexte) {
    ctx.noeuds.push(this);
  }
  connect(vers: unknown): unknown {
    this.sorties.push(vers);
    return vers;
  }
  disconnect(): void {
    this.sorties.length = 0;
  }
}

class FauxSource extends FauxNoeud {
  debut: number | null = null;
  fin: number | null = null;
  arretNet = false;
  start(t = 0): void {
    this.debut = t;
  }
  stop(t?: number): void {
    if (t === undefined) this.arretNet = true;
    else this.fin = t;
  }
}

class FauxOscillateur extends FauxSource {
  type = 'sine';
  readonly frequency = new FauxParam(440);
}

class FauxTampon {
  private readonly canaux: Float32Array[];
  constructor(
    readonly numberOfChannels: number,
    readonly length: number,
    readonly sampleRate: number,
  ) {
    this.canaux = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }
  get duration(): number {
    return this.length / this.sampleRate;
  }
  getChannelData(canal: number): Float32Array {
    const donnees = this.canaux[canal];
    if (donnees === undefined) throw new Error(`Canal ${canal} absent.`);
    return donnees;
  }
}

class FauxLecteur extends FauxSource {
  buffer: FauxTampon | null = null;
  loop = false;
}

class FauxGain extends FauxNoeud {
  readonly gain = new FauxParam(1);
}

class FauxFiltre extends FauxNoeud {
  type = 'lowpass';
  readonly frequency = new FauxParam(350);
  readonly Q = new FauxParam(1);
}

class FauxSaturation extends FauxNoeud {
  curve: Float32Array | null = null;
  oversample = 'none';
}

class FauxConvolution extends FauxNoeud {
  buffer: FauxTampon | null = null;
}

class FauxPanoramique extends FauxNoeud {
  readonly pan = new FauxParam(0);
}

class FauxContexte {
  currentTime = 0;
  readonly sampleRate = 8000;
  state: 'suspended' | 'running' | 'closed' = 'suspended';
  readonly noeuds: FauxNoeud[] = [];
  readonly destination = { nom: 'destination' };
  reprises = 0;
  suspensions = 0;
  resume(): Promise<void> {
    this.reprises += 1;
    this.state = 'running';
    return Promise.resolve();
  }
  suspend(): Promise<void> {
    this.suspensions += 1;
    this.state = 'suspended';
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }
  createGain(): FauxGain {
    return new FauxGain(this);
  }
  createOscillator(): FauxOscillateur {
    return new FauxOscillateur(this);
  }
  createBufferSource(): FauxLecteur {
    return new FauxLecteur(this);
  }
  createBiquadFilter(): FauxFiltre {
    return new FauxFiltre(this);
  }
  createWaveShaper(): FauxSaturation {
    return new FauxSaturation(this);
  }
  createConvolver(): FauxConvolution {
    return new FauxConvolution(this);
  }
  createStereoPanner(): FauxPanoramique {
    return new FauxPanoramique(this);
  }
  createBuffer(canaux: number, longueur: number, frequence: number): FauxTampon {
    return new FauxTampon(canaux, longueur, frequence);
  }
  oscillateurs(): FauxOscillateur[] {
    return this.noeuds.filter((noeud): noeud is FauxOscillateur => noeud instanceof FauxOscillateur);
  }
  lecteurs(): FauxLecteur[] {
    return this.noeuds.filter((noeud): noeud is FauxLecteur => noeud instanceof FauxLecteur);
  }
}

function fausseMinuterie() {
  const attentes: { readonly ms: number; readonly quoi: () => void; annulee: boolean }[] = [];
  return {
    attentes,
    attendre(ms: number, quoi: () => void): () => void {
      const attente = { ms, quoi, annulee: false };
      attentes.push(attente);
      return () => {
        attente.annulee = true;
      };
    },
    actives() {
      return attentes.filter((attente) => !attente.annulee);
    },
    /** Déclenche la plus ancienne attente active qui convient. */
    declencher(convient: (ms: number) => boolean = () => true): number {
      const attente = attentes.find((candidate) => !candidate.annulee && convient(candidate.ms));
      if (attente === undefined) throw new Error('Aucune attente active.');
      attente.annulee = true;
      attente.quoi();
      return attente.ms;
    },
  };
}

function lcg(graine: number): () => number {
  let etat = graine >>> 0;
  return () => {
    etat = (Math.imul(etat, 1664525) + 1013904223) >>> 0;
    return etat / 2 ** 32;
  };
}

const PAR_DEFAUT: Niveaux = { general: 80, effets: 80, ambiance: 30 };
const crepite = (frequence: number): boolean => (NOTES_CREPITEMENT as readonly number[]).includes(frequence);
const frequence = (oscillateur: FauxOscillateur): number => oscillateur.frequency.journal[0]?.valeur ?? oscillateur.frequency.value;
/** Nombre de sources qu'une recette fait partir : une par élément, plus une par bourdonnement. */
const sourcesDe = (recette: readonly { readonly sorte: string; readonly trem?: number }[]): number =>
  recette.length + recette.filter((element) => element.trem !== undefined).length;

function monter(options: { niveaux?: Niveaux; reduit?: boolean; creer?: () => AudioContext | null } = {}) {
  const ctx = new FauxContexte();
  const minuterie = fausseMinuterie();
  let creations = 0;
  const son = creerMoteur(
    {
      creerContexte:
        options.creer ??
        (() => {
          creations += 1;
          return ctx as unknown as AudioContext;
        }),
      hasard: lcg(7),
      minuterie,
      mouvementReduit: () => options.reduit ?? false,
    },
    options.niveaux ?? PAR_DEFAUT,
  );
  return { son, ctx, minuterie, creations: () => creations };
}

describe('moteur du son (15 §5, §6)', () => {
  it('gain : carré du niveau, borné', () => {
    expect(gainDe(80)).toBeCloseTo(0.64);
    expect(gainDe(30)).toBeCloseTo(0.09);
    expect(gainDe(0)).toBe(0);
    expect(gainDe(100)).toBe(1);
    expect(gainDe(-5)).toBe(0);
    expect(gainDe(150)).toBe(1);
  });

  it('aucun son avant le premier toucher (D-222)', () => {
    const { son, ctx, creations } = monter();
    son.geste('clic');
    son.nouveauTexte(true, ['ia']);
    son.taire();
    son.regler({ general: 50, effets: 50, ambiance: 50 });
    son.montrer();
    expect(creations()).toBe(0);
    expect(ctx.noeuds).toHaveLength(0);
  });

  it('premier toucher : un seul contexte, repris, niveaux posés, fond brun en boucle, carlingue programmée entre 20 et 60 s', () => {
    const { son, ctx, minuterie, creations } = monter();
    son.debloquer();
    son.debloquer();
    expect(creations()).toBe(1);
    expect(ctx.state).toBe('running');
    const gains = ctx.noeuds.filter((noeud): noeud is FauxGain => noeud instanceof FauxGain).slice(0, 4);
    // général, effets, entrée du grain cassette, ambiance (ordre de montage).
    expect(gains.map((gain) => Number(gain.gain.value.toFixed(4)))).toEqual([0.64, 0.64, 1, 0.09]);
    const fonds = ctx.lecteurs().filter((lecteur) => lecteur.loop && lecteur.debut !== null);
    expect(fonds).toHaveLength(1);
    expect(minuterie.actives()).toHaveLength(1);
    const [carlingue] = minuterie.actives();
    expect(carlingue?.ms).toBeGreaterThanOrEqual(20000);
    expect(carlingue?.ms).toBeLessThanOrEqual(60000);
  });

  it('geste : chaque recette part maintenant, à travers le grain cassette', () => {
    const { son, ctx } = monter();
    son.debloquer();
    for (const geste of GESTES) {
      const avant = ctx.noeuds.length;
      const sources = ctx.oscillateurs().length + ctx.lecteurs().length;
      son.geste(geste);
      expect(ctx.oscillateurs().length + ctx.lecteurs().length - sources, geste).toBe(sourcesDe(RECETTES_GESTES[geste]));
      expect(ctx.noeuds.length).toBeGreaterThan(avant);
    }
    const clic = ctx.oscillateurs().find((oscillateur) => frequence(oscillateur) === 2400);
    expect(clic?.debut).toBeCloseTo(DEPART);
    expect(clic?.fin).toBeCloseTo(DEPART + 0.004 + 0.02);
  });

  it('intro de NOUVELLE PARTIE : chaque son part maintenant, à travers le grain cassette ; rien avant le premier toucher ni effets à 0 (15 §2.6)', () => {
    const { son, ctx } = monter();
    son.intro('interrupteur');
    expect(ctx.noeuds).toHaveLength(0);
    son.debloquer();
    for (const nom of SONS_INTRO) {
      const sources = ctx.oscillateurs().length + ctx.lecteurs().length;
      son.intro(nom);
      expect(ctx.oscillateurs().length + ctx.lecteurs().length, nom).toBeGreaterThan(sources);
    }
    const blessure = ctx.oscillateurs().filter((oscillateur) => frequence(oscillateur) === 220);
    expect(blessure.length).toBeGreaterThan(0);
    son.regler({ ...PAR_DEFAUT, effets: 0 });
    const sources = ctx.oscillateurs().length + ctx.lecteurs().length;
    son.intro('menace');
    expect(ctx.oscillateurs().length + ctx.lecteurs().length).toBe(sources);
  });

  it('téléphone : un bruitage court part assez loin devant l’horloge audio pour ne jamais tomber dans le passé', () => {
    // Sur téléphone, l'horloge lue par la page retarde de 10 à 40 ms : un tic de 4 ms programmé 10 ms devant était joué muet.
    const { son, ctx } = monter();
    son.debloquer();
    ctx.currentTime = 2;
    const avant = ctx.noeuds.length;
    son.geste('fermer');
    const nouveaux = ctx.noeuds.slice(avant);
    const tic = nouveaux.find((noeud): noeud is FauxLecteur => noeud instanceof FauxLecteur);
    expect(tic?.debut).toBeGreaterThanOrEqual(2 + 0.05);
    for (const gain of nouveaux.filter((noeud): noeud is FauxGain => noeud instanceof FauxGain)) {
      for (const etape of gain.gain.journal) expect(etape.t).toBeGreaterThanOrEqual(2 + 0.05);
    }
  });

  it('effets à 0 ou général à 0 : aucun bruitage ; général à 0 arrête aussi le fond', () => {
    const { son, ctx } = monter();
    son.debloquer();
    son.regler({ ...PAR_DEFAUT, effets: 0 });
    const sources = ctx.oscillateurs().length;
    son.geste('confirmer');
    expect(ctx.oscillateurs()).toHaveLength(sources);
    son.regler({ ...PAR_DEFAUT, general: 0 });
    son.geste('confirmer');
    expect(ctx.oscillateurs()).toHaveLength(sources);
    expect(ctx.lecteurs().find((lecteur) => lecteur.loop && lecteur.debut !== null && lecteur.buffer?.duration === 9)?.arretNet).toBe(true);
  });

  it('ambiance à 0 : fond arrêté net et carlingue annulée ; remontée : fond relancé, carlingue reprogrammée', () => {
    const { son, ctx, minuterie } = monter();
    son.debloquer();
    son.regler({ ...PAR_DEFAUT, ambiance: 0 });
    expect(ctx.lecteurs()[0]?.arretNet).toBe(true);
    expect(minuterie.actives()).toHaveLength(0);
    son.regler(PAR_DEFAUT);
    expect(ctx.lecteurs().filter((lecteur) => lecteur.loop && !lecteur.arretNet)).toHaveLength(1);
    expect(minuterie.actives()).toHaveLength(1);
  });

  it('écriture : crépitement pendant 500 ms, puis les signaux dans l’ordre, 250 ms après la fin du précédent (15 §2.3, §2.4)', () => {
    const { son, ctx, minuterie } = monter();
    son.debloquer();
    son.nouveauTexte(true, ['ia', 'alarme-feu']);
    const tics = ctx.oscillateurs().filter((oscillateur) => crepite(frequence(oscillateur)));
    expect(tics.length).toBeGreaterThanOrEqual(12);
    expect(tics.length).toBeLessThanOrEqual(19);
    for (const tic of tics) expect(tic.debut).toBeLessThan(DEPART + 0.5);
    expect(ctx.oscillateurs().some((oscillateur) => frequence(oscillateur) === 1400 || frequence(oscillateur) === 1600)).toBe(false);
    ctx.currentTime = 0.5;
    expect(minuterie.declencher((ms) => ms === 500)).toBe(500);
    const alarme = ctx.oscillateurs().filter((oscillateur) => frequence(oscillateur) === 1400);
    const ia = ctx.oscillateurs().filter((oscillateur) => frequence(oscillateur) === 1600);
    expect(alarme).toHaveLength(6);
    expect(ia).toHaveLength(3);
    expect(alarme[0]?.debut).toBeCloseTo(0.5 + DEPART);
    expect(ia[0]?.debut).toBeCloseTo(0.5 + DEPART + dureeRecette(RECETTES_SIGNAUX['alarme-feu']) + ESPACE_SIGNAUX);
  });

  it('écriture sautée : crépitement arrêté net, signaux tout de suite ; plus rien à 500 ms', () => {
    const { son, ctx, minuterie } = monter();
    son.debloquer();
    son.nouveauTexte(true, ['soin']);
    son.taire();
    for (const tic of ctx.oscillateurs().filter((oscillateur) => crepite(frequence(oscillateur)))) expect(tic.arretNet).toBe(true);
    expect(ctx.oscillateurs().filter((oscillateur) => frequence(oscillateur) === 523)).toHaveLength(1);
    expect(minuterie.actives().some((attente) => attente.ms === 500)).toBe(false);
    son.taire();
    expect(ctx.oscillateurs().filter((oscillateur) => frequence(oscillateur) === 523)).toHaveLength(1);
  });

  it('souffle dont le filtre glisse (victoire) : la fréquence part de f et rejoint fin sur la durée', () => {
    const { son, ctx } = monter();
    son.debloquer();
    son.nouveauTexte(false, ['victoire']);
    const glisse = ctx.noeuds.filter((noeud): noeud is FauxFiltre => noeud instanceof FauxFiltre).find((filtre) => filtre.frequency.journal.some((etape) => etape.quoi === 'rampe' && etape.valeur === 200));
    expect(glisse?.frequency.journal).toEqual([
      { quoi: 'fixer', valeur: 3000, t: DEPART },
      { quoi: 'rampe', valeur: 200, t: DEPART + 1.2 },
    ]);
  });

  it('sans écriture, ou moins d’animations demandées : pas de crépitement, signaux tout de suite', () => {
    for (const [ecriture, reduit] of [
      [false, false],
      [true, true],
    ] as const) {
      const { son, ctx } = monter({ reduit });
      son.debloquer();
      son.nouveauTexte(ecriture, ['ia']);
      expect(ctx.oscillateurs().some((oscillateur) => crepite(frequence(oscillateur)))).toBe(false);
      expect(ctx.oscillateurs().filter((oscillateur) => frequence(oscillateur) === 1600)).toHaveLength(3);
    }
  });

  it('nouveau texte pendant une écriture : les signaux en attente partent avant le nouveau crépitement', () => {
    const { son, ctx } = monter();
    son.debloquer();
    son.nouveauTexte(true, ['ia']);
    son.nouveauTexte(true, []);
    expect(ctx.oscillateurs().filter((oscillateur) => frequence(oscillateur) === 1600)).toHaveLength(3);
  });

  it('arrière-plan : pause en bloc, écriture et signaux abandonnés, rien en retard ; retour : reprise et carlingue reprogrammée', () => {
    const { son, ctx, minuterie } = monter();
    son.debloquer();
    son.nouveauTexte(true, ['alarme-feu']);
    son.cacher();
    expect(ctx.suspensions).toBe(1);
    for (const tic of ctx.oscillateurs().filter((oscillateur) => crepite(frequence(oscillateur)))) expect(tic.arretNet).toBe(true);
    expect(minuterie.actives()).toHaveLength(0);
    son.geste('clic');
    son.montrer();
    expect(ctx.state).toBe('running');
    expect(ctx.oscillateurs().some((oscillateur) => frequence(oscillateur) === 1400 || frequence(oscillateur) === 2400)).toBe(false);
    expect(minuterie.actives()).toHaveLength(1);
  });

  it('arrière-plan : les sons déjà programmés (signaux, gestes, carlingue) s’arrêtent net, rien ne repart au retour', () => {
    const { son, ctx, minuterie } = monter();
    son.debloquer();
    son.nouveauTexte(false, ['alarme-feu', 'ia']);
    son.geste('confirmer');
    minuterie.declencher();
    const programmees = [...ctx.oscillateurs(), ...ctx.lecteurs().filter((lecteur) => !(lecteur.loop && lecteur.buffer?.duration === 9))];
    expect(programmees.length).toBeGreaterThan(10);
    son.cacher();
    for (const source of programmees) expect(source.arretNet).toBe(true);
    // Le fond brun n'est pas arrêté : il reprend avec le contexte.
    expect(ctx.lecteurs().find((lecteur) => lecteur.loop && lecteur.buffer?.duration === 9)?.arretNet).toBe(false);
  });

  it('carlingue : à chaque échéance, un son à gauche ou à droite, réverbéré, puis le suivant entre 20 et 60 s', () => {
    const { son, ctx, minuterie } = monter();
    son.debloquer();
    let gongs = 0;
    let frottements = 0;
    for (let echeance = 0; echeance < 200; echeance += 1) {
      const oscillateurs = ctx.oscillateurs().length;
      const lecteurs = ctx.lecteurs().length;
      const panoramiques = ctx.noeuds.filter((noeud) => noeud instanceof FauxPanoramique).length;
      minuterie.declencher();
      const pan = ctx.noeuds.filter((noeud): noeud is FauxPanoramique => noeud instanceof FauxPanoramique);
      expect(pan).toHaveLength(panoramiques + 1);
      const dernier = pan[pan.length - 1];
      expect(Math.abs(dernier?.pan.value ?? 9)).toBeLessThanOrEqual(0.75);
      expect(dernier?.sorties.some((sortie) => sortie instanceof FauxConvolution)).toBe(true);
      if (ctx.oscillateurs().length - oscillateurs >= 12) gongs += 1;
      if (ctx.lecteurs().slice(lecteurs).some((lecteur) => !lecteur.loop)) frottements += 1;
      const [suivante] = minuterie.actives();
      expect(minuterie.actives()).toHaveLength(1);
      expect(suivante?.ms).toBeGreaterThanOrEqual(20000);
      expect(suivante?.ms).toBeLessThanOrEqual(60000);
    }
    expect(gongs).toBeGreaterThan(0);
    expect(frottements).toBeGreaterThan(gongs);
  });

  it('audio absent ou en panne : muet, sans erreur (15 §5)', () => {
    const absent = monter({ creer: () => null });
    expect(() => {
      absent.son.debloquer();
      absent.son.geste('clic');
      absent.son.nouveauTexte(true, ['ia']);
      absent.son.taire();
      absent.son.regler(PAR_DEFAUT);
      absent.son.cacher();
      absent.son.montrer();
    }).not.toThrow();
    expect(absent.ctx.noeuds).toHaveLength(0);

    const refuse = monter({
      creer: () => {
        throw new Error('NotAllowedError');
      },
    });
    expect(() => {
      refuse.son.debloquer();
      refuse.son.geste('clic');
    }).not.toThrow();

    const casse = monter();
    casse.son.debloquer();
    casse.ctx.createOscillator = () => {
      throw new Error('InvalidStateError');
    };
    expect(() => casse.son.geste('clic')).not.toThrow();
    const noeuds = casse.ctx.noeuds.length;
    expect(() => {
      casse.son.geste('confirmer');
      casse.son.nouveauTexte(true, ['ia']);
      casse.son.debloquer();
    }).not.toThrow();
    expect(casse.ctx.noeuds).toHaveLength(noeuds);
  });
});

describe('session audio « ambient » (15 §5, D-222)', () => {
  it('réglée quand le navigateur la propose ; absente ou refusée, le jeu démarre quand même', () => {
    const session = { type: 'auto' };
    sessionAmbiante({ audioSession: session });
    expect(session.type).toBe('ambient');
    expect(() => sessionAmbiante({})).not.toThrow();
    const refusee = {
      get audioSession(): never {
        throw new Error('SecurityError');
      },
    };
    expect(() => sessionAmbiante(refusee)).not.toThrow();
    const figee = Object.freeze({ audioSession: Object.freeze({ type: 'auto' }) });
    expect(() => sessionAmbiante(figee)).not.toThrow();
  });
});
