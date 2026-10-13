import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GESTES } from '../app/son/recettes';

// Un toucher, un son (D-217) : vérifié sur le code source de app/, car un écran rendu côté serveur ne montre qu'un état à la fois.
// Dans tools/ : seuls les outils lisent des fichiers (AP-01).

const APP = fileURLToPath(new URL('../app/', import.meta.url));

function sources(dossier: string): { chemin: string; texte: string }[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) return sources(chemin);
    return entree.name.endsWith('.tsx') && !entree.name.endsWith('.test.tsx') ? [{ chemin, texte: readFileSync(chemin, 'utf8') }] : [];
  });
}

const ECRANS = sources(APP);

describe('un son sur chaque bouton (15 §2.1, D-217)', () => {
  it('chaque <button> de app/ porte data-son', () => {
    const sansSon = ECRANS.flatMap(({ chemin, texte }) =>
      texte
        .split('<button')
        .slice(1)
        .map((morceau) => morceau.slice(0, morceau.indexOf('</button>')))
        .filter((bouton) => !bouton.includes('data-son='))
        .map((bouton) => `${chemin} : <button${bouton.slice(0, 80).replace(/\s+/g, ' ')}…`),
    );
    expect(sansSon).toEqual([]);
  });

  it('les segments des options, le voile du jeu et celui de la carte portent leur son', () => {
    const tout = ECRANS.map(({ texte }) => texte).join('\n');
    expect(tout).toMatch(/<label[^>]*className=\{[^}]*segment[^}]*\}[^>]*data-son="clic"/);
    expect(tout).toMatch(/data-testid="voile"\s+data-son="fermer"/);
    expect(tout).toMatch(/data-testid="voile-carte"\s+data-son="fermer"/);
  });

  it('chaque geste du catalogue sert au moins une fois', () => {
    const tout = ECRANS.map(({ texte }) => texte).join('\n');
    for (const geste of GESTES) expect(tout, geste).toMatch(new RegExp(`['"]${geste}['"]`));
  });

  it('glisser le plan de la carte puis relâcher sur une pièce : ni fiche ni son de bulle', () => {
    const plan = ECRANS.find(({ chemin }) => chemin.endsWith('PlanCarte.tsx'))?.texte ?? '';
    expect(plan).toMatch(/glisse\.current = false;\s*(?:\/\/[^\n]*\s*)?evenement\.preventDefault\(\);\s*return;/);
  });
});
