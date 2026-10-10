import { readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { Nodes } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toString } from 'mdast-util-to-string';
import { REPO_ROOT, displayPath, isMainModule, listRepoFiles } from './repo-files';

export interface BrokenLink {
  readonly file: string;
  readonly line: number;
  readonly url: string;
  readonly reason: string;
}

export interface LinkReport {
  readonly files: number;
  readonly links: number;
  readonly broken: readonly BrokenLink[];
}

interface MarkdownFile {
  readonly links: readonly { readonly url: string; readonly line: number }[];
  readonly anchors: ReadonlySet<string>;
}

const URL_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Ancre d'un titre selon GitHub : minuscules, lettres accentuées gardées, ponctuation retirée, espaces en « - ». */
export function githubSlug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{Nd}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

// Titres en double : « -1 », « -2 »… comme GitHub.
function uniqueSlug(base: string, occurrences: Map<string, number>): string {
  let slug = base;
  while (occurrences.has(slug)) {
    const count = (occurrences.get(base) ?? 0) + 1;
    occurrences.set(base, count);
    slug = `${base}-${count}`;
  }
  occurrences.set(slug, 0);
  return slug;
}

function parseMarkdown(text: string): MarkdownFile {
  const links: { url: string; line: number }[] = [];
  const anchors = new Set<string>();
  const occurrences = new Map<string, number>();
  const visit = (node: Nodes): void => {
    if (node.type === 'link' || node.type === 'image' || node.type === 'definition') {
      links.push({ url: node.url, line: node.position?.start.line ?? 0 });
    } else if (node.type === 'heading') {
      const title = toString(node, { includeHtml: false, includeImageAlt: false });
      anchors.add(uniqueSlug(githubSlug(title), occurrences));
    }
    if ('children' in node) {
      for (const child of node.children) visit(child);
    }
  };
  visit(fromMarkdown(text));
  return { links, anchors };
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Comparaison sensible à la casse, comme sur GitHub et la CI Linux, même sous Windows.
function exactPathChecker(root: string): (path: string) => boolean {
  const listings = new Map<string, readonly string[]>();
  const list = (directory: string): readonly string[] => {
    let entries = listings.get(directory);
    if (entries === undefined) {
      try {
        entries = readdirSync(directory);
      } catch {
        entries = [];
      }
      listings.set(directory, entries);
    }
    return entries;
  };
  return (path) => {
    let directory = root;
    for (const part of relative(root, path).split(sep).filter((segment) => segment !== '')) {
      if (!list(directory).includes(part)) return false;
      directory = join(directory, part);
    }
    return true;
  };
}

export function checkLinks(root: string): LinkReport {
  const parsed = new Map<string, MarkdownFile>();
  const read = (file: string): MarkdownFile => {
    let result = parsed.get(file);
    if (result === undefined) {
      result = parseMarkdown(readFileSync(file, 'utf8'));
      parsed.set(file, result);
    }
    return result;
  };
  const exists = exactPathChecker(root);

  const brokenReason = (file: string, url: string): string | null => {
    if (url === '') return 'lien vide';
    const hash = url.indexOf('#');
    const path = decode((hash === -1 ? url : url.slice(0, hash)).split('?')[0] ?? '');
    const anchor = hash === -1 ? '' : decode(url.slice(hash + 1));
    const target = path === '' ? file : path.startsWith('/') ? join(root, path) : resolve(dirname(file), path);
    const fromRoot = relative(root, target);
    if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) return 'cible hors du dépôt';
    if (!exists(target)) return `fichier introuvable (${displayPath(root, target)})`;
    if (anchor !== '' && target.endsWith('.md') && !read(target).anchors.has(anchor)) {
      return `titre #${anchor} introuvable dans ${displayPath(root, target)}`;
    }
    return null;
  };

  const files = listRepoFiles(root, ['.md']);
  const broken: BrokenLink[] = [];
  let links = 0;
  for (const file of files) {
    for (const link of read(file).links) {
      if (URL_SCHEME.test(link.url) || link.url.startsWith('//')) continue;
      links += 1;
      const reason = brokenReason(file, link.url);
      if (reason !== null) broken.push({ file: displayPath(root, file), line: link.line, url: link.url, reason });
    }
  }
  return { files: files.length, links, broken };
}

if (isMainModule(import.meta.url)) {
  const root = resolve(process.argv[2] ?? REPO_ROOT);
  const report = checkLinks(root);
  for (const link of report.broken) {
    console.error(`${link.file}:${link.line} lien '${link.url}' : ${link.reason}`);
  }
  const summary = `${report.files} fichiers Markdown, ${report.links} liens relatifs vérifiés`;
  if (report.broken.length > 0) {
    console.error(`\n${report.broken.length} lien(s) cassé(s) ; ${summary}.`);
    process.exitCode = 1;
  } else {
    console.log(`Liens Markdown valides : ${summary}.`);
  }
}
