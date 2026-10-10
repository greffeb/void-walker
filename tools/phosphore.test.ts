import { existsSync, readFileSync } from 'node:fs';

// Direction « Phosphore » de l'appli (docs/12-interface-ecrans.md §2, §7) mesurée sur la feuille de style elle-même.

const APPLI = new URL('../app/', import.meta.url);
const css = readFileSync(new URL('styles.css', APPLI), 'utf8');

function jeton(nom: string): string {
  const trouve = new RegExp(`--${nom}:\\s*(#[0-9a-f]{6});`, 'i').exec(css)?.[1];
  if (trouve === undefined) throw new Error(`Jeton --${nom} absent de styles.css.`);
  return trouve;
}

function rgb(couleur: string): [number, number, number] {
  const valeurs = couleur.startsWith('#')
    ? [1, 3, 5].map((debut) => parseInt(couleur.slice(debut, debut + 2), 16))
    : (couleur.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
  return [valeurs[0] ?? 0, valeurs[1] ?? 0, valeurs[2] ?? 0];
}

/** Luminance relative WCAG 2.x. */
function luminance(couleur: string): number {
  const [r, g, b] = rgb(couleur).map((canal) => {
    const c = canal / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Teinte en degrés, ou `null` pour un noir ou un gris. */
function teinte(couleur: string): number | null {
  const [r, g, b] = rgb(couleur);
  const max = Math.max(r, g, b);
  const ecart = max - Math.min(r, g, b);
  if (ecart === 0) return null;
  const brute = max === r ? ((g - b) / ecart) % 6 : max === g ? (b - r) / ecart + 2 : (r - g) / ecart + 4;
  return (brute * 60 + 360) % 360;
}

describe('direction « Phosphore » (12 §2)', () => {
  it.each([
    ['texte', 'fond', 4.5],
    ['accent', 'fond', 4.5],
    ['texte-secondaire', 'fond', 4.5],
    ['signal', 'fond', 4.5],
    ['fond', 'texte', 4.5],
    ['fond', 'accent', 4.5],
    ['texte', 'surface', 4.5],
    ['texte-secondaire', 'surface', 4.5],
    ['bordure', 'fond', 3],
    ['bordure', 'surface', 3],
  ])('contraste de %s sur %s : au moins %s:1 (12 §7)', (avant, arriere, seuil) => {
    expect(contraste(jeton(avant), jeton(arriere))).toBeGreaterThanOrEqual(seuil);
  });

  it('valeurs de 12 §2.1 retrouvées : 12,2 / 11,1 / 6,1 / 13,9 / 3,3', () => {
    const mesures = ['texte', 'accent', 'texte-secondaire', 'signal', 'bordure'].map((nom) => contraste(jeton(nom), jeton('fond')).toFixed(1));
    expect(mesures).toEqual(['12.2', '11.1', '6.1', '13.9', '3.3']);
  });

  it('toutes les couleurs de la feuille restent dans la gamme ambre : ni rouge ni vert', () => {
    const couleurs = [...css.matchAll(/#[0-9a-f]{6}\b|rgba?\([^)]*\)/gi)].map((trouve) => trouve[0]);
    expect(couleurs.length).toBeGreaterThan(10);
    for (const couleur of couleurs) {
      const angle = teinte(couleur);
      if (angle === null) continue;
      expect(angle, couleur).toBeGreaterThanOrEqual(20);
      expect(angle, couleur).toBeLessThanOrEqual(55);
    }
  });

  it('angles droits partout', () => {
    for (const [, valeur] of css.matchAll(/border-radius:\s*([^;]+);/g)) expect(valeur).toBe('0');
  });

  it('police IBM Plex Mono 400, 600 et 400 italique embarquée dans l’appli, licence OFL jointe', () => {
    const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, corps = '']) => ({
      fichier: /url\('\/polices\/([^']+)'\)/.exec(corps)?.[1] ?? '',
      forme: `${/font-weight:\s*(\d+)/.exec(corps)?.[1]} ${/font-style:\s*(\w+)/.exec(corps)?.[1]}`,
    }));
    expect(faces).toEqual([
      { fichier: 'IBMPlexMono-Regular.woff2', forme: '400 normal' },
      { fichier: 'IBMPlexMono-SemiBold.woff2', forme: '600 normal' },
      { fichier: 'IBMPlexMono-Italic.woff2', forme: '400 italic' },
    ]);
    for (const { fichier } of faces) expect(existsSync(new URL(`public/polices/${fichier}`, APPLI)), fichier).toBe(true);
    expect(readFileSync(new URL('public/polices/OFL.txt', APPLI), 'utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1');
  });

  it('lignes de balayage : couche qui ne capte aucun toucher', () => {
    const regle = /\.balayage\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(regle).toContain('pointer-events: none');
    expect(regle).toContain('repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.22) 0 1px, transparent 1px 3px)');
  });

  it('document en français', () => {
    expect(readFileSync(new URL('index.html', APPLI), 'utf8')).toContain('<html lang="fr">');
  });
});
