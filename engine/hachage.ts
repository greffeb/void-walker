/** Hachage cyrb53 : stable, rapide, sans dépendance ; sert aux empreintes et aux identifiants publics. */
export function hacher(texte: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < texte.length; i++) {
    const code = texte.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

/** JSON aux clés triées : deux valeurs égales donnent toujours le même texte. */
export function serialiserCanonique(valeur: unknown): string {
  if (Array.isArray(valeur)) return `[${valeur.map((element) => serialiserCanonique(element)).join(',')}]`;
  if (valeur !== null && typeof valeur === 'object') {
    const objet = valeur as Record<string, unknown>;
    const entrees = Object.keys(objet)
      .filter((cle) => objet[cle] !== undefined)
      .sort()
      .map((cle) => `${JSON.stringify(cle)}:${serialiserCanonique(objet[cle])}`);
    return `{${entrees.join(',')}}`;
  }
  if (typeof valeur === 'number' && !Number.isFinite(valeur)) throw new TypeError('Nombre non sérialisable.');
  if (valeur === undefined || typeof valeur === 'function' || typeof valeur === 'symbol' || typeof valeur === 'bigint') {
    throw new TypeError(`Valeur non sérialisable : ${typeof valeur}.`);
  }
  return JSON.stringify(valeur);
}

export function empreinte(valeur: unknown): string {
  return hacher(serialiserCanonique(valeur));
}
