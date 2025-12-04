"""
Void Walker - Setting Templates.

Environmental storytelling elements and setting-specific content.
"""

# Setting types with descriptions
SETTING_DESCRIPTIONS: dict[str, dict] = {
    "derelict_ship": {
        "name_fr": "Vaisseau abandonné",
        "atmosphere": "Couloirs sombres, systèmes défaillants, silence oppressant",
        "typical_threats": ["IA corrompue", "contamination", "fuite d'oxygène"],
    },
    "space_station": {
        "name_fr": "Station spatiale",
        "atmosphere": "Modules interconnectés, vues sur le vide, rotations artificielles",
        "typical_threats": ["dépressurisation", "sabotage", "quarantaine"],
    },
    "planetary_colony": {
        "name_fr": "Colonie planétaire",
        "atmosphere": "Environnement hostile à l'extérieur, dômes de survie, tempêtes",
        "typical_threats": ["conditions extrêmes", "faune hostile", "ressources limitées"],
    },
    "asteroid_mine": {
        "name_fr": "Mine d'astéroïde",
        "atmosphere": "Tunnels creusés, gravité faible, poussière omniprésente",
        "typical_threats": ["effondrements", "gaz toxiques", "machines autonomes"],
    },
    "alien_ruins": {
        "name_fr": "Ruines extraterrestres",
        "atmosphere": "Architecture impossible, technologie incompréhensible, échos anciens",
        "typical_threats": ["pièges anciens", "gardiens automatiques", "radiations étranges"],
    },
    "research_lab": {
        "name_fr": "Laboratoire de recherche",
        "atmosphere": "Équipement de pointe, expériences abandonnées, données sensibles",
        "typical_threats": ["expériences échappées", "contamination biologique", "protocoles de sécurité"],
    },
    "prison_transport": {
        "name_fr": "Transport pénitentiaire",
        "atmosphere": "Cellules, couloirs étroits, systèmes de contrôle",
        "typical_threats": ["prisonniers évadés", "mutinerie", "systèmes de confinement"],
    },
    "generation_ship": {
        "name_fr": "Vaisseau génération",
        "atmosphere": "Écosystèmes artificiels, générations oubliées, espaces immenses",
        "typical_threats": ["factions hostiles", "systèmes vieillissants", "secrets enfouis"],
    },
}

# Environmental storytelling elements
STORYTELLING_ELEMENTS: dict[str, list[str]] = {
    "datapads": [
        "Journal personnel d'un membre d'équipage",
        "Rapport de maintenance avec notes inquiétantes",
        "Message d'urgence non envoyé",
        "Logs médicaux décrivant des symptômes étranges",
        "Correspondance privée révélant des tensions",
        "Rapports scientifiques partiellement corrompus",
    ],
    "wall_messages": [
        "Graffiti désespéré écrit avec du sang/peinture",
        "Symboles mystérieux gravés",
        "Flèches directionnelles avec avertissements",
        "Compte à rebours ou dates importantes",
        "Noms barrés d'une liste",
        "Équations ou diagrammes cryptiques",
    ],
    "radio_comms": [
        "Transmissions fantômes de l'équipage disparu",
        "Signaux de détresse automatiques",
        "Communications interceptées",
        "Voix de l'IA corrompue",
        "Bruit blanc avec des fragments de voix",
        "Messages codés en boucle",
    ],
    "physical_evidence": [
        "Traces de lutte",
        "Équipement abandonné précipitamment",
        "Barricades improvisées",
        "Cadavres ou restes",
        "Marques de griffures sur les murs",
        "Objets personnels éparpillés",
    ],
}

# NPC archetypes
NPC_ARCHETYPES: list[dict] = [
    {
        "type": "survivor",
        "disposition": "fearful",
        "knowledge": "partial",
        "description_template": "Un survivant traumatisé qui se cache depuis {time}",
    },
    {
        "type": "android",
        "disposition": "neutral",
        "knowledge": "technical",
        "description_template": "Un androïde fonctionnel mais au comportement étrange",
    },
    {
        "type": "hostile",
        "disposition": "aggressive",
        "knowledge": "none",
        "description_template": "Une menace qui ne peut pas être raisonnée",
    },
    {
        "type": "corrupted",
        "disposition": "unstable",
        "knowledge": "cryptic",
        "description_template": "Quelqu'un ou quelque chose qui a été changé",
    },
    {
        "type": "authority",
        "disposition": "demanding",
        "knowledge": "full",
        "description_template": "Une figure d'autorité avec ses propres objectifs",
    },
]


def get_setting_info(setting_type: str) -> dict | None:
    """Get information about a setting type."""
    return SETTING_DESCRIPTIONS.get(setting_type)


def get_storytelling_elements(element_type: str) -> list[str]:
    """Get storytelling elements of a specific type."""
    return STORYTELLING_ELEMENTS.get(element_type, [])


def get_npc_archetype(npc_type: str) -> dict | None:
    """Get NPC archetype information."""
    for archetype in NPC_ARCHETYPES:
        if archetype["type"] == npc_type:
            return archetype
    return None
