import { readFileSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import ts from 'typescript';
import { REPO_ROOT, displayPath, isMainModule, listRepoFiles } from './repo-files';

// Règles d'import de docs/10-architecture.md §3 (AP-01).
export const ZONES = ['engine', 'content', 'app', 'cli', 'tools'] as const;
export type Zone = (typeof ZONES)[number];

interface ZoneRule {
  readonly zones: readonly Zone[];
  readonly typeOnlyZones: readonly Zone[];
  readonly packages: boolean;
  readonly nodeModules: boolean;
  readonly summary: string;
}

const RULES: Record<Zone, ZoneRule> = {
  engine: {
    zones: ['engine'],
    typeOnlyZones: [],
    packages: false,
    nodeModules: false,
    summary: "engine/ n'importe que engine/",
  },
  content: {
    zones: ['content'],
    typeOnlyZones: ['engine'],
    packages: false,
    nodeModules: false,
    summary: "content/ n'importe que content/ et les types de engine/",
  },
  app: {
    zones: ['app', 'engine', 'content'],
    typeOnlyZones: [],
    packages: true,
    nodeModules: false,
    summary: 'app/ importe app/, engine/, content/ et des paquets npm',
  },
  cli: {
    zones: ['cli', 'engine', 'content'],
    typeOnlyZones: [],
    packages: true,
    nodeModules: true,
    summary: 'cli/ importe cli/, engine/, content/, des paquets npm et des modules Node',
  },
  tools: {
    zones: ['tools', 'engine', 'content', 'app'],
    typeOnlyZones: [],
    packages: true,
    nodeModules: true,
    summary: 'tools/ importe tools/, engine/, content/, app/, des paquets npm et des modules Node',
  },
};

const ROOT_CONFIG_FILE = /^(vite|vitest|playwright|eslint)\.config\.(ts|js)$/;
const CODE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];

export interface ImportRecord {
  readonly form: string;
  /** `null` quand le spécifieur n'est pas une chaîne littérale. */
  readonly specifier: string | null;
  readonly typeOnly: boolean;
  readonly line: number;
}

export interface Violation {
  readonly file: string;
  readonly line: number;
  readonly message: string;
}

export interface ImportReport {
  readonly files: number;
  readonly violations: readonly Violation[];
}

type Target =
  | { readonly kind: 'zone'; readonly zone: Zone }
  | { readonly kind: 'outside'; readonly path: string }
  | { readonly kind: 'node' }
  | { readonly kind: 'package' };

function isTypeOnlyImport(clause: ts.ImportClause | undefined): boolean {
  if (clause === undefined) return false;
  if (clause.phaseModifier === ts.SyntaxKind.TypeKeyword) return true;
  const bindings = clause.namedBindings;
  return (
    clause.name === undefined &&
    bindings !== undefined &&
    ts.isNamedImports(bindings) &&
    bindings.elements.length > 0 &&
    bindings.elements.every((element) => element.isTypeOnly)
  );
}

function isTypeOnlyExport(declaration: ts.ExportDeclaration): boolean {
  if (declaration.isTypeOnly) return true;
  const clause = declaration.exportClause;
  return (
    clause !== undefined &&
    ts.isNamedExports(clause) &&
    clause.elements.length > 0 &&
    clause.elements.every((element) => element.isTypeOnly)
  );
}

