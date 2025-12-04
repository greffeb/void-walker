"""
Void Walker - Character Classes.

Defines available character classes with their stats and starting equipment.
"""

from void_walker.core.state import Inventory, InventoryItem, Player, StatProgression


# Class definitions with stats and starting equipment
CLASSES: dict[str, dict] = {
    "Technicien": {
        "stats": {"FOR": 2, "INT": 4, "CHA": 2},
        "hp": 8,
        "inventory": [
            InventoryItem(
                name="Multitool",
                description="Outil multifonction pour réparations et piratage basique",
                item_type="tool",
                stat_bonus={"INT": 1},
            ),
            InventoryItem(
                name="Scanner portable",
                description="Analyse l'environnement et détecte les anomalies",
                item_type="tool",
            ),
        ],
        "description": "Expert en systèmes et réparations. Peut pirater des terminaux et réparer des équipements.",
    },
    "Marine": {
        "stats": {"FOR": 4, "INT": 2, "CHA": 2},
        "hp": 12,
        "inventory": [
            InventoryItem(
                name="Pistolet laser",
                description="Arme de service standard, fiable et efficace",
                item_type="weapon",
                stat_bonus={"FOR": 1},
            ),
            InventoryItem(
                name="Gilet pare-balles",
                description="Protection légère contre les projectiles",
                item_type="tool",
            ),
        ],
        "description": "Soldat entraîné au combat. Résistant et dangereux en confrontation directe.",
    },
    "Diplomate": {
        "stats": {"FOR": 2, "INT": 2, "CHA": 4},
        "hp": 8,
        "inventory": [
            InventoryItem(
                name="Traducteur universel",
                description="Facilite la communication avec toute forme d'intelligence",
                item_type="tool",
                stat_bonus={"CHA": 1},
            ),
            InventoryItem(
                name="Dossier confidentiel",
                description="Contient des informations sensibles pouvant servir de levier",
                item_type="data",
            ),
        ],
        "description": "Expert en négociation et manipulation. Peut convaincre ou tromper les PNJ.",
    },
    "Médecin": {
        "stats": {"FOR": 2, "INT": 3, "CHA": 3},
        "hp": 10,
        "inventory": [
            InventoryItem(
                name="Trousse médicale",
                description="Équipement médical complet pour soins d'urgence",
                item_type="consumable",
                uses=5,
            ),
            InventoryItem(
                name="Stimulants",
                description="Booste temporairement les capacités physiques",
                item_type="consumable",
                uses=2,
            ),
        ],
        "description": "Spécialiste médical. Peut soigner les blessures et analyser les contaminations.",
    },
    "Pilote": {
        "stats": {"FOR": 3, "INT": 3, "CHA": 2},
        "hp": 10,
        "inventory": [
            InventoryItem(
                name="Clés du vaisseau",
                description="Accès aux systèmes de pilotage et de navigation",
                item_type="key_item",
            ),
            InventoryItem(
                name="Combinaison EVA",
                description="Protection pour les sorties extravéhiculaires",
                item_type="tool",
            ),
        ],
        "description": "Pilote expérimenté. Connaît les vaisseaux et peut accéder aux zones de navigation.",
    },
}


def get_class_names() -> list[str]:
    """Get list of available class names."""
    return list(CLASSES.keys())


def get_class_info(class_name: str) -> dict | None:
    """Get information about a specific class."""
    return CLASSES.get(class_name)


def create_player(name: str, class_name: str) -> Player:
    """
    Create a new player character.
    
    Args:
        name: Player name
        class_name: Character class name
    
    Returns:
        New Player instance
    
    Raises:
        ValueError: If class_name is invalid
    """
    if class_name not in CLASSES:
        raise ValueError(f"Unknown class: {class_name}. Available: {', '.join(CLASSES.keys())}")
    
    class_info = CLASSES[class_name]
    
    # Create inventory with starting items
    inventory = Inventory()
    for item in class_info["inventory"]:
        # Clone the item to avoid shared references
        inventory.add(InventoryItem(**item.model_dump()))
    
    return Player(
        name=name,
        class_name=class_name,
        stats=class_info["stats"].copy(),
        hp=class_info["hp"],
        max_hp=class_info["hp"],
        inventory=inventory,
        stat_progress=StatProgression(),
    )
