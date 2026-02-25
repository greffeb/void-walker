// ---------------------------------------------------------------------------
// tests/unit/content/settings.test.ts — Settings data validation
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { LAUNCH_SETTINGS, getSettingById, SETTING_IDS } from '../../../src/content/settings';

describe('LAUNCH_SETTINGS', () => {
  it('has exactly 3 settings', () => {
    expect(LAUNCH_SETTINGS).toHaveLength(3);
  });

  it('has the 3 expected setting IDs', () => {
    const ids = LAUNCH_SETTINGS.map(s => s.id);
    expect(ids).toContain('derelict_ship');
    expect(ids).toContain('space_station');
    expect(ids).toContain('alien_ruins');
  });

  it('all settings have nameKey with fr and en', () => {
    for (const setting of LAUNCH_SETTINGS) {
      expect(setting.nameKey.fr).toBeTruthy();
      expect(setting.nameKey).toHaveProperty('en');
    }
  });

  it('all settings have categories', () => {
    for (const setting of LAUNCH_SETTINGS) {
      expect(setting.categories.length).toBeGreaterThan(0);
    }
  });

  it('all settings have supportedRoles', () => {
    for (const setting of LAUNCH_SETTINGS) {
      expect(setting.supportedRoles.length).toBeGreaterThan(0);
    }
  });

  it('all settings have features and preferredItems', () => {
    for (const setting of LAUNCH_SETTINGS) {
      expect(setting.features.length).toBeGreaterThan(0);
      expect(setting.preferredItems.length).toBeGreaterThan(0);
    }
  });
});

describe('derelict_ship setting', () => {
  const ship = LAUNCH_SETTINGS.find(s => s.id === 'derelict_ship')!;

  it('exists', () => { expect(ship).toBeDefined(); });

  it('has space_vessel category', () => {
    expect(ship.categories).toContain('space_vessel');
  });

  it('supports the 10 expected roles', () => {
    const expected = [
      'passage', 'control_room', 'storage', 'medical', 'quarters',
      'hub', 'dead_end', 'hazard_zone', 'engineering', 'airlock',
    ];
    for (const role of expected) {
      expect(ship.supportedRoles).toContain(role);
    }
  });

  it('does NOT support alien-only roles', () => {
    expect(ship.supportedRoles).not.toContain('ritual_chamber');
    expect(ship.supportedRoles).not.toContain('organic_growth');
    expect(ship.supportedRoles).not.toContain('crystal_cave');
    expect(ship.supportedRoles).not.toContain('gravity_well');
  });

  it('does NOT support station-only roles', () => {
    expect(ship.supportedRoles).not.toContain('lab');
    expect(ship.supportedRoles).not.toContain('server_room');
  });

  it('has 20+ location names per supported role', () => {
    for (const role of ship.supportedRoles) {
      const names = ship.locationNames[role];
      expect(names, `Role '${role}' should have location names`).toBeDefined();
      expect(names.length, `Role '${role}' needs ≥20 names, got ${names.length}`).toBeGreaterThanOrEqual(20);
    }
  });

  it('all location names have a fr string', () => {
    for (const role of ship.supportedRoles) {
      const names = ship.locationNames[role] ?? [];
      for (const name of names) {
        expect(name.fr, `Role '${role}' has empty fr name`).toBeTruthy();
      }
    }
  });
});

describe('space_station setting', () => {
  const station = LAUNCH_SETTINGS.find(s => s.id === 'space_station')!;

  it('exists', () => { expect(station).toBeDefined(); });

  it('has facility category', () => {
    expect(station.categories).toContain('facility');
  });

  it('supports 12 roles including lab and server_room', () => {
    const expected = [
      'passage', 'control_room', 'storage', 'medical', 'quarters',
      'hub', 'dead_end', 'hazard_zone', 'engineering', 'airlock',
      'lab', 'server_room',
    ];
    for (const role of expected) {
      expect(station.supportedRoles).toContain(role);
    }
  });

  it('does NOT support alien-only roles', () => {
    expect(station.supportedRoles).not.toContain('ritual_chamber');
    expect(station.supportedRoles).not.toContain('crystal_cave');
  });

  it('has 20+ location names per supported role', () => {
    for (const role of station.supportedRoles) {
      const names = station.locationNames[role];
      expect(names, `Role '${role}' should have location names`).toBeDefined();
      expect(names.length, `Role '${role}' needs ≥20 names, got ${names.length}`).toBeGreaterThanOrEqual(20);
    }
  });
});

