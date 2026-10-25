import { caseDevant, casesDe, chevauchent, cleCase, murCommun, panLibre, piecesDeCoque, PROFONDEUR_COQUE, videsEnfermes, type RectPlan } from './plan';
import { BUDGET_POSE, porteEntre, poserTuiles, prefixer, rechercherPose, type Pose } from './pose';
import { validerMorceau, type DefMorceau } from './station';

// Tuiles des morceaux de test d'engine/station.test.ts, réduites à ce que lit la pose : rectangles, liaisons, coque, attaches.

const DEPART: DefMorceau = {
  id: 'vestibule',
  famille: 'depart',
  pieces: [{ id: 'p-vestibule', nom: 'vestibule', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } }],
  liaisons: [],
  objets: [],
  entree: 'p-vestibule',
  sortie: { piece: 'p-vestibule', porte: { nom: 'porte' } },
  placesCreature: [],
  demande: [],
  fournit: [],
};

const CHEMIN: DefMorceau = {
  id: 'couloir',
  famille: 'chemin',
  pieces: [
    { id: 'p-quartiers', nom: 'quartiers', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-machines', nom: 'machines', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-zone', nom: 'zone', plan: { x: 0, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-froide', nom: 'chambre_froide', plan: { x: 4, y: 3, largeur: 4, hauteur: 3 } },
  ],
  liaisons: [
    { id: 'l-quartiers-machines', nom: 'porte', entre: ['p-quartiers', 'p-machines'], ouverte: false },
    { id: 'l-quartiers-zone', nom: 'porte', entre: ['p-quartiers', 'p-zone'], ouverte: true },
    { id: 'l-zone-froide', nom: 'porte', entre: ['p-zone', 'p-froide'], ouverte: false },
  ],
  objets: [],
  entree: 'p-quartiers',
  sortie: { piece: 'p-machines', porte: { nom: 'porte_grippee' } },
  placesCreature: ['p-froide'],
  demande: [],
  fournit: ['acces'],
};

const FINAL: DefMorceau = {
  id: 'fin',
  famille: 'final',
  pieces: [
    { id: 'p-embarquement', nom: 'embarquement', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [{ id: 'l-embarquement-cabine', nom: 'ecoutille', entre: ['p-embarquement', 'p-cabine'], ouverte: false }],
  objets: [{ id: 'o-capsule', nom: 'capsule', piece: 'p-embarquement', portable: false, capsule: { interieur: 'p-cabine', alimentee: true } }],
  entree: 'p-embarquement',
  placesCreature: ['p-embarquement'],
  demande: [],
  fournit: ['evacuation'],
};

/** Trois pièces en rang, l'entrée à un bout, la sortie à l'autre. */
const RANG: DefMorceau = {
  id: 'rang',
  famille: 'chemin',
  pieces: [
    { id: 'p-a', nom: 'a', plan: { x: 0, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'p-b', nom: 'b', plan: { x: 3, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'p-c', nom: 'c', plan: { x: 6, y: 0, largeur: 3, hauteur: 2 } },
  ],
  liaisons: [
    { id: 'l-a-b', nom: 'porte', entre: ['p-a', 'p-b'], ouverte: true },
    { id: 'l-b-c', nom: 'porte', entre: ['p-b', 'p-c'], ouverte: true },
  ],
  objets: [],
  entree: 'p-a',
  sortie: { piece: 'p-c', porte: { nom: 'porte' } },
  placesCreature: ['p-c'],
  demande: [],
  fournit: ['acces'],
};

/** Vestibule contre la coque : son pan dégagé doit tenir pendant que les tuiles suivantes se posent (GE-07). */
const BAIE: DefMorceau = { ...DEPART, id: 'baie', pieces: [{ id: 'p-vestibule', nom: 'vestibule', coque: true, plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } }] };

/** Départ en U, entaille de 4 × 4 ouverte d'un côté : la barre posée ensuite pourrait la refermer (GE-03). */
const COUR: DefMorceau = {
  id: 'cour',
  famille: 'depart',
  pieces: [
    { id: 'p-gauche', nom: 'gauche', plan: { x: 0, y: 0, largeur: 2, hauteur: 6 } },
    { id: 'p-fond', nom: 'fond', plan: { x: 2, y: 4, largeur: 4, hauteur: 2 } },
    { id: 'p-droite', nom: 'droite', plan: { x: 6, y: 0, largeur: 2, hauteur: 6 } },
  ],
  liaisons: [
    { id: 'l-gauche-fond', nom: 'porte', entre: ['p-gauche', 'p-fond'], ouverte: true },
    { id: 'l-fond-droite', nom: 'porte', entre: ['p-fond', 'p-droite'], ouverte: true },
  ],
  objets: [],
  entree: 'p-gauche',
  sortie: { piece: 'p-droite', porte: { nom: 'porte' } },
  placesCreature: [],
  demande: [],
  fournit: [],
};

const BARRE: DefMorceau = {
  id: 'barre',
  famille: 'chemin',
  pieces: [{ id: 'p-barre', nom: 'barre', plan: { x: 0, y: 0, largeur: 8, hauteur: 2 } }],
  liaisons: [],
  objets: [],
  entree: 'p-barre',
  sortie: { piece: 'p-barre', porte: { nom: 'porte' } },
  placesCreature: ['p-barre'],
  demande: [],
  fournit: ['acces'],
};

/** Couloir 6 × 2 bordé de six pièces 2 × 2 : six portes intérieures, la porte vers le morceau suivant serait la septième. */
const ETOILE: DefMorceau = {
  id: 'etoile',
  famille: 'chemin',
  pieces: [
    { id: 'p-couloir', nom: 'couloir', plan: { x: 0, y: 2, largeur: 6, hauteur: 2 } },
    { id: 'p-1', nom: 'cabine', plan: { x: 0, y: 0, largeur: 2, hauteur: 2 } },
    { id: 'p-2', nom: 'cabine', plan: { x: 2, y: 0, largeur: 2, hauteur: 2 } },
    { id: 'p-3', nom: 'cabine', plan: { x: 4, y: 0, largeur: 2, hauteur: 2 } },
    { id: 'p-4', nom: 'cabine', plan: { x: 0, y: 4, largeur: 2, hauteur: 2 } },
    { id: 'p-5', nom: 'cabine', plan: { x: 2, y: 4, largeur: 2, hauteur: 2 } },
    { id: 'p-6', nom: 'cabine', plan: { x: 4, y: 4, largeur: 2, hauteur: 2 } },
  ],
  liaisons: [
    { id: 'l-1', nom: 'porte', entre: ['p-couloir', 'p-1'], ouverte: true },
    { id: 'l-2', nom: 'porte', entre: ['p-couloir', 'p-2'], ouverte: true },
    { id: 'l-3', nom: 'porte', entre: ['p-couloir', 'p-3'], ouverte: true },
    { id: 'l-4', nom: 'porte', entre: ['p-couloir', 'p-4'], ouverte: true },
    { id: 'l-5', nom: 'porte', entre: ['p-couloir', 'p-5'], ouverte: true },
    { id: 'l-6', nom: 'porte', entre: ['p-couloir', 'p-6'], ouverte: true },
  ],
  objets: [],
  entree: 'p-1',
  sortie: { piece: 'p-couloir', porte: { nom: 'porte' } },
  placesCreature: ['p-6'],
  demande: [],
  fournit: ['acces'],
};

/** Final en anneau autour d'une cour de 2 × 2 : où qu'on le pose, il enferme un vide (GE-03), aucun plan n'existe. */
const ANNEAU: DefMorceau = {
  id: 'anneau',
  famille: 'final',
  pieces: [
    { id: 'p-nord', nom: 'nord', plan: { x: 0, y: 0, largeur: 6, hauteur: 2 } },
    { id: 'p-ouest', nom: 'ouest', plan: { x: 0, y: 2, largeur: 2, hauteur: 2 } },
    { id: 'p-est', nom: 'est', plan: { x: 4, y: 2, largeur: 2, hauteur: 2 } },
    { id: 'p-sud', nom: 'sud', plan: { x: 0, y: 4, largeur: 6, hauteur: 2 } },
  ],
  liaisons: [
    { id: 'l-nord-ouest', nom: 'porte', entre: ['p-nord', 'p-ouest'], ouverte: true },
    { id: 'l-ouest-sud', nom: 'porte', entre: ['p-ouest', 'p-sud'], ouverte: true },
    { id: 'l-sud-est', nom: 'porte', entre: ['p-sud', 'p-est'], ouverte: true },
  ],
  objets: [],
  entree: 'p-nord',
  placesCreature: ['p-sud'],
  demande: [],
  fournit: ['evacuation'],
};

const CHAINES: readonly (readonly DefMorceau[])[] = [
  [DEPART, CHEMIN, FINAL],
  [DEPART, RANG, FINAL],
  [BAIE, CHEMIN, FINAL],
  [BAIE, RANG, CHEMIN, FINAL],
  [COUR, BARRE, FINAL],
];

const GRAINES = Array.from({ length: 200 }, (_, graine) => graine);

/** Tuile posée telle quelle, ou retournée sur un seul axe. */
const REFLETS: readonly ((rect: RectPlan) => RectPlan)[] = [
  (rect) => rect,
  (rect) => ({ ...rect, x: -rect.x - rect.largeur }),
  (rect) => ({ ...rect, y: -rect.y - rect.hauteur }),
];

function nom(chaine: readonly DefMorceau[]): string {
  return chaine.map((morceau) => morceau.id).join(' + ');
}

function posee(chaine: readonly DefMorceau[], graine: number): Pose {
  const pose = poserTuiles(chaine, graine);
  if (pose === null) throw new Error(`Plan attendu : ${nom(chaine)}, graine ${graine}.`);
  return pose;
}

function rect(pose: Pose, morceau: string, piece: string): RectPlan {
  const trouve = pose.rects.get(prefixer(morceau, piece));
  if (trouve === undefined) throw new Error(`Pièce non posée : ${prefixer(morceau, piece)}.`);
  return trouve;
}

describe('pose des tuiles', () => {
  it('même graine, même plan (GE-06) ; sur 50 graines, des plans différents', () => {
    for (const chaine of CHAINES) {
      expect(posee(chaine, 7)).toStrictEqual(posee(chaine, 7));
      const plans = new Set(
        GRAINES.slice(0, 50).map((graine) => {
          const pose = posee(chaine, graine);
          return JSON.stringify([[...pose.rects], [...pose.portes]]);
        }),
      );
      expect(plans.size).toBeGreaterThanOrEqual(2);
    }
  });

  it.each(CHAINES.map((chaine) => [nom(chaine), chaine] as const))(
    '%s, 200 graines : portes sur un mur d’au moins deux cases, ni chevauchement ni vide enfermé, coques dégagées',
    (_nom, chaine) => {
      const decalages = new Set<number>();
      for (const graine of GRAINES) {
        const pose = posee(chaine, graine);
        const dessinees = chaine.flatMap((morceau) => morceau.pieces.filter((piece) => piece.plan !== undefined).map((piece) => prefixer(morceau.id, piece.id)));
        expect([...pose.rects.keys()].sort()).toEqual(dessinees.sort());
        const portes = chaine.slice(1).map((apres, rang) => porteEntre(chaine[rang]!.id, apres.id));
        expect([...pose.portes.keys()].sort()).toEqual(portes.sort());
        for (let rang = 1; rang < chaine.length; rang++) {
          const avant = chaine[rang - 1]!;
          const apres = chaine[rang]!;
          const mur = murCommun(rect(pose, avant.id, avant.sortie!.piece), rect(pose, apres.id, apres.entree));
          expect(mur).not.toBeNull();
          if (mur === null) return;
          expect(mur.fin - mur.debut).toBeGreaterThanOrEqual(2);
          const porte = pose.portes.get(porteEntre(avant.id, apres.id)) ?? Number.NaN;
          expect(Number.isInteger(porte)).toBe(true);
          expect(porte).toBeGreaterThanOrEqual(mur.debut);
          expect(porte).toBeLessThan(mur.fin);
          decalages.add(porte - mur.debut);
        }
        const rects = [...pose.rects.values()];
        rects.forEach((a, index) => {
          for (const b of rects.slice(index + 1)) expect(chevauchent(a, b)).toBe(false);
        });
        expect(videsEnfermes(rects)).toEqual([]);
        const occupees = casesDe(rects);
        for (const morceau of chaine) for (const piece of piecesDeCoque(morceau)) expect(panLibre(rect(pose, morceau.id, piece), occupees)).not.toBeNull();
        // Coque réservée dès la pose (GE-07) : le pan dégagé quand sa tuile se pose le reste jusqu'au bout.
        chaine.forEach((morceau, rang) => {
          const jusquIci = casesDe(chaine.slice(0, rang + 1).flatMap((tuile) => tuile.pieces.flatMap((piece) => (piece.plan === undefined ? [] : [rect(pose, tuile.id, piece.id)]))));
          for (const piece of piecesDeCoque(morceau)) {
            const coque = rect(pose, morceau.id, piece);
            const pan = panLibre(coque, jusquIci);
            expect(pan).not.toBeNull();
            if (pan === null) return;
            for (let i = pan.debut; i < pan.fin; i++) {
              for (let k = 1; k <= PROFONDEUR_COQUE; k++) {
                const devant = caseDevant(coque, pan.cote, i, k);
                expect(occupees.has(cleCase(devant.x, devant.y)), `${nom(chaine)}, graine ${graine}, devant ${piece}`).toBe(false);
              }
            }
          }
        });
      }
      // La porte se place n'importe où sur le mur commun (GE-01), pas toujours à la même case.
      expect(decalages.size).toBeGreaterThan(1);
    },
  );

  it('chaque tuile est posée telle quelle ou en miroir sur un seul axe, jamais tournée (GE-02)', () => {
    for (const chaine of CHAINES) {
      for (const graine of GRAINES) {
        const pose = posee(chaine, graine);
        for (const morceau of chaine) {
          const pieces = morceau.pieces.flatMap((piece) => (piece.plan === undefined ? [] : [{ local: piece.plan, pose: rect(pose, morceau.id, piece.id) }]));
          for (const piece of pieces) expect([piece.pose.largeur, piece.pose.hauteur]).toEqual([piece.local.largeur, piece.local.hauteur]);
          const translatee = (reflet: (rect: RectPlan) => RectPlan): boolean => {
            const [premiere] = pieces;
            if (premiere === undefined) return true;
            const dx = premiere.pose.x - reflet(premiere.local).x;
            const dy = premiere.pose.y - reflet(premiere.local).y;
            return pieces.every((piece) => piece.pose.x === reflet(piece.local).x + dx && piece.pose.y === reflet(piece.local).y + dy);
          };
          expect(REFLETS.some(translatee), `${nom(chaine)}, graine ${graine}, ${morceau.id}`).toBe(true);
        }
      }
    }
  });

  it('aucun plan quand la porte vers le morceau suivant donnerait une septième porte à une pièce (PL-06)', () => {
    expect(validerMorceau(ETOILE)).toEqual([]);
    for (const graine of GRAINES.slice(0, 10)) expect(poserTuiles([DEPART, ETOILE, FINAL], graine)).toBeNull();
    // Témoin : avec une porte intérieure de moins, la même chaîne se pose.
    const allegee: DefMorceau = { ...ETOILE, liaisons: ETOILE.liaisons.slice(0, 5) };
    for (const graine of GRAINES.slice(0, 10)) expect(poserTuiles([DEPART, allegee, FINAL], graine)).not.toBeNull();
  });
});

describe('recherche bornée (14 §5.6)', () => {
  it('une dernière tuile qui enferme toujours un vide : aucun plan, sans évaluer plus de BUDGET_POSE candidats', () => {
    expect(validerMorceau(ANNEAU)).toEqual([]);
    expect(videsEnfermes(ANNEAU.pieces.flatMap((piece) => (piece.plan === undefined ? [] : [piece.plan])))).not.toEqual([]);
    for (const chaine of [
      [DEPART, CHEMIN, ANNEAU],
      [DEPART, CHEMIN, RANG, ANNEAU],
    ]) {
      for (const graine of GRAINES.slice(0, 3)) {
        expect(poserTuiles(chaine, graine), `${nom(chaine)}, graine ${graine}`).toBeNull();
        const { pose, evalues } = rechercherPose(chaine, graine);
        expect(pose).toBeNull();
        expect(evalues, `${nom(chaine)}, graine ${graine}`).toBeLessThanOrEqual(BUDGET_POSE);
      }
    }
  });

  it('la recherche s’arrête au budget : très bas, aucun plan, même pour une chaîne qui se pose avec le budget par défaut', () => {
    for (const graine of GRAINES.slice(0, 10)) {
      expect(rechercherPose([DEPART, CHEMIN, ANNEAU], graine, 10)).toStrictEqual({ pose: null, evalues: 10 });
      const chaine = [DEPART, CHEMIN, FINAL];
      const { pose, evalues } = rechercherPose(chaine, graine);
      expect(pose).not.toBeNull();
      expect(pose).toStrictEqual(poserTuiles(chaine, graine));
      expect(rechercherPose(chaine, graine, evalues)).toStrictEqual({ pose, evalues });
      expect(rechercherPose(chaine, graine, evalues - 1).pose).toBeNull();
      expect(rechercherPose(chaine, graine, 1).pose).toBeNull();
    }
  });
});

describe('tuiles jamais retournées sur un axe (bâbord, tribord ; nord, sud)', () => {
  it.each(['x', 'y'] as const)('sansMiroir %s : sur 200 graines, l’ordre des pièces sur cet axe reste celui du dessin', (axe) => {
    for (const morceau of [DEPART, CHEMIN, FINAL]) {
      const fige = { ...morceau, sansMiroir: [axe] };
      const chaine = [DEPART, CHEMIN, FINAL].map((m) => (m === morceau ? fige : m));
      const [a, b] = fige.pieces
        .flatMap((p) => fige.pieces.map((q) => [p, q] as const))
        .find(([p, q]) => p.plan !== undefined && q.plan !== undefined && p.plan[axe] < q.plan[axe]) ?? [];
      if (a === undefined || b === undefined) continue;
      for (const graine of GRAINES) {
        const pose = poserTuiles(chaine, graine);
        if (pose === null) continue;
        expect(rect(pose, fige.id, a.id)[axe], `${fige.id}, graine ${graine}`).toBeLessThan(rect(pose, fige.id, b.id)[axe]);
      }
    }
  });
});
