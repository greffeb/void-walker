import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { displayPath, listRepoFiles } from './repo-files';

// Phrases écrites en dur dans l'interface (#239) : tout texte que l'appli affiche ou fait lire au lecteur d'écran vit dans
// app/libelles/, pour qu'une autre langue n'ait qu'un fichier à écrire. Repérage par heuristique : texte JSX, attributs lus
// (aria-label, title…) et chaînes qui ressemblent à du français (accent, apostrophe typographique, guillemets, points de
// suspension, ou mot à majuscule initiale), y compris dans les props des composants maison (#284). Une chaîne en minuscules
// sans accent hors JSX et hors attribut lu n'est pas repérée.

export interface PhraseEnDur {
  readonly fichier: string;
  readonly ligne: number;
  readonly texte: string;
}

/** Attributs JSX dont la valeur est lue par le joueur ou son lecteur d'écran. */
const ATTRIBUTS_LUS = new Set(['aria-label', 'aria-description', 'aria-valuetext', 'aria-roledescription', 'title', 'placeholder', 'alt', 'titre', 'libelle', 'detail', 'coupe']);

/**
 * Mots techniques ou de marque, jamais traduits : touches du clavier, plateformes lues dans l'agent du navigateur, forme de
 * gabarit (content/textes/gabarit.ts), nom du jeu et préfixe du numéro de version.
 */
const PERMIS = new Set(['Escape', 'Enter', 'Tab', 'Home', 'End', 'Macintosh', 'Android', 'Nom', 'VOID', 'WALKER▮', 'VOID WALKER', 'Void Walker', 'V']);

/** Diagnostics jamais affichés, par fichier : le joueur ne lit que le message générique de l'écran. */
const DIAGNOSTICS: Readonly<Record<string, readonly string[]>> = {
  'app/jeu.ts': ['Lecture de la sauvegarde impossible : '],
};

const LETTRE = /[A-Za-zÀ-ÿ]/;
const ENTITE = /&[a-z]+;/g;
const COMPARAISONS = new Set([ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken]);
const FRANCAIS = /[À-ÿ’«»…]|^[A-ZÀ-Ý][a-zà-ÿ]+(?:$|[\s.,:;!?])/;

function dansUnDiagnostic(noeud: ts.Node): boolean {
  for (let parent = noeud.parent; parent !== undefined; parent = parent.parent) {
    if (ts.isThrowStatement(parent)) return true;
    if (ts.isNewExpression(parent) && /(Error|Erreur)$/.test(parent.expression.getText())) return true;
    if (ts.isCallExpression(parent) && /^console\./.test(parent.expression.getText())) return true;
  }
  return false;
}

/** Attribut JSX qui porte la chaîne, s'il y en a un. */
function attributDe(noeud: ts.Node): string | null {
  for (let parent = noeud.parent; parent !== undefined; parent = parent.parent) {
    if (ts.isJsxAttribute(parent)) return parent.name.getText();
    if (ts.isJsxElement(parent) || ts.isJsxSelfClosingElement(parent) || ts.isJsxFragment(parent)) return null;
  }
  return null;
}

function estTechnique(noeud: ts.Node): boolean {
  const parent = noeud.parent;
  return (
    ts.isImportDeclaration(parent) ||
    ts.isExportDeclaration(parent) ||
    ts.isLiteralTypeNode(parent) ||
    ts.isExternalModuleReference(parent) ||
    (ts.isPropertyAssignment(parent) && parent.name === noeud) ||
    ts.isElementAccessExpression(parent) ||
    // Une valeur comparée, `type === 'bug'`, n'est pas affichée.
    (ts.isBinaryExpression(parent) && COMPARAISONS.has(parent.operatorToken.kind))
  );
}

/** Phrases en dur d'un fichier source de l'appli. */
export function phrasesEnDur(fichier: string, source: string): PhraseEnDur[] {
  const arbre = ts.createSourceFile(fichier, source, ts.ScriptTarget.Latest, true, fichier.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const permis = new Set(DIAGNOSTICS[fichier] ?? []);
  const trouvees: PhraseEnDur[] = [];
  const garder = (noeud: ts.Node, texte: string): void => {
    const net = texte.trim();
    if (net === '' || PERMIS.has(net) || permis.has(texte)) return;
    trouvees.push({ fichier, ligne: arbre.getLineAndCharacterOfPosition(noeud.getStart()).line + 1, texte: net });
  };
  const visiter = (noeud: ts.Node): void => {
    if (ts.isJsxText(noeud)) {
      if (LETTRE.test(noeud.text.replace(ENTITE, ''))) garder(noeud, noeud.text);
    } else if (ts.isStringLiteral(noeud) || ts.isNoSubstitutionTemplateLiteral(noeud) || ts.isTemplateLiteralToken(noeud)) {
      if (!estTechnique(noeud) && !dansUnDiagnostic(noeud)) {
        const attribut = attributDe(noeud);
        const lu = attribut !== null && ATTRIBUTS_LUS.has(attribut) ? LETTRE.test(noeud.text) : FRANCAIS.test(noeud.text.trim());
        if (lu) garder(noeud, noeud.text);
      }
    }
    ts.forEachChild(noeud, visiter);
  };
  visiter(arbre);
  return trouvees;
}

/** Phrases en dur de toute l'appli, hors tests et hors app/libelles/. */
export function phrasesEnDurDeLApp(racine: string): PhraseEnDur[] {
  return listRepoFiles(racine, ['.ts', '.tsx'])
    .map((chemin) => displayPath(racine, chemin))
    .filter((fichier) => fichier.startsWith('app/') && !fichier.startsWith('app/libelles/') && !/\.test\.tsx?$|\.d\.ts$/.test(fichier))
    .flatMap((fichier) => phrasesEnDur(fichier, readFileSync(`${racine}/${fichier}`, 'utf8')));
}
