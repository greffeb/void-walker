import { empreinte, hacher } from './index';

describe('empreinte', () => {
  it("ne dépend pas de l'ordre des clés", () => {
    expect(empreinte({ a: 1, b: { c: [1, 2], d: 'x' } })).toBe(empreinte({ b: { d: 'x', c: [1, 2] }, a: 1 }));
  });

  it('distingue des valeurs différentes', () => {
    expect(empreinte({ a: [1, 2] })).not.toBe(empreinte({ a: [2, 1] }));
    expect(empreinte({ a: '1' })).not.toBe(empreinte({ a: 1 }));
  });

  it('ignore les propriétés absentes et refuse les valeurs non sérialisables', () => {
    expect(empreinte({ a: 1, b: undefined })).toBe(empreinte({ a: 1 }));
    expect(() => empreinte({ a: Number.NaN })).toThrow(TypeError);
    expect(() => empreinte(undefined)).toThrow(TypeError);
  });

  it('est stable entre exécutions', () => {
    expect(hacher('void-walker')).toBe(hacher('void-walker'));
    expect(hacher('void-walker')).toMatch(/^[0-9a-f]{14}$/);
  });
});
