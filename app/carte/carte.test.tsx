import { renderToStaticMarkup } from 'react-dom/server';
import { nouvellePartie, observer, type CartePublique, type PieceCarte, type RectPlan, type RefPiece } from '../../engine';
import { ficheDe, MONDES, rendreListeCarte, type EntreeMonde } from '../../content';
import { EcranCarte } from './EcranCarte';
import { FicheCarte } from './FicheCarte';
import { ListeCarte } from './ListeCarte';
import { PlanCarte } from './PlanCarte';
import type { Vue } from './vue';

const { monde: AR01, textes } = MONDES['ar-01'] as EntreeMonde;
const rien = (): void => undefined;

const ref = (nom: string): RefPiece => ({ sorte: 'piece', id: `e-${nom}`, nom });

function vue(nom: string, statut: PieceCarte['statut'], rect: RectPlan, autres: Partial<PieceCarte> = {}): PieceCarte {
  return { piece: ref(nom), statut, rect, regard: statut === 'connue' ? null : 'instant', feu: null, vide: false, creature: null, objets: [], distance: 1, ...autres };
}

// Une carte écrite à la main avec les noms d'AR-01 : chaque élément du dessin y figure une fois.
const CARTE: CartePublique = {
  pieces: [
    vue('salon', 'visitee', { x: 0, y: 0, largeur: 4, hauteur: 3 }, { regard: 'moment', vide: true, creature: 'moment' }),
    vue('atelier', 'actuelle', { x: 4, y: 0, largeur: 4, hauteur: 3 }, { feu: 'instant', distance: 0 }),
    vue('galerie', 'connue', { x: 0, y: 3, largeur: 4, hauteur: 3 }),
    vue('embarquement', 'visitee', { x: 4, y: 3, largeur: 4, hauteur: 3 }, { regard: 'longtemps' }),
  ],
  passages: [
    {
      id: 'e-p1',
      nom: 'porte',
      vuDepuis: [ref('salon'), ref('atelier')],
      entre: [ref('salon'), ref('atelier')],
      ouvert: true,
      dessin: 'porte',
      voyant: 'vide',
      emplacement: { type: 'mur', axe: 'v', ligne: 4, rang: 1 },
    },
    {
      id: 'e-p2',
      nom: 'cloison',
      vuDepuis: [ref('salon')],
      entre: [ref('salon'), ref('galerie')],
      ouvert: false,
      dessin: 'porte',
      voyant: 'air',
      emplacement: { type: 'mur', axe: 'h', ligne: 3, rang: 1 },
    },
    { id: 'e-p3', nom: 'grille', vuDepuis: [ref('atelier')], entre: null, ouvert: false, dessin: 'tirets', voyant: null, emplacement: { type: 'mur', axe: 'h', ligne: 3, rang: 5 } },
  ],
  capsules: [{ objet: { sorte: 'objet', id: 'e-capsule', nom: 'capsule' }, piece: ref('embarquement'), pan: { cote: 'bas', debut: 4, fin: 8 } }],
  aBord: null,
};

