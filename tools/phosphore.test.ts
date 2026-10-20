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
    ['cyan-texte', 'cyan-surface', 4.5],
    ['cyan', 'cyan-surface', 4.5],
    ['cyan-secondaire', 'cyan-surface', 4.5],
    ['cyan-surface', 'cyan', 4.5],
    ['cyan', 'fond', 3],
    ['blanc-texte', 'blanc-surface', 4.5],
    ['blanc', 'blanc-surface', 4.5],
    ['blanc-secondaire', 'blanc-surface', 4.5],
    ['blanc-surface', 'blanc', 4.5],
    ['blanc', 'fond', 3],
    ['alerte', 'fond', 4.5],
  ])('contraste de %s sur %s : au moins %s:1 (12 §7)', (avant, arriere, seuil) => {
    expect(contraste(jeton(avant), jeton(arriere))).toBeGreaterThanOrEqual(seuil);
  });

  it('valeurs de 12 §2.1 retrouvées : 12,2 / 11,1 / 6,1 / 13,9 / 3,3', () => {
    const mesures = ['texte', 'accent', 'texte-secondaire', 'signal', 'bordure'].map((nom) => contraste(jeton(nom), jeton('fond')).toFixed(1));
    expect(mesures).toEqual(['12.2', '11.1', '6.1', '13.9', '3.3']);
  });

  it('couleurs : ambre partout, cyan pour l’inventaire (D-176), blanc froid pour IA Station (D-192), vert pour la carte (D-211) ; rouge seulement pour un danger apparu (D-233)', () => {
    const couleurs = [...css.matchAll(/#[0-9a-f]{6}\b|rgba?\([^)]*\)/gi)].map((trouve) => trouve[0]);
    expect(couleurs.length).toBeGreaterThan(10);
    /** Jeton qui déclare la couleur : une couleur hors de l'ambre n'existe que dans son jeton. */
    const jetonDe = (couleur: string): string => /--([a-z-]+):\s*$/.exec(css.slice(css.indexOf(couleur) - 30, css.indexOf(couleur)))?.[1] ?? '';
    for (const couleur of couleurs) {
      const angle = teinte(couleur);
      if (angle === null) continue;
      const [r, g, b] = rgb(couleur);
      const ambre = angle >= 20 && angle <= 55;
      const cyan = angle >= 175 && angle <= 195 && jetonDe(couleur).startsWith('cyan');
      // Un blanc à peine bleuté : presque aucune couleur.
      const blanc = angle >= 180 && angle <= 210 && (Math.max(r, g, b) - Math.min(r, g, b)) / 255 <= 0.1 && jetonDe(couleur).startsWith('blanc');
      // Vert phosphore de la carte : seulement dans ses jetons (14 §2.2).
      const vert = angle >= 85 && angle <= 140 && jetonDe(couleur).startsWith('vert');
      // Rouge du danger apparu dans le récit : seulement dans son jeton (D-233).
      const rouge = (angle <= 10 || angle >= 350) && jetonDe(couleur) === 'alerte';
      expect(ambre || cyan || blanc || vert || rouge, `${couleur} : teinte ${Math.round(angle)}°`).toBe(true);
    }
    expect(couleurs.some((couleur) => jetonDe(couleur).startsWith('cyan'))).toBe(true);
    expect(couleurs.some((couleur) => jetonDe(couleur).startsWith('blanc'))).toBe(true);
    expect(couleurs.some((couleur) => jetonDe(couleur).startsWith('vert'))).toBe(true);
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

  it('taille du texte (12 §4.10) : récit à 17, 19 ou 22 px, toute autre taille à proportion', () => {
    const echelle = (taille: string): number => {
      const valeur = new RegExp(`\\.ecran\\[data-taille='${taille}'\\]\\s*\\{\\s*--echelle:\\s*calc\\((\\d+) / (\\d+)\\);`).exec(css);
      return Number(valeur?.[1]) / Number(valeur?.[2]);
    };
    expect(/\.ecran\s*\{[^}]*--echelle:\s*1;[^}]*font-size:\s*calc\(17px \* var\(--echelle\)\);/.exec(css)).not.toBeNull();
    expect([17, 17 * echelle('grande'), 17 * echelle('tres_grande')].map(Math.round)).toEqual([17, 19, 22]);
    // Seule la racine garde une taille fixe : elle sert d'unité à la largeur de l'écran, pas au texte.
    const fixes = [...css.matchAll(/font-size:\s*([^;]+);/g)].map(([, valeur = '']) => valeur).filter((valeur) => !valeur.includes('var(--echelle)'));
    expect(fixes).toEqual(['17px']);
  });

  it('machine à écrire (D-186) : curseur lent, fixe sur [NON] ou si le téléphone demande moins d’animations', () => {
    const clignote = /\.curseur\s*\{\s*animation:\s*clignote\s+([\d.]+)s/.exec(css)?.[1];
    expect(Number(clignote)).toBeGreaterThanOrEqual(1.2);
    expect(/\.recit\.curseur-fixe \.curseur\s*\{\s*animation:\s*none;/.test(css)).toBe(true);
    const reduit = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    // Même spécificité que les règles de l'écriture, sinon elles l'emportent sur le mouvement réduit.
    expect(reduit).toMatch(/\.recit\.ecrire \.car,\s*\.recit \.curseur,\s*\.recit\.ecrire \.curseur\s*\{\s*animation:\s*none;/);
    // Le caractère à venir est caché mais garde sa place : la mise en page ne bouge pas.
    expect(/@keyframes apparait\s*\{\s*from\s*\{\s*visibility:\s*hidden;/.test(css)).toBe(true);
  });

  it('danger apparu (D-233) : triangle qui clignote sous trois éclats par seconde, fixe en mouvement réduit', () => {
    const cycle = /\.icone-alerte\s*\{[^}]*animation:\s*alerte\s+([\d.]+)s/.exec(css)?.[1];
    // Un éclat par cycle : au plus trois par seconde (WCAG 2.3.1).
    expect(1 / Number(cycle)).toBeLessThanOrEqual(3);
    expect(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.icone-alerte\s*\{\s*animation:\s*none;/.test(css)).toBe(true);
    expect(/\.recit \.alerte\s*\{\s*color:\s*var\(--alerte\);/.test(css)).toBe(true);
  });

  it('repère d’IA Station (D-263) : deux pulsations rapides, une seconde de pause, sous trois éclats par seconde, fixe en mouvement réduit', () => {
    const cycle = Number(/\.notification-ia\s*\{[^}]*animation:\s*notification-ia\s+([\d.]+)s\s+linear\s+infinite/.exec(css)?.[1]);
    const etapes = [...(/@keyframes notification-ia\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '').matchAll(/([\d.%,\s]+)\{\s*opacity:\s*([\d.]+);/g)].flatMap(([, reperes = '', opacite = '']) =>
      reperes.split(',').map((repere) => ({ temps: (parseFloat(repere) / 100) * cycle, opacite: Number(opacite) })),
    );
    const creux = etapes.filter((etape) => etape.opacite < 1).map((etape) => etape.temps);
    const hauts = etapes.filter((etape) => etape.opacite === 1).map((etape) => etape.temps);
    expect(creux).toHaveLength(2);
    // Le repère ne disparaît jamais tout à fait, et le bouton n'est pas touché.
    expect(Math.min(...etapes.map((etape) => etape.opacite))).toBeGreaterThan(0);
    // Deux éclats dans la même demi-seconde (au plus trois par seconde, WCAG 2.3.1), puis une seconde de repos.
    const derniereFin = Math.max(...hauts.filter((temps) => temps < cycle - 0.001));
    expect(Math.max(...creux) - Math.min(...creux)).toBeLessThan(1 / 3);
    expect(cycle - derniereFin).toBeCloseTo(1, 2);
    expect(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.notification-ia\s*\{\s*animation:\s*none;/.test(css)).toBe(true);
    expect(css).not.toMatch(/\.nav-ia[^{]*\{[^}]*animation/);
  });

  it('fiche document (D-324) : support en capitales, chaque support dans sa typographie, pièce soulignée en pointillé', () => {
    const regle = (selecteur: string): string => new RegExp(`^${selecteur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm').exec(css)?.[1] ?? '';
    expect(regle('.fiche-document .support')).toContain('text-transform: uppercase');
    // La ligne « où » reprend la casse normale.
    expect(regle('.fiche-document .support span')).toContain('text-transform: none');
    // À 320 px, un mot long (code, nom lettré) se coupe plutôt que de déborder de la bulle.
    expect(regle('.fiche-document .doc')).toContain('overflow-wrap: anywhere');
    expect(regle('.fiche-document .doc-note')).toContain('font-style: italic');
    expect(regle('.fiche-document .doc-note')).toContain('border-left: 1px dashed');
    expect(regle('.fiche-document .doc-note .signe')).toContain('text-align: right');
    expect(regle('.fiche-document .doc-journal')).toContain('border: 1px solid');
    expect(regle('.fiche-document .doc-journal .barre')).toContain('text-transform: uppercase');
    expect(regle('.fiche-document .doc-journal li')).toContain('grid-template-columns: 5ch');
    expect(regle('.fiche-document .doc-message .didascalie')).toContain('color: var(--secondaire-menu)');
    expect(regle('.fiche-document .doc-inscription p')).toContain('text-transform: uppercase');
    expect(regle('.fiche-document .doc-affiche')).toContain('border: 3px double');
    expect(regle('.fiche-document .lieu')).toContain('text-decoration: underline dotted');
    // Une inscription ne penche plus quand le téléphone demande moins de mouvement.
    expect(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.fiche-document \.doc-inscription\s*\{\s*transform:\s*none;/.test(css)).toBe(true);
  });

  it('document en français', () => {
    expect(readFileSync(new URL('index.html', APPLI), 'utf8')).toContain('<html lang="fr">');
  });
});
