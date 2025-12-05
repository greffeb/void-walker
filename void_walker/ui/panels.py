"""
Void Walker - UI Panels.

Map, inventory, help, and suggestions panels.
"""

from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from void_walker.core.state import GameState, Inventory, Location


def create_inventory_panel(inventory: Inventory) -> Panel:
    """
    Create the inventory panel.
    
    Args:
        inventory: Player's inventory
    
    Returns:
        Rich Panel with inventory display
    """
    content = Text()
    
    if not inventory.items:
        content.append("(Vide)", style="dim")
    else:
        for i, item in enumerate(inventory.items, 1):
            # Item number and name
            content.append(f"  {i}. ", style="dim")
            content.append(item.name, style="item")
            
            # Stat bonus if any
            if item.stat_bonus:
                bonuses = " ".join(f"[{stat} +{val}]" for stat, val in item.stat_bonus.items())
                content.append(f"  {bonuses}", style="success")
            
            # Uses if consumable
            if item.uses is not None:
                content.append(f"  [{item.uses} uses]", style="info")
            
            content.append("\n")
            
            # Description
            if item.description:
                content.append(f"     {item.description}", style="dim")
                content.append("\n")
            
            content.append("\n")
    
    return Panel(
        content,
        title=f"[item]INVENTAIRE ({inventory.count}/{inventory.max_slots})[/item]",
        border_style="border",
        padding=(1, 2),
    )


def create_map_panel(state: GameState) -> Panel:
    """
    Create the map panel showing explored locations.
    
    Args:
        state: Current game state
    
    Returns:
        Rich Panel with map display
    """
    content = Text()
    
    # Get all locations
    locations = state.scenario.locations
    current = state.current_location
    visited = state.visited_locations
    
    # Simple text-based map representation
    for loc in locations:
        if loc.id == current:
            # Current location
            content.append("█ ", style="success")
            content.append(loc.name, style="text.bright")
            content.append(" ← Vous êtes ici\n", style="success")
        elif loc.id in visited:
            # Visited location
            content.append("░ ", style="dim")
            content.append(loc.name, style="text")
            
            # Show connections
            if loc.threats:
                content.append(" ⚠", style="danger")
            content.append("\n")
        else:
            # Unknown location (only show if connected to visited)
            is_adjacent = any(
                loc.id in state.scenario.get_location(v).connections 
                for v in visited 
                if state.scenario.get_location(v)
            )
            if is_adjacent:
                content.append("○ ", style="dim")
                content.append("???", style="dim")
                content.append("\n")
    
    content.append("\n")
    content.append("█ Vous  ░ Visité  ○ Inconnu  ⚠ Danger", style="dim")
    
    return Panel(
        content,
        title="[info]CARTE[/info]",
        border_style="border",
        padding=(1, 2),
    )


def create_suggestions_panel(suggestions: list[str]) -> Panel:
    """
    Create the suggestions panel.

    Args:
        suggestions: List of suggested actions

    Returns:
        Rich Panel with suggestions
    """
    content = Text()

    for i, suggestion in enumerate(suggestions[:3], 1):
        content.append(f"  {i}. ", style="highlight")
        content.append(suggestion, style="text")
        content.append("\n")

    return Panel(
        content,
        title="[highlight]SUGGESTIONS[/highlight]",
        border_style="border",
        padding=(0, 2),
    )


