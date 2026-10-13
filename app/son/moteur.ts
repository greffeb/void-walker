// Moteur du son (15 §5, §6) : seul point de contact avec l'audio du navigateur. Une panne rend le jeu muet, jamais bloqué.

import { DUREE_ECRITURE_MS } from '../ecriture';
import { COQUE, DEPART_CARLINGUE, intervalle, tirerCarlingue, type Carlingue, type Frottement } from './carlingue';
import {
  chuteDe,
  crepitement,
  dureeRecette,
  ESPACE_SIGNAUX,
  FOND,
  GRAIN,
  monteeDe,
  ordonnerSignaux,
  RECETTES_GESTES,
  RECETTES_SIGNAUX,
  type ElementSon,
  type Geste,
  type Recette,
  type Signal,
} from './recettes';

/** Rails des options, de 0 à 100 (15 §4, D-220). */
export interface Niveaux {
  readonly general: number;
  readonly effets: number;
  readonly ambiance: number;
}

export interface Minuterie {
  /** Appelle `quoi` dans `ms` millisecondes ; rend de quoi l'annuler. */
  attendre(ms: number, quoi: () => void): () => void;
}

export interface Dependances {
  /** Contexte audio du navigateur, `null` s'il n'y en a pas ; demandé au premier toucher seulement. */
  readonly creerContexte: () => AudioContext | null;
  readonly hasard: () => number;
  readonly minuterie: Minuterie;
  /** Le téléphone demande moins d'animations : pas d'écriture, donc pas de crépitement (15 §2.3). */
  readonly mouvementReduit: () => boolean;
}

export interface Son {
  /** À chaque toucher : ouvre l'audio la première fois, le reprend ensuite (15 §5). */
  debloquer(): void;
  geste(geste: Geste): void;
  /** Nouveau texte affiché : crépitement s'il s'écrit, puis les signaux dans l'ordre (15 §2.3, §2.4). */
  nouveauTexte(ecriture: boolean, signaux: readonly Signal[]): void;
  /** Texte affiché en entier avant la fin de l'écriture : le crépitement s'arrête net, les signaux partent. */
  taire(): void;
  regler(niveaux: Niveaux): void;
  /** Appli en arrière-plan : pause en bloc (D-222). */
  cacher(): void;
  montrer(): void;
}

const rien = (): void => undefined;

/** Son muet : rendu côté serveur, tests des écrans. */
export const SILENCE: Son = { debloquer: rien, geste: rien, nouveauTexte: rien, taire: rien, regler: rien, cacher: rien, montrer: rien };

/** Gain d'un rail : carré du niveau, pour une pente perçue régulière (15 §4). */
export function gainDe(niveau: number): number {
  return (Math.min(100, Math.max(0, niveau)) / 100) ** 2;
}

/**
 * Session « ambient » (Safari) : le jeu se tait en mode silencieux et se mélange à la musique du joueur (D-222). Un navigateur
 * qui la refuse ou la fige n'empêche pas l'appli de démarrer (15 §5).
 */
export function sessionAmbiante(navigateur: unknown): void {
  try {
    const session = (navigateur as { audioSession?: { type: string } }).audioSession;
    if (session !== undefined) session.type = 'ambient';
  } catch {
    // Refusée : le jeu joue avec la session par défaut.
  }
}

const FONDU_REGLAGE = 0.03;
const SILENCE_GAIN = 0.0001;
/**
 * Un son part 60 ms après sa demande : sur téléphone, l'horloge audio lue par la page retarde de 10 à 40 ms, et un rendu
 * de l'écran peut retenir la demande quelques dizaines de ms ; un tic de 4 ms programmé trop près tombait dans le passé, muet.
 */
export const DEPART = 0.06;

interface Bus {
  readonly ctx: AudioContext;
  readonly general: GainNode;
  readonly effets: GainNode;
  /** Entrée des bruitages : saturation et passe-bas du grain cassette, puis volume des effets. */
  readonly grain: GainNode;
  readonly ambiance: GainNode;
  readonly coque: ConvolverNode;
  readonly bruit: AudioBuffer;
}

