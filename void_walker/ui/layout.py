"""
Void Walker - Layout System.

Responsive layout management for the terminal UI.
"""

from dataclasses import dataclass

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from void_walker.config import TERMINAL_MIN_WIDTH, TERMINAL_RECOMMENDED_WIDTH
from void_walker.ui.terminal import get_console


@dataclass
class Layout:
    """Layout configuration for the UI."""
    
    narrative_width: int
    side_panel_width: int
    margin_x: int
    can_show_side_panels: bool
    is_compact: bool


def calculate_layout(width: int | None = None, height: int | None = None) -> Layout:
    """
    Calculate layout based on terminal size.
    
    Args:
        width: Terminal width (uses current if None)
        height: Terminal height (uses current if None)
    
    Returns:
        Layout configuration
    """
    console = get_console()
    
    if width is None:
        width = console.size.width
    if height is None:
        height = console.size.height
    
    if width >= TERMINAL_RECOMMENDED_WIDTH:
        # Wide terminal: can show side panels
        narrative_width = 100
        side_panel_width = 40
        can_show_side_panels = True
    elif width >= TERMINAL_MIN_WIDTH:
        # Standard: toggleable panels overlay
        narrative_width = 80
        side_panel_width = 35
        can_show_side_panels = False
    else:
        # Narrow: minimal UI
        narrative_width = max(60, width - 4)
        side_panel_width = max(30, width - 4)
        can_show_side_panels = False
    
    margin_x = max(0, (width - narrative_width) // 2)
    is_compact = width < TERMINAL_MIN_WIDTH
    
    return Layout(
        narrative_width=narrative_width,
        side_panel_width=side_panel_width,
        margin_x=margin_x,
        can_show_side_panels=can_show_side_panels,
        is_compact=is_compact,
    )


def create_status_bar(
    hp: int,
    max_hp: int,
    o2: int,
    location: str,
    inventory_count: int,
    setting_name: str,
    elapsed_time: str,
    is_hallucinated: bool = False,
) -> str:
    """
    Create the top status bar.
    
    Args:
        hp: Current HP
        max_hp: Maximum HP
        o2: Oxygen percentage
        location: Current location name
        inventory_count: Number of items
        setting_name: Ship/station name
        elapsed_time: Session elapsed time
        is_hallucinated: Whether current location is LLM-hallucinated (not in scenario)
    
    Returns:
        Formatted status bar string
    """
    # HP indicator with color
    hp_color = "success" if hp > max_hp * 0.5 else "highlight" if hp > max_hp * 0.25 else "danger"
    hp_str = f"[{hp_color}]HP {hp}/{max_hp}[/{hp_color}]"
    
    # O2 indicator
    o2_color = "info" if o2 > 50 else "highlight" if o2 > 25 else "danger"
    o2_str = f"[{o2_color}]O₂ {o2}%[/{o2_color}]"
    
    # Location (with hallucination warning if applicable)
    if is_hallucinated:
        loc_str = f"[warning]⚠ {location}[/warning] [dim italic][Zone non cartographiée][/dim italic]"
    else:
        loc_str = f"[text.bright]⚔ {location}[/text.bright]"
    
    # Inventory
    inv_str = f"[item]🎒 {inventory_count} objets[/item]"
    
    # Right side
    right_str = f"[dim]{setting_name}[/dim] │ [dim]{elapsed_time}[/dim]"
    
    return f"  {hp_str} │ {o2_str} │ {loc_str} │ {inv_str}                {right_str}"


def create_divider(width: int | None = None, char: str = "─") -> str:
    """Create a horizontal divider line."""
    if width is None:
        console = get_console()
        width = console.size.width
    return char * width


def create_prompt_area() -> Panel:
    """Create the input prompt area."""
    return Panel(
        "[highlight]Que faites-vous ?[/highlight]",
        border_style="border",
        padding=(0, 2),
    )


def create_help_bar() -> str:
    """Create the bottom help bar."""
    return "[dim][TAB] Suggestions  │  [i] Inventaire  │  [m] Carte  │  [?] Aide[/dim]"


def center_text(text: str, width: int | None = None) -> str:
    """Center text within given width."""
    if width is None:
        console = get_console()
        width = console.size.width
    
    # Strip Rich markup for length calculation (simplified)
    clean_text = text
    for tag in ["[", "]"]:
        if tag in clean_text:
            # Very simple cleanup - won't handle all cases
            pass
    
    padding = max(0, (width - len(text)) // 2)
    return " " * padding + text


def wrap_narrative(text: str, width: int) -> list[str]:
    """
    Wrap narrative text to fit within width.
    
    Args:
        text: Text to wrap
        width: Maximum line width
    
    Returns:
        List of wrapped lines
    """
    words = text.split()
    lines = []
    current_line = []
    current_length = 0
    
    for word in words:
        word_length = len(word)
        
        if current_length + word_length + len(current_line) <= width:
            current_line.append(word)
            current_length += word_length
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]
            current_length = word_length
    
    if current_line:
        lines.append(" ".join(current_line))
    
    return lines
