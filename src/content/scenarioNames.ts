// ---------------------------------------------------------------------------
// src/content/scenarioNames.ts — French display names for scenario-specific IDs
// ---------------------------------------------------------------------------
// Scenario skeletons and modules define items/features by raw IDs that have
// no entry in ITEM_DEFINITIONS or ENVIRONMENT_FEATURE_DEFINITIONS.
// This map provides human-readable French names for UI display.
// ---------------------------------------------------------------------------

/** French display names for scenario items and features. */
export const SCENARIO_NAMES_FR: Readonly<Record<string, string>> = {
  // === SCENARIO ITEMS ===
  access_keycard: 'badge d\'accès',
  android_override_code: 'code de neutralisation androïde',
  access_password_note: 'note avec mot de passe',
  captain_log_datapad: 'datapad du capitaine',
  data_chip: 'puce de données',
  emergency_flashlight: 'lampe de secours',
  encrypted_data_core: 'noyau de données chiffré',
  EVA_suit_locker_key: 'clé du casier EVA',
  first_aid_kit: 'trousse de premiers soins',
  medkit_basic: 'kit médical basique',
  medical_stabilizer: 'stabilisateur médical',
  oxygen_canister: 'bonbonne d\'oxygène',
  research_notes: 'notes de recherche',
  scanner_device: 'scanner portable',
  sonic_emitter_component: 'composant d\'émetteur sonique',
  standard_toolkit: 'trousse à outils standard',
  translator_device: 'traducteur universel',
  director_keycard: 'badge du directeur',
  incriminating_files: 'dossiers compromettants',

  // === ESCAPE SKELETON FEATURES ===
  cryopod: 'capsule cryogénique',
  status_terminal: 'terminal de statut',
  emergency_locker: 'casier d\'urgence',
  security_panel: 'panneau de sécurité',
  bulkhead_door: 'porte blindée',
  vent_cover: 'grille de ventilation',
  captain_terminal: 'terminal du capitaine',
  viewport: 'hublot d\'observation',
  EVA_suit_locker: 'casier de combinaison EVA',
  life_support_panel: 'panneau de support vie',
  o2_reroute_valve: 'valve de reroutage O₂',
  power_conduit: 'conduit d\'énergie',
  escape_pod_hatch: 'écoutille du pod d\'évasion',
  cargo_jettison_lever: 'levier de largage cargo',
  hull_breach_panel: 'panneau de brèche coque',
  pod_viewport: 'hublot du pod',

  // === INVESTIGATE SKELETON FEATURES ===
  docking_airlock: 'sas d\'amarrage',
  cargo_manifest_terminal: 'terminal du manifeste cargo',
  docking_clamps: 'pinces d\'amarrage',
  encrypted_terminal: 'terminal chiffré',
  maintenance_terminal: 'terminal de maintenance',
  director_notes_clipboard: 'bloc-notes du directeur',
  director_terminal: 'terminal du directeur',
  wall_safe: 'coffre-fort mural',
  evacuation_map: 'plan d\'évacuation',
  reactor_core: 'cœur du réacteur',
  ai_core_node_a: 'nœud IA primaire',
  ai_core_node_b: 'nœud IA secondaire',
  override_terminal: 'terminal de neutralisation',
  emergency_beacon: 'balise de détresse',
  comms_array_panel: 'panneau de communications',
  ai_final_lock: 'verrou final de l\'IA',
  beacon_transmission_screen: 'écran de transmission balise',

  // === RESCUE SKELETON FEATURES ===
  crashed_shuttle: 'navette écrasée',
  hull_breach: 'brèche de coque',
  salvageable_parts: 'pièces récupérables',
  emergency_beacon_broken: 'balise de détresse endommagée',
  collapsed_corridor: 'couloir effondré',
  maintenance_detour_hatch: 'trappe de déviation maintenance',
  plasma_cutter_rack: 'rack de découpeur plasma',
  survivor_barricade: 'barricade de survivant',
  research_terminal: 'terminal de recherche',
  acoustic_walls: 'parois acoustiques',
  distraction_rack: 'rack de diversion',
  blast_door_partial: 'porte blindée partiellement ouverte',
  shuttle_hatch: 'écoutille de navette',
  acoustic_trap_point: 'point de piège acoustique',
  extraction_bay_door: 'porte de baie d\'extraction',
  shuttle_cockpit: 'cockpit de navette',

  // === UNIVERSAL MODULE FEATURES ===
  blocked_door: 'porte bloquée',
  vent_hatch: 'trappe de ventilation',
  security_panel_local: 'panneau de sécurité local',
  medical_cabinet: 'armoire médicale',
  cot: 'couchette',
  light_fixture: 'luminaire',
  power_relay: 'relais d\'énergie',
  emergency_glow_strip: 'bande luminescente d\'urgence',
  supply_container: 'conteneur de ravitaillement',
  inventory_manifest: 'manifeste d\'inventaire',
  cover_crates: 'caisses de couverture',
  ambush_choke_point: 'point d\'étranglement',
  ventilation_shaft: 'conduit de ventilation',

  // === CATEGORY MODULE FEATURES ===
  airlock_breach: 'brèche du sas',
  weld_point: 'point de soudure',
  override_panel: 'panneau de neutralisation',
  android_station: 'station androïde',
  override_port: 'port de neutralisation',
  power_shutoff: 'coupe-circuit',
  alien_mechanism: 'mécanisme alien',
  symbol_panel_a: 'panneau de symboles A',
  symbol_panel_b: 'panneau de symboles B',
  psionic_node: 'nœud psionique',
  alien_inscription: 'inscription alien',
  void_shard: 'éclat du vide',
  containment_field: 'champ de confinement',
  resealing_unit: 'unité de rescellement',
  evacuation_panel: 'panneau d\'évacuation',
  power_distribution_panel: 'panneau de distribution d\'énergie',
  medbay_feed_circuit: 'circuit d\'alimentation infirmerie',
  door_feed_circuit: 'circuit d\'alimentation porte',

  // === COMPLEX MODULE FEATURES ===
  patrol_zone: 'zone de patrouille',
  stealth_cover: 'couverture furtive',
  distraction_point: 'point de diversion',
  trap_spot: 'emplacement de piège',
  flood_zone: 'zone inondée',
  valve_control: 'contrôle de valve',
  pipe_reroute: 'reroutage de tuyauterie',
  submerged_passage: 'passage submergé',
  debris_trap: 'piège de débris',
  restraint_lock: 'verrou de contention',
  structural_beam: 'poutre structurelle',
  log_archive: 'archive de journaux',
  backup_server: 'serveur de sauvegarde',
  physical_log_binder: 'classeur de journaux physiques',
  weakened_hull_section: 'section de coque fragilisée',
  careful_path_markers: 'marqueurs de passage sûr',
  seal_point: 'point de scellement',
};

/**
 * Get the French display name for a scenario item or feature ID.
 * Falls back to humanized ID (snake_case → readable) if not in the map.
 */
export function getScenarioNameFr(id: string): string {
  const mapped = SCENARIO_NAMES_FR[id];
  if (mapped) return mapped;
  // Fallback: convert snake_case to readable French
  return id.replace(/_/g, ' ');
}