function filtre(ctx: BaseAudioContext, type: BiquadFilterType, frequence: number, q = 1): BiquadFilterNode {
  const noeud = ctx.createBiquadFilter();
  noeud.type = type;
  noeud.frequency.value = frequence;
  noeud.Q.value = q;
  return noeud;
}

function courbeSaturation(k: number): Float32Array<ArrayBuffer> {
  const courbe = new Float32Array(1024);
  for (let i = 0; i < courbe.length; i += 1) {
    const x = (i * 2) / courbe.length - 1;
    courbe[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return courbe;
}

function bruitBlanc(ctx: BaseAudioContext, duree: number, hasard: () => number): AudioBuffer {
  const tampon = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * duree), ctx.sampleRate);
  for (let canal = 0; canal < 2; canal += 1) {
    const donnees = tampon.getChannelData(canal);
    for (let i = 0; i < donnees.length; i += 1) donnees[i] = hasard() * 2 - 1;
  }
  return tampon;
}

/** Réverbération de coque (15 §3.4) : bruit de plus en plus sombre, décroissance exp(−1,6 t). */
function reponseCoque(ctx: BaseAudioContext, hasard: () => number): AudioBuffer {
  const longueur = Math.ceil(ctx.sampleRate * COQUE.duree);
  const tampon = ctx.createBuffer(2, longueur, ctx.sampleRate);
  for (let canal = 0; canal < 2; canal += 1) {
    const donnees = tampon.getChannelData(canal);
    let sombre = 0;
    for (let i = 0; i < longueur; i += 1) {
      const t = i / ctx.sampleRate;
      const lissage = 0.25 + 0.7 * (t / COQUE.duree);
      sombre += (hasard() * 2 - 1 - sombre) * (1 - lissage);
      donnees[i] = sombre * Math.exp(-t * COQUE.decroissance);
    }
  }
  return tampon;
}

function tamponFrottement(ctx: BaseAudioContext, son: Frottement, hasard: () => number): AudioBuffer {
  const taux = ctx.sampleRate;
  const longueur = Math.max(1, Math.ceil(taux * son.duree));
  const tampon = ctx.createBuffer(1, longueur, taux);
  const donnees = tampon.getChannelData(0);
  const grain = Math.max(1, Math.floor(son.grain * taux));
  for (const { t, amp } of son.impulsions) {
    const debut = Math.floor(t * taux);
    for (let i = 0; i < grain && debut + i < longueur; i += 1) {
      donnees[debut + i] = (donnees[debut + i] ?? 0) + (hasard() * 2 - 1) * amp * Math.exp(-i / (grain / 3));
    }
  }
  return tampon;
}

function enveloppe(ctx: BaseAudioContext, t: number, duree: number, vol: number, montee: number, chute: number): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(SILENCE_GAIN, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + montee);
  gain.gain.setValueAtTime(vol, Math.max(t + montee, t + duree - chute));
  gain.gain.exponentialRampToValueAtTime(SILENCE_GAIN, t + duree);
  return gain;
}

