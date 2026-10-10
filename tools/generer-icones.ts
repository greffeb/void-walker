import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { REPO_ROOT, isMainModule } from './repo-files';

// Icônes provisoires de la PWA : un anneau clair sur fond sombre, en attendant la direction visuelle.

const TABLE_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(octets: Buffer): number {
  let c = 0xffffffff;
  for (const octet of octets) c = (TABLE_CRC[(c ^ octet) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloc(type: string, donnees: Buffer): Buffer {
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(donnees.length);
  const corps = Buffer.concat([Buffer.from(type, 'ascii'), donnees]);
  const controle = Buffer.alloc(4);
  controle.writeUInt32BE(crc32(corps));
  return Buffer.concat([longueur, corps, controle]);
}

export function icone(taille: number): Buffer {
  const fond = [0x0b, 0x0d, 0x10];
  const anneau = [0xc8, 0xcc, 0xd2];
  const centre = taille / 2;
  const exterieur = taille * 0.3;
  const interieur = taille * 0.22;
  const lignes: Buffer[] = [];
  for (let y = 0; y < taille; y++) {
    const ligne = Buffer.alloc(1 + taille * 3);
    for (let x = 0; x < taille; x++) {
      const distance = Math.hypot(x + 0.5 - centre, y + 0.5 - centre);
      const couverture = Math.max(0, Math.min(1, exterieur - distance + 0.5, distance - interieur + 0.5));
      for (let canal = 0; canal < 3; canal++) {
        ligne[1 + x * 3 + canal] = Math.round((fond[canal] ?? 0) * (1 - couverture) + (anneau[canal] ?? 0) * couverture);
      }
    }
    lignes.push(ligne);
  }
  const entete = Buffer.alloc(13);
  entete.writeUInt32BE(taille, 0);
  entete.writeUInt32BE(taille, 4);
  entete.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloc('IHDR', entete),
    bloc('IDAT', deflateSync(Buffer.concat(lignes))),
    bloc('IEND', Buffer.alloc(0)),
  ]);
}

if (isMainModule(import.meta.url)) {
  const dossier = join(REPO_ROOT, 'app', 'public');
  mkdirSync(dossier, { recursive: true });
  for (const taille of [192, 512]) {
    writeFileSync(join(dossier, `icone-${taille}.png`), icone(taille));
    console.log(`app/public/icone-${taille}.png`);
  }
}
