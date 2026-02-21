/**
 * Void Walker PWA - Preset Scenarios
 *
 * List of bundled preset scenarios available to all users.
 */

export interface PresetScenarioInfo {
  filename: string;
  title: string;
  description: string;
}

/**
 * List of preset scenarios bundled with the app.
 */
export const PRESET_SCENARIOS: PresetScenarioInfo[] = [
  {
    filename: 'L_Écho_du_Cristal_20251204_202642.json',
    title: "L'Écho du Cristal",
    description: 'Un mystère ancien enfoui dans une structure cristalline',
  },
  {
    filename: 'Le_Chœur_de_l_Héphaïstos_20251205_154843.json',
    title: "Le Chœur de l'Héphaïstos",
    description: 'Une forge spatiale aux secrets mortels',
  },
  {
    filename: 'Le_Silence_de_l_Observatoire_Kilo-7_20251205_141324.json',
    title: "Le Silence de l'Observatoire Kilo-7",
    description: 'Un observatoire spatial tombé dans le silence',
  },
];

/**
 * Load a preset scenario from the public folder.
 */
export async function loadPresetScenario(filename: string): Promise<any> {
  const response = await fetch(`/scenarios/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load preset scenario: ${filename}`);
  }
  return response.json();
}

/**
 * Get all preset scenarios metadata.
 */
export function getPresetScenariosList(): PresetScenarioInfo[] {
  return PRESET_SCENARIOS;
}