def create_help_panel() -> Panel:
    """Create the help panel with controls."""
    content = """
[highlight]CONTRÔLES[/highlight]

  [text.bright]Entrée[/text.bright]     Valider une action
  [text.bright]↑ / ↓[/text.bright]      Historique des commandes
  [text.bright]Tab[/text.bright]        Afficher les suggestions
  
[highlight]RACCOURCIS[/highlight]

  [text.bright]i[/text.bright]          Inventaire
  [text.bright]m[/text.bright]          Carte
  [text.bright]?[/text.bright] ou [text.bright]h[/text.bright]    Aide
  [text.bright]q[/text.bright]          Quitter
  [text.bright]Ctrl+C[/text.bright]     Forcer la sortie

[highlight]ACTIONS[/highlight]

  Vous pouvez tenter n'importe quelle action.
  Tapez en français ce que vous voulez faire.
  
  Exemples:
  • "examiner la console"
  • "ouvrir la porte prudemment"
  • "parler au survivant"
  • "utiliser le multitool sur le panneau"

[highlight]JETS DE DÉS[/highlight]

  Certaines actions nécessitent un jet de dé.
  Jet = d20 + Stat + Modificateurs
  
  [success]20 naturel[/success] = Succès critique
  [danger]1 naturel[/danger]  = Échec critique
"""
    
    return Panel(
        content.strip(),
        title="[info]AIDE[/info]",
        border_style="border",
        padding=(1, 2),
    )


def create_character_panel(state: GameState) -> Panel:
    """
    Create character status panel.
    
    Args:
        state: Current game state
    
    Returns:
        Rich Panel with character info
    """
    player = state.player
    
    content = Text()
    content.append(f"{player.name}\n", style="text.bright")
    content.append(f"{player.class_name}\n\n", style="dim")
    
    # Stats
    for stat, value in player.stats.items():
        bars = "█" * value + "░" * (5 - value)
        content.append(f"  {stat}: ", style="text")
        content.append(f"{bars} ", style="info")
        content.append(f"{value}/5\n", style="dim")
    
    content.append("\n")
    
    # HP bar
    hp_pct = player.hp / player.max_hp
    hp_bars = int(hp_pct * 10)
    hp_color = "success" if hp_pct > 0.5 else "highlight" if hp_pct > 0.25 else "danger"
    
    content.append("  HP: ", style="text")
    content.append("█" * hp_bars, style=hp_color)
    content.append("░" * (10 - hp_bars), style="dim")
    content.append(f" {player.hp}/{player.max_hp}\n", style=hp_color)
    
    return Panel(
        content,
        title="[text.bright]PERSONNAGE[/text.bright]",
        border_style="border",
        padding=(1, 2),
    )


def create_scene_elements_panel(elements: list[str]) -> Panel:
    """
    Create panel showing visible scene elements.
    
    Args:
        elements: List of visible/interactable elements
    
    Returns:
        Rich Panel with elements list
    """
    content = Text()
    
    if not elements:
        content.append("(Rien de notable)", style="dim")
    else:
        for element in elements:
            content.append("  › ", style="info")
            content.append(element, style="text")
            content.append("\n")
    
    return Panel(
        content,
        title="[info]ÉLÉMENTS VISIBLES[/info]",
        border_style="border",
        padding=(0, 2),
    )


def create_validation_warnings_panel(warnings: list[str]) -> Panel | None:
    """
    Create panel showing validation warnings for the scenario.
    
    Args:
        warnings: List of warning messages from scenario validation
    
    Returns:
        Rich Panel with warnings, or None if no warnings
    """
    if not warnings:
        return None
    
    content = Text()
    content.append("Ce scénario a été généré avec des avertissements:\n\n", style="dim")
    
    for warning in warnings:
        content.append("  ⚠ ", style="highlight")
        content.append(warning, style="text")
        content.append("\n")
    
    content.append("\nLe jeu reste jouable, mais certaines incohérences sont possibles.", style="dim")
    
    return Panel(
        content,
        title="[highlight]AVERTISSEMENTS[/highlight]",
        border_style="highlight",
        padding=(1, 2),
    )


def display_validation_warnings(state: GameState, console=None) -> None:
    """
    Display validation warnings for the current scenario.
    
    Args:
        state: Current game state with scenario
        console: Rich Console to use (imports global if None)
    """
    if console is None:
        from void_walker.ui.terminal import get_console
        console = get_console()
    
    warnings = state.scenario.validation_warnings
    panel = create_validation_warnings_panel(warnings)
    
    if panel:
        console.print()
        console.print(panel)
        console.print()
