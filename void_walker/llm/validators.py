"""
Void Walker - Item and Response Validators.

Validates LLM-generated items against scenario definitions to prevent hallucinations.
"""

import difflib
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from void_walker.core.state import InventoryItem, Scenario

logger = logging.getLogger("void_walker.validators")


# Item types that require strict validation against scenario
STRICT_ITEM_TYPES = {"key_item", "tool"}

# Fallback descriptions for items without description, keyed by item_type
FALLBACK_DESCRIPTIONS: dict[str, str] = {
    "consumable": "Un objet consommable",
    "tool": "Un outil utilitaire",
    "weapon": "Une arme",
    "key_item": "Un objet important",
    "data": "Des données ou documents",
    "misc": "Un objet divers",
}


def normalize_id(item_id: str) -> str:
    """
    Normalize an item ID for comparison.
    
    Converts to lowercase and standardizes separators.
    
    Args:
        item_id: The item ID to normalize
    
    Returns:
        Normalized ID string
    """
    return item_id.lower().replace("-", "_").replace(" ", "_")


def looks_like_id(text: str) -> bool:
    """
    Check if a string looks like a technical ID rather than a human-readable name.
    
    Args:
        text: The string to check
    
    Returns:
        True if the string looks like an ID (contains underscores, no spaces, snake_case)
    """
    return "_" in text or (" " not in text and text.islower())


def should_validate_strictly(item_type: str | None) -> bool:
    """
    Check if an item type requires strict validation.
    
    Key items and tools must exist in the scenario.
    Consumables, data, and flavor items can be invented by the LLM.
    
    Args:
        item_type: The type of item (key_item, tool, consumable, data, etc.)
    
    Returns:
        True if item must be validated against scenario, False if can be invented
    """
    if item_type is None:
        return False
    return item_type.lower() in STRICT_ITEM_TYPES


def get_all_scenario_items(scenario: "Scenario") -> dict[str, "InventoryItem"]:
    """
    Collect all items from all locations in the scenario.
    
    Args:
        scenario: The game scenario
    
    Returns:
        Dictionary mapping item ID to InventoryItem
    """
    all_items: dict[str, "InventoryItem"] = {}
    
    for location in scenario.locations:
        for item in location.items:
            if item.id:
                all_items[item.id.lower()] = item
            # Also index by name for fuzzy matching
            all_items[f"name:{item.name.lower()}"] = item
    
    return all_items


def validate_item(
    item_id: str | None,
    item_name: str,
    item_type: str | None,
    scenario: "Scenario",
) -> tuple["InventoryItem | None", bool, str | None]:
    """
    Validate an item from LLM response against scenario items.
    
    Args:
        item_id: The item ID from LLM response (may be hallucinated)
        item_name: The item name from LLM response
        item_type: The item type from LLM response
        scenario: The game scenario containing valid items
    
    Returns:
        Tuple of:
        - Validated InventoryItem (from scenario if found, or original if flavor item)
        - Boolean indicating if this was a hallucination that was corrected
        - Error message if item should be rejected, None otherwise
    """
    from void_walker.core.state import InventoryItem
    
    # Get all scenario items
    all_items = get_all_scenario_items(scenario)
    
    # Try exact match by ID (with normalization)
    if item_id:
        item_id_normalized = normalize_id(item_id)
        # First try exact match
        if item_id_normalized in all_items:
            logger.debug(f"Item '{item_id}' validated by exact ID match")
            return all_items[item_id_normalized], False, None
        # Try normalized comparison against all scenario items
        for scenario_id, scenario_item in all_items.items():
            if not scenario_id.startswith("name:"):
                if normalize_id(scenario_id) == item_id_normalized:
                    logger.debug(f"Item '{item_id}' validated by normalized ID match")
                    return scenario_item, False, None
    
    # Try exact match by name
    name_key = f"name:{item_name.lower()}"
    if name_key in all_items:
        logger.debug(f"Item '{item_name}' validated by exact name match")
        return all_items[name_key], False, None
    
    # For non-strict items (flavor/consumables), accept with fallback description
    if not should_validate_strictly(item_type):
        resolved_type = item_type or "consumable"
        fallback_desc = FALLBACK_DESCRIPTIONS.get(resolved_type, "Un objet")
        logger.debug(f"Item '{item_name}' accepted as flavor item (type={resolved_type})")
        return InventoryItem(
            id=item_id,
            name=item_name,
            description=fallback_desc,
            item_type=resolved_type,
        ), False, None
    
    # For strict items, try fuzzy matching
    best_match: "InventoryItem | None" = None
    best_ratio = 0.0
    
    # Collect all valid item names for comparison
    valid_names = [
        (item.name, item) 
        for item in all_items.values() 
        if item.item_type in STRICT_ITEM_TYPES
    ]
    
    for valid_name, valid_item in valid_names:
        # Compare item names
        ratio = difflib.SequenceMatcher(
            None, 
            item_name.lower(), 
            valid_name.lower()
        ).ratio()
        
        if ratio > best_ratio:
            best_ratio = ratio
            best_match = valid_item
        
        # Also compare IDs if available
        if item_id and valid_item.id:
            id_ratio = difflib.SequenceMatcher(
                None,
                item_id.lower(),
                valid_item.id.lower()
            ).ratio()
            if id_ratio > best_ratio:
                best_ratio = id_ratio
                best_match = valid_item
    
    # Accept fuzzy match if ratio > 0.8
    if best_match and best_ratio > 0.8:
        logger.warning(
            f"Item hallucination corrected: '{item_name}' (id={item_id}) "
            f"-> '{best_match.name}' (id={best_match.id}) [ratio={best_ratio:.2f}]"
        )
        return best_match, True, None
    
    # Strict item with no match - reject
    logger.warning(
        f"Item hallucination rejected: '{item_name}' (id={item_id}, type={item_type}) "
        f"- no matching scenario item found"
    )
    return None, True, f"Item '{item_name}' n'existe pas dans ce scénario"


def validate_items_batch(
    items: list[dict | str],
    scenario: "Scenario",
) -> tuple[list["InventoryItem"], list[str]]:
    """
    Validate a batch of items from LLM response.
    
    Args:
        items: List of item data (dicts with id/name/type or just strings)
        scenario: The game scenario
    
    Returns:
        Tuple of (validated items, warning messages)
    """
    from void_walker.core.state import InventoryItem
    
    validated: list[InventoryItem] = []
    warnings: list[str] = []
    
    for item_data in items:
        if isinstance(item_data, str):
            # Check if string looks like an ID (snake_case, underscores)
            if looks_like_id(item_data):
                # Treat as item ID, not name
                item_id = item_data
                item_name = item_data  # Fallback name if not found in scenario
            else:
                # Treat as human-readable name
                item_id = None
                item_name = item_data
            item_type = None
        elif isinstance(item_data, dict):
            item_id = item_data.get("id")
            item_name = item_data.get("name", "Unknown")
            item_type = item_data.get("item_type")
        else:
            continue
        
        validated_item, was_corrected, error = validate_item(
            item_id, item_name, item_type, scenario
        )
        
        if validated_item:
            validated.append(validated_item)
            if was_corrected:
                warnings.append(f"Item corrigé: {item_name} -> {validated_item.name}")
        elif error:
            warnings.append(error)
    
    return validated, warnings
