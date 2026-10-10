import { inflateSync } from 'node:zlib';
import { icone } from './generer-icones';

describe('icônes de la PWA', () => {
  it('produit un PNG valide de la taille demandée', () => {
    const png = icone(48);
    expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(png.readUInt32BE(16)).toBe(48);
    expect(png.readUInt32BE(20)).toBe(48);
    const longueur = png.readUInt32BE(33);
    const pixels = inflateSync(png.subarray(41, 41 + longueur));
    expect(pixels.length).toBe(48 * (1 + 48 * 3));
  });
});
