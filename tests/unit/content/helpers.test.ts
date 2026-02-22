// ---------------------------------------------------------------------------
// tests/unit/content/helpers.test.ts — Locale-aware alias helper tests
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { getEntityAliases } from '../../../src/content/helpers';

describe('getEntityAliases()', () => {
  test('returns explicit aliases from i18n for NPC (French)', () => {
    const aliases = getEntityAliases('npc.station_ai.aliases', 'npc.station_ai', 'fr');
    expect(aliases).toContain('ia');
    expect(aliases).toContain('intelligence');
    expect(aliases).toContain('artificielle');
    expect(aliases).toContain('ordinateur');
    expect(aliases).toContain('station');
  });

  test('returns explicit aliases from i18n for NPC (English)', () => {
    const aliases = getEntityAliases('npc.station_ai.aliases', 'npc.station_ai', 'en');
    expect(aliases).toContain('ai');
    expect(aliases).toContain('intelligence');
    expect(aliases).toContain('computer');
    expect(aliases).toContain('station');
  });

  test('includes tokenized display name tokens', () => {
    // "Membre d'équipage parasité" → includes 'membre', 'equipage', 'parasite'
    const aliases = getEntityAliases('npc.parasitized_crewmember.aliases', 'npc.parasitized_crewmember', 'fr');
    expect(aliases).toContain('membre');
    expect(aliases).toContain('equipage');
    expect(aliases).toContain('parasite');
  });

  test('deduplicates aliases', () => {
    const aliases = getEntityAliases('npc.station_ai.aliases', 'npc.station_ai', 'fr');
    const unique = new Set(aliases);
    expect(aliases.length).toBe(unique.size);
  });

  test('environment feature aliases work', () => {
    const aliases = getEntityAliases('env.blast_door.aliases', 'env.blast_door', 'fr');
    expect(aliases).toContain('porte');
    expect(aliases).toContain('blindee');
    expect(aliases).toContain('sas');
  });

  test('item aliases work', () => {
    const aliases = getEntityAliases('item.laser_pistol.aliases', 'item.laser_pistol', 'fr');
    expect(aliases).toContain('pistolet');
    expect(aliases).toContain('laser');
    expect(aliases).toContain('flingue');
  });

  test('defaults to French locale when not specified', () => {
    const aliases = getEntityAliases('npc.xenomorph.aliases', 'npc.xenomorph');
    expect(aliases).toContain('xenomorphe');
    expect(aliases).toContain('alien');
  });

  test('strips accents from tokenized display name', () => {
    // "Xénomorphe" → 'xenomorphe' (accents stripped in display name tokens)
    const aliases = getEntityAliases('npc.xenomorph.aliases', 'npc.xenomorph', 'fr');
    expect(aliases.every((a) => a === a.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))).toBe(true);
  });

  test('returns empty for unknown key', () => {
    const aliases = getEntityAliases('nonexistent.key' as never, 'nonexistent.name' as never);
    expect(aliases).toEqual([]);
  });
});