/** Texte de la page, sans balises ni attributs. */
function texte(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function plan(carte: CartePublique = CARTE, position: Vue = { zoom: 1, x: 0, y: 0 }): string {
  return renderToStaticMarkup(
    <PlanCarte carte={carte} textes={textes} vue={position} casePx={34} zoomMin={0.5} changerVue={rien} toucher={rien} ouverte={null} />,
  );
}

describe('écran de la carte (14 §2)', () => {
  it('plan : chaque pièce connue est un bouton nommé, avec son statut ; aucun chiffre', () => {
    const html = plan();
    expect(html.match(/<button/g)).toHaveLength(4);
    expect(html).toContain('data-statut="actuelle"');
    expect(html).toContain('aria-label="Atelier maintenance, vous êtes ici, FEU, vu à l’instant"');
    expect(html).toContain('aria-label="Local technique, pas encore visitée"');
    expect(texte(html)).toContain('@ VOUS');
    expect(texte(html)).not.toMatch(/\d/);
  });

  it('états par motif et étiquette : hachures et FEU, points et VIDE ○, losange et CRÉATURE (D-209)', () => {
    const html = plan();
    expect(html.match(/url\(#carte-hachures\)/g)).toHaveLength(1);
    expect(html.match(/url\(#carte-points\)/g)).toHaveLength(1);
    expect(html.match(/class="losange"/g)).toHaveLength(1);
    for (const etiquette of ['FEU', 'VIDE ○', 'CRÉATURE']) expect(texte(html)).toContain(etiquette);
  });

  it('portes : ouverture, trait fin si fermée, tirets, voyants d’air, « ? » ; capsule arrimée dehors (14 §2.6)', () => {
    const html = plan();
    expect(html.match(/class="ouverture"/g)).toHaveLength(3);
    expect(html.match(/class="ouverture-fermee"/g)).toHaveLength(1);
    expect(html.match(/class="ouverture-tirets"/g)).toHaveLength(1);
    expect(html).toContain('class="voyant voyant-vide"');
    expect(html).toContain('class="voyant voyant-air"');
    expect(html).toContain('>?</text>');
    expect(html.match(/class="capsule"/g)).toHaveLength(1);
  });

  it('réduite, la carte garde murs et motifs, et efface les noms qui ne tiennent plus (14 §2.3)', () => {
    const html = plan(CARTE, { zoom: 0.5, x: 0, y: 0 });
    expect(texte(html)).not.toContain('MAINTENANCE');
    expect(html.match(/url\(#carte-hachures\)/g)).toHaveLength(1);
    expect(html.match(/<button/g)).toHaveLength(4);
  });

  it('un peu réduite, la carte garde les noms, écrits plus petits (retour du porteur)', () => {
    const html = plan(CARTE, { zoom: 0.9, x: 0, y: 0 });
    expect(texte(html)).toContain('D’EMBARQUEMENT');
    expect(html).toContain('--texte-carte:0.9');
  });

  it('AR-01 au départ : le salon de transit et ses deux sorties, rien d’autre (K-01)', () => {
    const carte = observer(AR01, nouvellePartie(AR01, { version: 'v', graine: 1 }).etat).carte;
    const html = plan(carte);
    expect(html.match(/<button/g)).toHaveLength(3);
    expect(texte(html)).toContain('SALON DE TRANSIT');
  });

  it('vue LISTE : les mêmes mots que la commande carte de la CLI (K-07)', () => {
    const blocs = rendreListeCarte(textes, CARTE);
    const lu = texte(renderToStaticMarkup(<ListeCarte blocs={blocs} />));
    for (const bloc of blocs) {
      expect(lu).toContain(bloc.titre);
      for (const entree of bloc.entrees) {
        expect(lu).toContain(entree.titre);
        expect(lu).toContain(entree.details.join(' · '));
      }
    }
  });

  it('fiche : le nom, l’état vu, les objets vus ; rien d’autre, aucun « aller ici » (14 §2.7)', () => {
    const atelier = CARTE.pieces[1] as PieceCarte;
    const html = renderToStaticMarkup(<FicheCarte fiche={ficheDe(textes, atelier)} ancre={{} as HTMLElement} fermer={rien} />);
    expect(html).toContain('role="dialog"');
    // En-tête de la bulle partagée : le titre, puis « ✕ » (nommé « Fermer » par un attribut) ; puis le corps.
    expect(texte(html)).toBe('ATELIER MAINTENANCE ✕ @ vous ── ÉTAT VU ── FEU, vu à l’instant ── OBJETS VUS ── aucun objet');
    const galerie = CARTE.pieces[2] as PieceCarte;
    expect(texte(renderToStaticMarkup(<FicheCarte fiche={ficheDe(textes, galerie)} ancre={{} as HTMLElement} fermer={rien} />))).not.toContain('OBJETS VUS');
  });

  it('écran : bulle comme l’inventaire, CARTE // RELEVÉ, LISTE, ✕ pour fermer ; plan nommé pour le lecteur d’écran (D-215)', () => {
    const html = renderToStaticMarkup(<EcranCarte carte={CARTE} textes={textes} fermer={rien} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('class="bulle carte"');
    expect(html).toContain('aria-label="Fermer" data-son="fermer-carte"');
    expect(html).toContain('data-son-fermer="fermer-carte"');
    for (const mot of ['CARTE // RELEVÉ', 'LISTE', '✕']) expect(texte(html)).toContain(mot);
    expect(texte(html)).not.toContain('FERMER LA CARTE');
    expect(html).toContain('aria-label="Plan de la station ; vous êtes dans l’atelier maintenance. La vue liste dit la même chose en texte."');
  });

  it('monde sans plan : la carte s’ouvre en liste, sans bouton PLAN', () => {
    const sansPlan: CartePublique = { ...CARTE, pieces: CARTE.pieces.map((piece) => ({ ...piece, rect: null })), capsules: [] };
    const lu = texte(renderToStaticMarkup(<EcranCarte carte={sansPlan} textes={textes} fermer={rien} />));
    expect(lu).toContain('CARTE // LISTE');
    expect(lu).toContain('── ICI ──');
    expect(lu).not.toMatch(/\bPLAN\b/);
  });
});
