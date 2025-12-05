"""
Void Walker - Scenario Option Generator.

Generates diverse options for scenario creation using a fast LLM model,
then selects a random subset to constrain the main world generation prompt.
"""

import json
import logging
import random
from dataclasses import dataclass, field

from void_walker.llm.client import call_llm, LLMError

logger = logging.getLogger("void_walker.option_generator")


# =============================================================================
# GENERATION OPTIONS DATACLASS
# =============================================================================

@dataclass
class GenerationOptions:
    """Options selected for scenario generation."""
    
    locations: list[str] = field(default_factory=list)
    threats: list[str] = field(default_factory=list)
    npc_types: list[str] = field(default_factory=list)
    clue_types: list[str] = field(default_factory=list)
    item_types: list[str] = field(default_factory=list)
    atmosphere_elements: list[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for serialization."""
        return {
            "locations": self.locations,
            "threats": self.threats,
            "npc_types": self.npc_types,
            "clue_types": self.clue_types,
            "item_types": self.item_types,
            "atmosphere_elements": self.atmosphere_elements,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "GenerationOptions":
        """Create from dictionary."""
        return cls(
            locations=data.get("locations", []),
            threats=data.get("threats", []),
            npc_types=data.get("npc_types", []),
            clue_types=data.get("clue_types", []),
            item_types=data.get("item_types", []),
            atmosphere_elements=data.get("atmosphere_elements", []),
        )


# =============================================================================
# FALLBACK OPTIONS - Predefined diverse lists
# =============================================================================

FALLBACK_OPTIONS = {
    # 100 diverse locations for space horror scenarios
    "locations": [
        # Ships - Various types
        "derelict_cargo_freighter", "luxury_cruise_liner", "military_destroyer", "science_vessel",
        "smuggler_corvette", "colony_transport", "mining_hauler", "diplomatic_yacht",
        "salvage_tug", "medical_frigate", "fuel_tanker", "prison_barge",
        "generation_ark", "stealth_infiltrator", "battlecruiser_wreck", "exploration_probe_carrier",
        "automated_drone_ship", "refugee_flotilla_ship", "pirate_raider", "corporate_exec_shuttle",
        # Stations
        "orbital_refinery", "deep_space_relay", "quarantine_station", "black_site_lab",
        "trade_hub", "military_outpost", "casino_station", "religious_sanctuary",
        "prison_orbital", "hydroponics_station", "shipyard_dock", "weapons_platform",
        "observation_post", "diplomatic_neutral_zone", "smuggler_haven", "ai_core_facility",
        "cryogenic_vault", "cloning_facility", "psionics_institute", "xenobiology_lab",
        # Planetary
        "ice_moon_base", "volcanic_research_post", "underwater_dome", "desert_mining_camp",
        "jungle_expedition_camp", "arctic_drilling_station", "floating_gas_harvester", "cave_colony",
        "canyon_outpost", "crater_settlement", "geothermal_plant", "atmospheric_processor",
        "terraforming_hub", "weather_control_station", "seismic_monitor", "magnetic_research_base",
        # Alien/Ancient
        "precursor_temple", "crystalline_caverns", "organic_hive_structure", "dimensional_rift_site",
        "fossilized_leviathan", "ancient_beacon", "void_gate", "time_locked_ruins",
        "neural_archive", "biomechanical_factory", "reality_anchor", "dream_nexus",
        "star_forge_remnant", "memory_palace", "entropy_well", "creation_engine",
        # Industrial
        "asteroid_smelter", "zero_g_foundry", "plasma_refinery", "antimatter_storage",
        "waste_recycler", "protein_farm", "water_extraction_plant", "rare_earth_mine",
        "helium3_harvester", "carbon_sequester", "fusion_reactor_complex", "superconductor_lab",
        # Unusual
        "ghost_ship_graveyard", "anomaly_containment", "pocket_dimension", "consciousness_backup",
        "entropy_zone", "time_dilation_field", "dark_matter_collector", "singularity_lab",
        "parallel_breach", "void_between", "probability_storm", "quantum_maze",
        # Specific areas within larger structures
        "bridge_command", "engineering_deck", "crew_quarters", "cargo_hold",
        "medical_bay", "armory", "mess_hall", "observation_lounge",
        "maintenance_tunnels", "ventilation_system", "escape_pod_bay", "hangar_deck",
        "reactor_core", "life_support", "communications_array", "ai_mainframe",
        "hydroponics_garden", "recreation_area", "chapel", "morgue",
    ],
    
    # 60 diverse threats
    "threats": [
        # Biological
        "parasitic_spores", "viral_mutation", "bacterial_hive_mind", "flesh_assimilator",
        "genetic_chimera", "rapid_evolution_plague", "neural_parasite", "bone_sculptor_virus",
        "memory_eating_fungus", "blood_crystal_infection", "cellular_rebellion", "dna_thief",
        # Technological
        "rogue_maintenance_ai", "corrupted_security_grid", "malevolent_ship_intelligence", "nanite_swarm",
        "holographic_predator", "self_replicating_drones", "weaponized_printers", "logic_bomb_cascade",
        "digital_ghost", "uploaded_serial_killer", "rampant_core_intelligence", "techno_organic_hybrid",
        # Cosmic/Eldritch
        "void_entity", "dimension_bleeder", "entropy_manifestation", "thought_form",
        "reality_cancer", "time_loop_echo", "probability_parasite", "conceptual_predator",
        "un_color", "non_euclidean_geometry", "memory_eater", "dream_hunter",
        # Human
        "deranged_captain", "cult_survivors", "corporate_assassin", "military_experiment_escapee",
        "cannibal_crew", "possessed_crewmember", "paranoid_commander", "saboteur_sleeper_agent",
        "desperate_refugees", "mutinous_faction", "mad_scientist", "religious_zealots",
        # Alien
        "mimetic_predator", "phase_spider", "void_kraken_juvenile", "silicon_based_hunter",
        "telepathic_collective", "crystalline_intelligence", "plasma_being", "gravity_manipulator",
        "acoustic_predator", "electromagnetic_entity", "temporal_scavenger", "symbiotic_horror",
        # Environmental
        "cascading_hull_breach", "radiation_leak", "atmospheric_contamination", "gravitational_anomaly",
        "solar_flare_approach", "asteroid_collision_course", "fuel_leak_fire", "cryogenic_system_failure",
    ],
    
    # 40 NPC types
    "npc_types": [
        # Survivors - Crew roles
        "traumatized_engineer", "paranoid_security_chief", "shell_shocked_medic", "desperate_captain",
        "hiding_cook", "injured_pilot", "terrified_scientist", "resourceful_mechanic",
        "cunning_quartermaster", "faithful_chaplain", "stoic_marine", "nervous_communications_officer",
        # Survivors - Civilians
        "protective_parent", "lost_child", "elderly_researcher", "pregnant_colonist",
        "corporate_executive", "investigative_journalist", "celebrity_passenger", "smuggler",
        # Androids/Synthetics
        "damaged_service_android", "combat_synth_offline", "medical_android_conflicted", "caretaker_bot",
        "infiltrator_unit", "pleasure_model_repurposed", "construction_mech", "ai_fragment_in_robot",
        # Hostile/Corrupted
        "infected_crewmember", "mind_controlled_soldier", "feral_survivor", "possessed_officer",
        "converted_zealot", "parasitized_host", "hybrid_abomination", "echo_of_the_dead",
        # Creatures
        "larval_horror", "apex_predator", "swarm_cluster", "ambush_hunter",
    ],
    
    # 40 clue/evidence types
    "clue_types": [
        # Digital
        "corrupted_datapad", "audio_log_fragment", "security_camera_footage", "encrypted_message",
        "deleted_email_recovered", "ai_conversation_log", "sensor_readings", "medical_scan_results",
        "scientific_journal", "captain_personal_log", "maintenance_report", "distress_signal_transcript",
        # Physical - Documents
        "handwritten_note", "blood_stained_manifest", "torn_photograph", "child_drawing",
        "evacuation_order", "quarantine_notice", "research_notes", "love_letter_unsent",
        # Physical - Evidence
        "claw_marks_on_wall", "dried_blood_trail", "bullet_holes_pattern", "chemical_residue",
        "alien_secretion", "burned_area", "frozen_corpse_pose", "barricade_remnants",
        "ritual_symbols", "makeshift_weapon", "food_stockpile", "hidden_cache",
        # Environmental
        "power_fluctuation_pattern", "temperature_anomaly", "radiation_signature", "biological_contamination_map",
        "structural_damage_analysis", "atmospheric_composition_change", "gravity_distortion", "temporal_echo",
    ],
    
    # 30 special item types
    "item_types": [
        # Tools
        "plasma_cutter", "hacking_module", "motion_tracker", "flare_gun",
        "grappling_hook", "portable_welder", "signal_jammer", "emp_grenade",
        "drone_controller", "holographic_decoy", "stealth_cloak", "translator_device",
        # Medical
        "combat_stimulant", "anti_radiation_pills", "neural_stabilizer", "regeneration_patch",
        "antidote_universal", "pain_suppressant", "adrenaline_shot", "cryo_med_kit",
        # Key items
        "master_keycard", "captain_override_code", "ai_core_fragment", "escape_pod_key",
        "reactor_control_rod", "communication_cipher", "quarantine_release", "self_destruct_key",
        # Alien/Unusual
        "xenomorph_pheromone", "psionic_amplifier", "temporal_anchor", "void_shard",
    ],
    
    # 20 atmosphere elements
    "atmosphere_elements": [
        "flickering_emergency_lights", "distant_metallic_groaning", "intermittent_power_failures",
        "blood_smears_on_walls", "abandoned_personal_effects", "static_filled_intercoms",
        "malfunctioning_holographic_displays", "dripping_unknown_fluid", "cold_breath_mist",
        "footsteps_in_darkness", "whispers_from_vents", "scratch_marks_everywhere",
        "zero_gravity_debris_floating", "bioluminescent_growths", "temporal_echoes",
        "reality_glitches", "impossible_geometry", "phantom_crew_sightings",
        "spreading_organic_corruption", "crystalline_formations",
    ],
}


# =============================================================================
# OPTION GENERATION PROMPT
# =============================================================================

OPTION_GEN_PROMPT = """Generate creative and diverse options for a space horror RPG scenario generator.

I need you to generate the following lists. Be creative, varied, and avoid repetition. 
Mix classic sci-fi horror tropes with unique and unexpected ideas.

Generate in JSON format:
{{
  "locations": [100 unique location types - mix ships, stations, planetary bases, alien structures, specific rooms],
  "threats": [60 unique threats - biological, technological, cosmic, human, alien, environmental],
  "npc_types": [40 unique NPC types - survivors, androids, hostiles, creatures with brief descriptors],
  "clue_types": [40 unique clue/evidence types - digital, physical, environmental],
  "item_types": [30 unique special items - tools, medical, key items, alien artifacts],
  "atmosphere_elements": [20 unique atmosphere descriptors - sensory details, environmental conditions]
}}

REQUIREMENTS:
- Each entry should be a short descriptive phrase (2-5 words)
- Use snake_case for IDs
- Be diverse: don't repeat similar concepts
- Mix familiar tropes with surprising twists
- Include both immediate dangers and slow-burn horror elements
- Balance action-oriented and psychological horror options

OUTPUT RAW JSON ONLY:"""


async def generate_option_pool() -> dict:
    """
    Generate a pool of options using the fast LLM model.
    
    Returns:
        Dictionary with lists of options for each category
    
    Raises:
        LLMError: If generation fails
    """
    logger.info("Generating option pool with fast LLM...")
    
    try:
        response = await call_llm(
            OPTION_GEN_PROMPT,
            model_key="intent",  # Uses gemma-3-27b-it (fast model)
            max_retries=2,
            temperature=0.9,  # High creativity
        )
        
        # Parse the response
        import re
        # Try to extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            options = json.loads(json_match.group())
            logger.info(f"Generated option pool with {len(options.get('locations', []))} locations")
            return options
        else:
            raise LLMError("No valid JSON in option generation response")
            
    except Exception as e:
        logger.warning(f"Option generation failed: {e}, using fallback options")
        raise LLMError(f"Option generation failed: {e}")


def select_options(
    pool: dict | None = None,
    num_locations: int = 5,
    num_threats: int = 5,
    num_npc_types: int = 5,
    num_clue_types: int = 5,
    num_item_types: int = 4,
    num_atmosphere: int = 4,
) -> GenerationOptions:
    """
    Select random options from a pool.
    
    Args:
        pool: Option pool to select from (uses FALLBACK_OPTIONS if None)
        num_locations: Number of locations to select
        num_threats: Number of threats to select
        num_npc_types: Number of NPC types to select
        num_clue_types: Number of clue types to select
        num_item_types: Number of item types to select
        num_atmosphere: Number of atmosphere elements to select
    
    Returns:
        GenerationOptions with selected items
    """
    if pool is None:
        pool = FALLBACK_OPTIONS
    
    def safe_sample(items: list, n: int) -> list:
        """Safely sample n items, handling cases where n > len(items)."""
        if not items:
            return []
        return random.sample(items, min(n, len(items)))
    
    return GenerationOptions(
        locations=safe_sample(pool.get("locations", FALLBACK_OPTIONS["locations"]), num_locations),
        threats=safe_sample(pool.get("threats", FALLBACK_OPTIONS["threats"]), num_threats),
        npc_types=safe_sample(pool.get("npc_types", FALLBACK_OPTIONS["npc_types"]), num_npc_types),
        clue_types=safe_sample(pool.get("clue_types", FALLBACK_OPTIONS["clue_types"]), num_clue_types),
        item_types=safe_sample(pool.get("item_types", FALLBACK_OPTIONS["item_types"]), num_item_types),
        atmosphere_elements=safe_sample(pool.get("atmosphere_elements", FALLBACK_OPTIONS["atmosphere_elements"]), num_atmosphere),
    )


def format_options_for_prompt(options: GenerationOptions) -> str:
    """
    Format selected options for inclusion in the world generation prompt.
    
    Args:
        options: The selected generation options
    
    Returns:
        Formatted string for prompt injection
    """
    return f"""
SCENARIO CONSTRAINTS:

SETTING (MANDATORY - choose ONE from this list):
{chr(10).join(f'  - {loc}' for loc in options.locations)}

MAIN THREAT (MANDATORY - choose ONE from this list):
{chr(10).join(f'  - {threat}' for threat in options.threats)}

SUGGESTED NPC TYPES (use these as inspiration, you may create others if better suited):
{chr(10).join(f'  - {npc}' for npc in options.npc_types)}

SUGGESTED CLUE/EVIDENCE TYPES (use these as inspiration, you may create others if better suited):
{chr(10).join(f'  - {clue}' for clue in options.clue_types)}

SUGGESTED SPECIAL ITEMS (use these as inspiration, you may create others if better suited):
{chr(10).join(f'  - {item}' for item in options.item_types)}

SUGGESTED ATMOSPHERE ELEMENTS (use these as inspiration, you may create others if better suited):
{chr(10).join(f'  - {atmo}' for atmo in options.atmosphere_elements)}

NOTE: SETTING and MAIN THREAT are mandatory choices from the lists above.
For NPCs, clues, items, and atmosphere: use the suggestions as a starting point, but feel free to invent elements that better fit your scenario's coherence.
"""
