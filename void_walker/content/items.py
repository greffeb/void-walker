"""
Void Walker - Item Definitions.

Common item templates and item-related utilities.
"""

from void_walker.core.state import InventoryItem


# Common item templates
COMMON_ITEMS: dict[str, InventoryItem] = {
    # Tools
    "lampe_torche": InventoryItem(
        name="Lampe torche",
        description="Éclaire les zones sombres",
        item_type="tool",
        stat_bonus={"INT": 1},
    ),
    "multitool": InventoryItem(
        name="Multitool",
        description="Outil multifonction pour réparations",
        item_type="tool",
        stat_bonus={"INT": 1},
    ),
    "scanner": InventoryItem(
        name="Scanner portable",
        description="Analyse l'environnement",
        item_type="tool",
    ),
    "combinaison_eva": InventoryItem(
        name="Combinaison EVA",
        description="Protection pour sorties dans le vide",
        item_type="tool",
    ),
    
    # Weapons
    "pistolet_laser": InventoryItem(
        name="Pistolet laser",
        description="Arme de service standard",
        item_type="weapon",
        stat_bonus={"FOR": 1},
    ),
    "barre_metal": InventoryItem(
        name="Barre de métal",
        description="Arme improvisée contondante",
        item_type="weapon",
    ),
    "couteau": InventoryItem(
        name="Couteau utilitaire",
        description="Lame polyvalente",
        item_type="weapon",
    ),
    
    # Consumables
    "trousse_medicale": InventoryItem(
        name="Trousse médicale",
        description="Soins d'urgence, restaure 4 HP",
        item_type="consumable",
        uses=3,
    ),
    "stimulant": InventoryItem(
        name="Stimulant",
        description="Boost temporaire de FOR",
        item_type="consumable",
        uses=1,
    ),
    "ration": InventoryItem(
        name="Ration d'urgence",
        description="Nourriture concentrée",
        item_type="consumable",
        uses=1,
    ),
    "ruban_adhesif": InventoryItem(
        name="Ruban adhésif",
        description="Mille et un usages",
        item_type="consumable",
        uses=3,
    ),
    
    # Key items
    "carte_acces": InventoryItem(
        name="Carte d'accès",
        description="Ouvre certaines portes sécurisées",
        item_type="key_item",
    ),
    "cle_vaisseau": InventoryItem(
        name="Clé du vaisseau",
        description="Accès aux commandes principales",
        item_type="key_item",
    ),
    
    # Data
    "datapad": InventoryItem(
        name="Datapad",
        description="Terminal portable avec des données",
        item_type="data",
    ),
    "journal": InventoryItem(
        name="Journal personnel",
        description="Notes d'un membre d'équipage",
        item_type="data",
    ),
    
    # Misc
    "debris": InventoryItem(
        name="Débris métallique",
        description="Morceaux de métal récupérés",
        item_type="misc",
    ),
    "cable": InventoryItem(
        name="Câble électrique",
        description="Peut servir à des réparations",
        item_type="misc",
    ),
}


def get_item_template(item_id: str) -> InventoryItem | None:
    """
    Get a copy of an item template.
    
    Args:
        item_id: Item identifier
    
    Returns:
        Copy of the item or None if not found
    """
    template = COMMON_ITEMS.get(item_id)
    if template:
        return InventoryItem(**template.model_dump())
    return None


def create_item(
    name: str,
    description: str | None = None,
    item_type: str = "misc",
    uses: int | None = None,
    stat_bonus: dict[str, int] | None = None,
) -> InventoryItem:
    """
    Create a custom item.
    
    Args:
        name: Item name
        description: Item description
        item_type: Type of item
        uses: Number of uses (None for unlimited)
        stat_bonus: Stat bonuses provided
    
    Returns:
        New InventoryItem
    """
    return InventoryItem(
        name=name,
        description=description,
        item_type=item_type,  # type: ignore
        uses=uses,
        stat_bonus=stat_bonus or {},
    )