export function creerMoteur(deps: Dependances, niveauxDeDepart: Niveaux): Son {
  let niveaux = niveauxDeDepart;
  let bus: Bus | null = null;
  /** Audio absent ou en panne : plus rien n'est tenté, le jeu reste muet (15 §5). */
  let enPanne = false;
  let visible = true;
  let fond: AudioBufferSourceNode | null = null;
  let annulerCarlingue: (() => void) | null = null;
  let ecriture: { readonly sources: AudioScheduledSourceNode[]; readonly annuler: () => void } | null = null;
  let enAttente: readonly Signal[] = [];
  /** Sons de passage en cours ou programmés : arrêtés net quand l'appli passe en arrière-plan (D-222) ; le fond brun n'en est pas. */
  const vivantes = new Set<AudioScheduledSourceNode>();

  function suivre<T extends AudioScheduledSourceNode>(source: T): T {
    vivantes.add(source);
    source.onended = () => vivantes.delete(source);
    return source;
  }

  function arreterVivantes(): void {
    for (const source of vivantes) {
      try {
        source.stop();
      } catch {
        // Déjà terminée : rien à arrêter.
      }
    }
    vivantes.clear();
  }

  const audible = (couche: 'effets' | 'ambiance'): boolean => bus !== null && visible && niveaux.general > 0 && niveaux[couche] > 0;

  function couperTout(): void {
    const arrets: (() => void)[] = [
      () => ecriture?.annuler(),
      () => annulerCarlingue?.(),
      () => fond?.stop(),
      () => {
        void bus?.ctx.close().catch(rien);
      },
    ];
    for (const arreter of arrets) {
      try {
        arreter();
      } catch {
        // Déjà en panne : on se tait.
      }
    }
    ecriture = null;
    annulerCarlingue = null;
    fond = null;
    enAttente = [];
  }

  function sur(quoi: () => void): void {
    if (enPanne) return;
    try {
      quoi();
    } catch {
      enPanne = true;
      couperTout();
    }
  }

  function monter(ctx: AudioContext): Bus {
    const general = ctx.createGain();
    general.connect(ctx.destination);
    const effets = ctx.createGain();
    effets.connect(general);
    const grain = ctx.createGain();
    const ambiance = ctx.createGain();
    ambiance.connect(general);
    const saturation = ctx.createWaveShaper();
    saturation.curve = courbeSaturation(GRAIN.saturation);
    saturation.oversample = '2x';
    const bande = filtre(ctx, 'lowpass', GRAIN.passeBas, GRAIN.q);
    grain.connect(saturation);
    saturation.connect(bande);
    bande.connect(effets);
    const coque = ctx.createConvolver();
    coque.buffer = reponseCoque(ctx, deps.hasard);
    const retour = ctx.createGain();
    retour.gain.value = COQUE.retour;
    coque.connect(retour);
    retour.connect(ambiance);
    return { ctx, general, effets, grain, ambiance, coque, bruit: bruitBlanc(ctx, FOND.duree, deps.hasard) };
  }

  function appliquerNiveaux(b: Bus, fondu: boolean): void {
    const reglages: [GainNode, number][] = [
      [b.general, niveaux.general],
      [b.effets, niveaux.effets],
      [b.ambiance, niveaux.ambiance],
    ];
    for (const [noeud, niveau] of reglages) {
      if (fondu) noeud.gain.setTargetAtTime(gainDe(niveau), b.ctx.currentTime, FONDU_REGLAGE);
      else noeud.gain.value = gainDe(niveau);
    }
  }

  function jouerElement(b: Bus, element: ElementSon, depart: number, vers: AudioNode, sources: AudioScheduledSourceNode[] = []): void {
    const { ctx } = b;
    const t = depart + element.t;
    const gain = enveloppe(ctx, t, element.duree, element.vol, monteeDe(element), chuteDe(element));
    const fin = t + element.duree + 0.02;
    if (element.sorte === 'ton') {
      const oscillateur = suivre(ctx.createOscillator());
      oscillateur.type = element.onde ?? 'square';
      oscillateur.frequency.setValueAtTime(element.f, t);
      if (element.fin !== undefined) oscillateur.frequency.exponentialRampToValueAtTime(element.fin, t + element.duree);
      if (element.passeBas === undefined) oscillateur.connect(gain);
      else {
        const passeBas = filtre(ctx, 'lowpass', element.passeBas);
        oscillateur.connect(passeBas);
        passeBas.connect(gain);
      }
      if (element.trem === undefined) gain.connect(vers);
      else {
        // Bourdonnement : amplitude modulée en carré entre 0 et 1.
        const lfo = suivre(ctx.createOscillator());
        lfo.type = 'square';
        lfo.frequency.value = element.trem;
        const profondeur = ctx.createGain();
        profondeur.gain.value = 0.5;
        const porte = ctx.createGain();
        porte.gain.value = 0.5;
        lfo.connect(profondeur);
        profondeur.connect(porte.gain);
        gain.connect(porte);
        porte.connect(vers);
        lfo.start(t);
        lfo.stop(fin);
        sources.push(lfo);
      }
      oscillateur.start(t);
      oscillateur.stop(fin);
      sources.push(oscillateur);
      return;
    }
    const lecteur = suivre(ctx.createBufferSource());
    lecteur.buffer = b.bruit;
    lecteur.loop = true;
    const passe = filtre(ctx, element.filtre ?? 'bandpass', element.f, element.q ?? 1);
    lecteur.connect(passe);
    passe.connect(gain);
    gain.connect(vers);
    lecteur.start(t, deps.hasard() * (FOND.duree - 1));
    lecteur.stop(fin);
    sources.push(lecteur);
  }

  function jouerRecette(b: Bus, recette: Recette, depart: number, sources?: AudioScheduledSourceNode[]): void {
    for (const element of recette) jouerElement(b, element, depart, b.grain, sources);
  }

  /** Les signaux en attente partent l'un après l'autre (15 §2.4). */
  function liberer(): void {
    const liste = ordonnerSignaux(enAttente);
    enAttente = [];
    const b = bus;
    if (b === null || !audible('effets')) return;
    let t = b.ctx.currentTime + DEPART;
    for (const signal of liste) {
      const recette = RECETTES_SIGNAUX[signal];
      jouerRecette(b, recette, t);
      t += dureeRecette(recette) + ESPACE_SIGNAUX;
    }
  }

  /** Arrête le crépitement en cours ; `true` s'il y en avait un. */
  function arreterEcriture(): boolean {
    if (ecriture === null) return false;
    const { sources, annuler } = ecriture;
    ecriture = null;
    annuler();
    for (const source of sources) source.stop();
    return true;
  }

  function programmerCarlingue(): void {
    annulerCarlingue?.();
    annulerCarlingue = deps.minuterie.attendre(intervalle(deps.hasard) * 1000, () => {
      annulerCarlingue = null;
      sur(() => {
        const b = bus;
        if (b === null || fond === null || !audible('ambiance')) return;
        jouerCarlingue(b, tirerCarlingue(deps.hasard));
        programmerCarlingue();
      });
    });
  }

  function demarrerAmbiance(b: Bus): void {
    const lecteur = b.ctx.createBufferSource();
    lecteur.buffer = b.bruit;
    lecteur.loop = true;
    let dernier: AudioNode = lecteur;
    for (const frequence of FOND.filtres) {
      const passeBas = filtre(b.ctx, 'lowpass', frequence, FOND.q);
      dernier.connect(passeBas);
      dernier = passeBas;
    }
    const gain = b.ctx.createGain();
    const t = b.ctx.currentTime;
    gain.gain.setValueAtTime(SILENCE_GAIN, t);
    gain.gain.exponentialRampToValueAtTime(FOND.gain, t + FOND.fondu);
    dernier.connect(gain);
    gain.connect(b.ambiance);
    lecteur.start(t);
    fond = lecteur;
    programmerCarlingue();
  }

  function arreterAmbiance(): void {
    annulerCarlingue?.();
    annulerCarlingue = null;
    if (fond === null) return;
    const lecteur = fond;
    fond = null;
    lecteur.stop();
  }

  function jouerCarlingue(b: Bus, son: Carlingue): void {
    const { ctx } = b;
    const t = ctx.currentTime + DEPART_CARLINGUE;
    const pan = ctx.createStereoPanner();
    pan.pan.value = son.pan;
    const direct = ctx.createGain();
    direct.gain.value = son.direct;
    pan.connect(direct);
    direct.connect(b.ambiance);
    pan.connect(b.coque);
    if (son.genre === 'gong') {
      const entree = ctx.createGain();
      const passeBas = filtre(ctx, 'lowpass', son.passeBas);
      entree.connect(passeBas);
      passeBas.connect(pan);
      for (const partiel of son.partiels) {
        for (const ecart of [-son.desaccord, son.desaccord]) {
          const oscillateur = suivre(ctx.createOscillator());
          oscillateur.type = 'sine';
          oscillateur.frequency.value = son.base * partiel.rapport + ecart * partiel.rapport;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(SILENCE_GAIN, t);
          gain.gain.exponentialRampToValueAtTime(partiel.niveau * son.niveau, t + son.montee);
          gain.gain.exponentialRampToValueAtTime(SILENCE_GAIN, t + partiel.duree);
          oscillateur.connect(gain);
          gain.connect(entree);
          oscillateur.start(t);
          oscillateur.stop(t + partiel.duree + 0.05);
        }
      }
      jouerElement(b, son.choc, t, entree);
      return;
    }
    const lecteur = suivre(ctx.createBufferSource());
    lecteur.buffer = tamponFrottement(ctx, son, deps.hasard);
    const somme = ctx.createGain();
    for (const frequence of son.resonateurs) {
      const resonateur = filtre(ctx, 'bandpass', frequence, son.q);
      lecteur.connect(resonateur);
      resonateur.connect(somme);
    }
    const passeBas = filtre(ctx, 'lowpass', son.passeBas);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(SILENCE_GAIN, t);
    gain.gain.exponentialRampToValueAtTime(son.vol, t + son.duree * 0.25);
    gain.gain.setValueAtTime(son.vol, t + son.duree * 0.6);
    gain.gain.exponentialRampToValueAtTime(SILENCE_GAIN, t + son.duree);
    somme.connect(passeBas);
    passeBas.connect(gain);
    gain.connect(pan);
    lecteur.start(t);
    if (son.coup === undefined) return;
    const coup = suivre(ctx.createOscillator());
    coup.type = 'sine';
    coup.frequency.setValueAtTime(son.coup.de, t);
    coup.frequency.exponentialRampToValueAtTime(son.coup.a, t + son.coup.glisse);
    const gainCoup = ctx.createGain();
    gainCoup.gain.setValueAtTime(SILENCE_GAIN, t);
    gainCoup.gain.exponentialRampToValueAtTime(son.coup.vol, t + 0.03);
    gainCoup.gain.exponentialRampToValueAtTime(SILENCE_GAIN, t + son.coup.duree);
    coup.connect(gainCoup);
    gainCoup.connect(b.coque);
    gainCoup.connect(b.ambiance);
    coup.start(t);
    coup.stop(t + son.coup.duree + 0.1);
  }

  return {
    debloquer() {
      sur(() => {
        if (bus === null) {
          const ctx = deps.creerContexte();
          if (ctx === null) {
            enPanne = true;
            return;
          }
          bus = monter(ctx);
          appliquerNiveaux(bus, false);
        }
        if (!visible) return;
        if (bus.ctx.state !== 'running') void bus.ctx.resume().catch(rien);
        if (fond === null && audible('ambiance')) demarrerAmbiance(bus);
      });
    },
    geste(geste) {
      sur(() => {
        if (bus === null || !audible('effets')) return;
        jouerRecette(bus, RECETTES_GESTES[geste], bus.ctx.currentTime + DEPART);
      });
    },
    nouveauTexte(ecrit, signaux) {
      sur(() => {
        // Un texte arrivé pendant l'écriture du précédent : les signaux de celui-ci partent d'abord.
        if (arreterEcriture()) liberer();
        enAttente = signaux;
        if (bus === null || !ecrit || deps.mouvementReduit() || !audible('effets')) {
          liberer();
          return;
        }
        const sources: AudioScheduledSourceNode[] = [];
        jouerRecette(bus, crepitement(DUREE_ECRITURE_MS / 1000, deps.hasard), bus.ctx.currentTime + DEPART, sources);
        const annuler = deps.minuterie.attendre(DUREE_ECRITURE_MS, () =>
          sur(() => {
            ecriture = null;
            liberer();
          }),
        );
        ecriture = { sources, annuler };
      });
    },
    taire() {
      sur(() => {
        if (arreterEcriture()) liberer();
      });
    },
    regler(nouveaux) {
      niveaux = nouveaux;
      sur(() => {
        if (bus === null) return;
        appliquerNiveaux(bus, true);
        if (!audible('ambiance')) arreterAmbiance();
        else if (fond === null) demarrerAmbiance(bus);
      });
    },
    cacher() {
      visible = false;
      sur(() => {
        arreterEcriture();
        enAttente = [];
        arreterVivantes();
        annulerCarlingue?.();
        annulerCarlingue = null;
        if (bus !== null) void bus.ctx.suspend().catch(rien);
      });
    },
    montrer() {
      visible = true;
      sur(() => {
        if (bus === null) return;
        void bus.ctx.resume().catch(rien);
        if (!audible('ambiance')) return;
        if (fond === null) demarrerAmbiance(bus);
        else if (annulerCarlingue === null) programmerCarlingue();
      });
    },
  };
}