describe('alien_ruins setting', () => {
  const ruins = LAUNCH_SETTINGS.find(s => s.id === 'alien_ruins')!;

  it('exists', () => { expect(ruins).toBeDefined(); });

  it('has alien category', () => {
    expect(ruins.categories).toContain('alien');
  });

  it('supports 9 alien-appropriate roles', () => {
    const expected = [
      'passage', 'control_room', 'hub', 'dead_end', 'hazard_zone',
      'ritual_chamber', 'organic_growth', 'crystal_cave', 'gravity_well',
    ];
    for (const role of expected) {
      expect(ruins.supportedRoles).toContain(role);
    }
  });

  it('does NOT support ship/station-only roles', () => {
    const excluded = ['storage', 'medical', 'quarters', 'engineering', 'airlock', 'lab', 'server_room'];
    for (const role of excluded) {
      expect(ruins.supportedRoles).not.toContain(role);
    }
  });

  it('has 20+ location names per supported role', () => {
    for (const role of ruins.supportedRoles) {
      const names = ruins.locationNames[role];
      expect(names, `Role '${role}' should have location names`).toBeDefined();
      expect(names.length, `Role '${role}' needs ≥20 names, got ${names.length}`).toBeGreaterThanOrEqual(20);
    }
  });
});

describe('role compatibility matrix', () => {
  it('"passage" is in all 3 settings', () => {
    for (const setting of LAUNCH_SETTINGS) {
      expect(setting.supportedRoles).toContain('passage');
    }
  });

  it('"hub" is in all 3 settings', () => {
    for (const setting of LAUNCH_SETTINGS) {
      expect(setting.supportedRoles).toContain('hub');
    }
  });

  it('"control_room" is in all 3 settings', () => {
    for (const setting of LAUNCH_SETTINGS) {
      expect(setting.supportedRoles).toContain('control_room');
    }
  });

  it('"server_room" is only in space_station', () => {
    const withServerRoom = LAUNCH_SETTINGS.filter(s => s.supportedRoles.includes('server_room'));
    expect(withServerRoom).toHaveLength(1);
    expect(withServerRoom[0].id).toBe('space_station');
  });

  it('"ritual_chamber" is only in alien_ruins', () => {
    const withRitual = LAUNCH_SETTINGS.filter(s => s.supportedRoles.includes('ritual_chamber'));
    expect(withRitual).toHaveLength(1);
    expect(withRitual[0].id).toBe('alien_ruins');
  });

  it('"airlock" is in derelict_ship and space_station but not alien_ruins', () => {
    const ship = LAUNCH_SETTINGS.find(s => s.id === 'derelict_ship')!;
    const station = LAUNCH_SETTINGS.find(s => s.id === 'space_station')!;
    const ruins = LAUNCH_SETTINGS.find(s => s.id === 'alien_ruins')!;
    expect(ship.supportedRoles).toContain('airlock');
    expect(station.supportedRoles).toContain('airlock');
    expect(ruins.supportedRoles).not.toContain('airlock');
  });
});

describe('getSettingById', () => {
  it('finds each setting by ID', () => {
    expect(getSettingById('derelict_ship')).toBeDefined();
    expect(getSettingById('space_station')).toBeDefined();
    expect(getSettingById('alien_ruins')).toBeDefined();
  });

  it('returns undefined for unknown ID', () => {
    expect(getSettingById('unknown_setting')).toBeUndefined();
  });
});

describe('SETTING_IDS', () => {
  it('contains all 3 setting IDs', () => {
    expect(SETTING_IDS).toContain('derelict_ship');
    expect(SETTING_IDS).toContain('space_station');
    expect(SETTING_IDS).toContain('alien_ruins');
  });
});

describe('location name uniqueness', () => {
  it('all names within a role are unique per setting', () => {
    for (const setting of LAUNCH_SETTINGS) {
      for (const role of setting.supportedRoles) {
        const names = setting.locationNames[role] ?? [];
        const frNames = names.map(n => n.fr);
        const unique = new Set(frNames);
        expect(unique.size, `Setting '${setting.id}' role '${role}' has duplicate names`).toBe(frNames.length);
      }
    }
  });
});
