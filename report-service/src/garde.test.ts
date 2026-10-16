import { cleAppareil, confirmer, ETAT_VIDE, LIMITES, liberer, reserver, type EtatGarde } from './garde';

const T0 = 1_800_000_000_000;
const MINUTE = 60_000;

function enchainer(etat: EtatGarde, appareil: string, empreintes: readonly string[], debut: number, pas: number) {
  let courant = etat;
  return empreintes.map((empreinte, index) => {
    const { etat: suivant, decision } = reserver(courant, appareil, empreinte, debut + index * pas);
    courant = suivant;
    return decision.type;
  });
}

describe('garde anti-abus (RP-03)', () => {
  it('#182 : compte une adresse IPv6 par bloc /64, quelle que soit son écriture, et une IPv4 telle quelle', () => {
    const bloc = '2001:db8:0:0::/64';
    expect(cleAppareil('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe(bloc);
    expect(cleAppareil('2001:db8::1')).toBe(bloc);
    expect(cleAppareil('2001:DB8:0:0:ABCD::1')).toBe(bloc);
    expect(cleAppareil('2001:db8:0:0:ffff:ffff:ffff:ffff')).toBe(bloc);
    expect(cleAppareil('2001:db8:0:1::1')).toBe('2001:db8:0:1::/64');
    expect(cleAppareil('::1')).toBe('0:0:0:0::/64');
    expect(cleAppareil('203.0.113.7')).toBe('203.0.113.7');
    expect(cleAppareil('::ffff:203.0.113.7')).toBe('203.0.113.7');
    expect(cleAppareil('inconnue')).toBe('inconnue');
  });

  it('accepte un premier rapport puis le reconnaît comme doublon, sans limite de délai', () => {
    const premier = reserver(ETAT_VIDE, 'a', 'r1', T0);
    expect(premier.decision).toEqual({ type: 'accepte' });
    expect(reserver(premier.etat, 'a', 'r1', T0 + 1).decision).toEqual({ type: 'doublon', adresse: null });
    const publie = confirmer(premier.etat, 'r1', 'https://github.com/x/y/issues/1', T0 + 500);
    expect(reserver(publie, 'b', 'r1', T0 + 2 * MINUTE).decision).toEqual({ type: 'doublon', adresse: 'https://github.com/x/y/issues/1' });
  });

  it('impose un délai entre deux rapports d’un même appareil, pas entre deux appareils', () => {
    const { etat } = reserver(ETAT_VIDE, 'a', 'r1', T0);
    const trop = reserver(etat, 'a', 'r2', T0 + 5_000).decision;
    expect(trop.type).toBe('trop');
    expect(trop.type === 'trop' && trop.apresMs).toBe(LIMITES.delaiMs - 5_000);
    expect(reserver(etat, 'b', 'r2', T0 + 5_000).decision.type).toBe('accepte');
    expect(reserver(etat, 'a', 'r2', T0 + LIMITES.delaiMs).decision.type).toBe('accepte');
  });

  it('borne le nombre par heure et par jour pour un appareil', () => {
    const empreintes = Array.from({ length: LIMITES.parHeure + 1 }, (_, i) => `h${i}`);
    expect(enchainer(ETAT_VIDE, 'a', empreintes, T0, MINUTE)).toEqual([...Array<string>(LIMITES.parHeure).fill('accepte'), 'trop']);
    const jour = Array.from({ length: LIMITES.parJour + 1 }, (_, i) => `j${i}`);
    expect(enchainer(ETAT_VIDE, 'a', jour, T0, 11 * MINUTE).at(-1)).toBe('trop');
    expect(enchainer(ETAT_VIDE, 'a', jour, T0, 11 * MINUTE).filter((type) => type === 'accepte')).toHaveLength(LIMITES.parJour);
  });

  it('plafonne tout le service par jour', () => {
    let etat = ETAT_VIDE;
    for (let i = 0; i < LIMITES.globalParJour; i += 1) etat = reserver(etat, `appareil-${i}`, `g${i}`, T0 + i).etat;
    expect(reserver(etat, 'nouveau', 'dernier', T0 + 10 * MINUTE).decision.type).toBe('trop');
    expect(reserver(etat, 'nouveau', 'dernier', T0 + 25 * 60 * MINUTE).decision.type).toBe('accepte');
  });

  it('libère un rapport que GitHub n’a pas publié : renvoyable, sans compter dans les limites', () => {
    const { etat } = reserver(ETAT_VIDE, 'a', 'r1', T0);
    const libre = liberer(etat, 'a', 'r1', T0);
    expect(libre.global).toEqual([]);
    expect(reserver(libre, 'a', 'r1', T0 + 1).decision.type).toBe('accepte');
  });

  it('oublie une réservation restée sans réponse et les doublons de plus d’un jour', () => {
    const { etat } = reserver(ETAT_VIDE, 'a', 'r1', T0);
    expect(reserver(etat, 'b', 'r1', T0 + 2 * MINUTE).decision.type).toBe('accepte');
    const publie = confirmer(etat, 'r1', 'u', T0);
    expect(reserver(publie, 'b', 'r1', T0 + LIMITES.doublonMs + 1).decision.type).toBe('accepte');
    const vieux = reserver(publie, 'b', 'autre', T0 + 2 * LIMITES.doublonMs).etat;
    expect(Object.keys(vieux.rapports)).toEqual(['autre']);
    expect(Object.keys(vieux.appareils)).toEqual(['b']);
  });
});