/** Tous les imports d'un fichier : statiques, `export … from`, `import()`, `require`, types et références `///`. */
export function collectImports(fileName: string, text: string): ImportRecord[] {
  const scriptKind = /\.[cm]?jsx?$/.test(fileName)
    ? fileName.endsWith('x')
      ? ts.ScriptKind.JSX
      : ts.ScriptKind.JS
    : fileName.endsWith('.tsx')
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS;
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, scriptKind);
  const lineOf = (position: number): number => source.getLineAndCharacterOfPosition(position).line + 1;
  const records: ImportRecord[] = [];
  const add = (node: ts.Node, form: string, specifier: ts.Node | undefined, typeOnly: boolean): void => {
    const literal = specifier !== undefined && ts.isStringLiteralLike(specifier) ? specifier.text : null;
    records.push({ form, specifier: literal, typeOnly, line: lineOf(node.getStart(source)) });
  };

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      add(node, 'import', node.moduleSpecifier, isTypeOnlyImport(node.importClause));
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined) {
      add(node, 'export … from', node.moduleSpecifier, isTypeOnlyExport(node));
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      add(node, 'import = require', node.moduleReference.expression, node.isTypeOnly);
    } else if (ts.isImportTypeNode(node)) {
      const argument = ts.isLiteralTypeNode(node.argument) ? node.argument.literal : undefined;
      add(node, 'import() de type', argument, true);
    } else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        add(node, 'import()', node.arguments[0], false);
      } else if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
        add(node, 'require()', node.arguments[0], false);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  for (const reference of source.referencedFiles) {
    const path = reference.fileName;
    const specifier = path.startsWith('.') || isAbsolute(path) ? path : `./${path}`;
    records.push({ form: '/// <reference path>', specifier, typeOnly: true, line: lineOf(reference.pos) });
  }
  for (const reference of source.typeReferenceDirectives) {
    records.push({ form: '/// <reference types>', specifier: reference.fileName, typeOnly: true, line: lineOf(reference.pos) });
  }
  return records.sort((a, b) => a.line - b.line);
}

export function zoneOf(root: string, path: string): Zone | null {
  const first = relative(root, path).split(sep)[0];
  return ZONES.find((zone) => zone === first) ?? null;
}

function classify(root: string, file: string, specifier: string): Target {
  if (specifier.startsWith('.') || isAbsolute(specifier)) {
    const target = resolve(dirname(file), specifier);
    const zone = zoneOf(root, target);
    return zone === null ? { kind: 'outside', path: displayPath(root, target) } : { kind: 'zone', zone };
  }
  return specifier.startsWith('node:') || isBuiltin(specifier) ? { kind: 'node' } : { kind: 'package' };
}

function violationReason(zone: Zone, record: ImportRecord, target: Target): string | null {
  const rule = RULES[zone];
  switch (target.kind) {
    case 'zone':
      if (rule.zones.includes(target.zone)) return null;
      if (rule.typeOnlyZones.includes(target.zone)) {
        return record.typeOnly ? null : `import de valeur depuis ${target.zone}/ (seuls les types : import type)`;
      }
      return `${target.zone}/ interdit`;
    case 'outside':
      return `cible hors des dossiers du code (${target.path})`;
    case 'node':
      return rule.nodeModules ? null : 'module Node interdit';
    case 'package':
      return rule.packages ? null : 'paquet npm interdit';
  }
}

export function checkImports(root: string): ImportReport {
  const files = listRepoFiles(root, CODE_EXTENSIONS).filter(
    (file) => !(dirname(file) === root && ROOT_CONFIG_FILE.test(basename(file))),
  );
  const violations: Violation[] = [];
  for (const file of files) {
    const shown = displayPath(root, file);
    const zone = zoneOf(root, file);
    if (zone === null) {
      violations.push({ file: shown, line: 1, message: `fichier hors de ${ZONES.map((name) => `${name}/`).join(', ')}` });
      continue;
    }
    for (const record of collectImports(file, readFileSync(file, 'utf8'))) {
      const reason =
        record.specifier === null
          ? 'spécifieur non littéral, impossible à vérifier'
          : violationReason(zone, record, classify(root, file, record.specifier));
      if (reason !== null) {
        const specifier = record.specifier === null ? '' : ` '${record.specifier}'`;
        violations.push({ file: shown, line: record.line, message: `${record.form}${specifier} : ${reason} ; ${RULES[zone].summary}` });
      }
    }
  }
  return { files: files.length, violations };
}

if (isMainModule(import.meta.url)) {
  const root = resolve(process.argv[2] ?? REPO_ROOT);
  const report = checkImports(root);
  for (const violation of report.violations) {
    console.error(`${violation.file}:${violation.line} ${violation.message}`);
  }
  if (report.violations.length > 0) {
    console.error(
      `\n${report.violations.length} violation(s) des règles d'import (docs/10-architecture.md §3, AP-01) ; ${report.files} fichiers analysés.`,
    );
    process.exitCode = 1;
  } else {
    console.log(`Règles d'import respectées : ${report.files} fichiers analysés.`);
  }
}
