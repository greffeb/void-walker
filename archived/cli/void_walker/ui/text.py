"""
Void Walker - Text Rendering.

Text effects, progressive display, and blinking alerts.
"""

import asyncio
import re

from rich.align import Align
from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.text import Text

from void_walker.ui.terminal import ANSI, get_console


def parse_item_markup(text: str) -> Text:
    """
    Parse item markup in narrative text and return formatted Rich Text.
    
    Converts [ITEM:id]description[/ITEM] markers into Rich Text with "item" style.
    Markup is inclusive: all text between markers is highlighted regardless of
    exact match to the item id.
    
    Args:
        text: Text containing [ITEM:id]...[/ITEM] markers
    
    Returns:
        Rich Text with item markup highlighted in "item" style (orange)
    """
    result = Text()
    
    # Pattern to match [ITEM:id]...[/ITEM]
    pattern = r'\[ITEM:[^\]]+\](.*?)\[/ITEM\]'
    
    last_end = 0
    for match in re.finditer(pattern, text):
        # Add text before the match
        if match.start() > last_end:
            result.append(text[last_end:match.start()])
        
        # Add the matched item text with item style
        item_text = match.group(1)
        result.append(item_text, style="item")
        
        last_end = match.end()
    
    # Add remaining text after last match
    if last_end < len(text):
        result.append(text[last_end:])
    
    return result


async def progressive_text(
    text: str,
    console: Console | None = None,
    delay: float = 0.02,
    style: str | None = None,
) -> None:
    """
    Display text progressively, character by character.
    
    Args:
        text: Text to display
        console: Console to use
        delay: Delay between characters
        style: Rich style to apply
    """
    if console is None:
        console = get_console()
    
    for char in text:
        if style:
            console.print(char, end="", style=style)
        else:
            console.print(char, end="")
        await asyncio.sleep(delay)
    
    console.print()  # Final newline


async def typewriter_text(
    text: str,
    console: Console | None = None,
    char_delay: float = 0.03,
    word_delay: float = 0.1,
    sentence_delay: float = 0.3,
) -> None:
    """
    Display text with typewriter effect.
    
    Pauses at punctuation for dramatic effect.
    
    Args:
        text: Text to display
        console: Console to use
        char_delay: Delay between regular characters
        word_delay: Delay after spaces
        sentence_delay: Delay after sentence-ending punctuation
    """
    if console is None:
        console = get_console()
    
    for i, char in enumerate(text):
        console.print(char, end="")
        
        if char in ".!?":
            await asyncio.sleep(sentence_delay)
        elif char == " ":
            await asyncio.sleep(word_delay)
        elif char == ",":
            await asyncio.sleep(word_delay * 1.5)
        else:
            await asyncio.sleep(char_delay)
    
    console.print()


def blink_text(text: str, color: str = "red") -> str:
    """
    Return text with ANSI blink escape codes.
    
    Use sparingly for danger/alerts only.
    
    Args:
        text: Text to make blink
        color: Color name
    
    Returns:
        Text with blink codes
    """
    color_codes = {
        "red": "\033[31m",
        "yellow": "\033[33m",
        "green": "\033[32m",
        "cyan": "\033[36m",
    }
    
    color_code = color_codes.get(color, "")
    return f"{ANSI['blink']}{color_code}{text}{ANSI['reset']}"


def create_alert_text(message: str, level: str = "warning") -> Text:
    """
    Create an alert text with appropriate styling.
    
    Args:
        message: Alert message
        level: Alert level ("info", "warning", "danger", "critical")
    
    Returns:
        Rich Text object
    """
    styles = {
        "info": ("info", "[INFO]"),
        "warning": ("highlight", "[ATTENTION]"),
        "danger": ("danger", "[ALERTE]"),
        "critical": ("danger bold", "[DANGER]"),
    }
    
    style, prefix = styles.get(level, styles["warning"])
    
    text = Text()
    text.append(f"\n{prefix} ", style=style)
    text.append(message, style=style)
    text.append("\n")
    
    return text


def format_narrative(
    narrative: str,
    tension_level: int = 5,
) -> Text:
    """
    Format narrative text with appropriate styling based on tension.
    
    Applies styling in order of priority:
    1. Item markup [ITEM:id]...[/ITEM] (orange, highest priority)
    2. Danger words highlighting (red)
    3. Tension-based base style (bright/normal/dim)

    Args:
        narrative: The narrative text
        tension_level: Current tension level (1-10)

    Returns:
        Formatted Rich Text
    """
    # First pass: parse item markup and build structure
    # We need to track which parts are items vs regular text
    item_pattern = r'\[ITEM:[^\]]+\](.*?)\[/ITEM\]'
    segments = []
    last_end = 0
    
    for match in re.finditer(item_pattern, narrative):
        # Add non-item segment before match
        if match.start() > last_end:
            segments.append(("text", narrative[last_end:match.start()]))
        
        # Add item segment
        item_text = match.group(1)
        segments.append(("item", item_text))
        
        last_end = match.end()
    
    # Add remaining non-item segment
    if last_end < len(narrative):
        segments.append(("text", narrative[last_end:]))
    
    # Base style depends on tension
    if tension_level >= 8:
        base_style = "text.bright"
    elif tension_level >= 5:
        base_style = "text"
    else:
        base_style = "dim"

    # Danger words for highlighting
    danger_words = ["danger", "menace", "mort", "sang", "blessure", "alerte", "attention"]
    
    # Build final text with all styling applied
    text = Text()
    for seg_type, seg_text in segments:
        if seg_type == "item":
            # Items are always highlighted in orange, regardless of danger words
            text.append(seg_text, style="item")
        else:
            # Regular text: check for danger words
            has_danger = any(word in seg_text.lower() for word in danger_words)
            if has_danger and tension_level >= 6:
                text.append(seg_text, style="danger")
            else:
                text.append(seg_text, style=base_style)
    
    return text


async def display_narrative_progressive(
    narrative: str,
    tension_level: int,
    console: Console,
    char_delay: float = 0.012,
    panel_width: int = 80,
) -> None:
    """
    Display narrative text progressively with typewriter effect.

    Maintains all formatting (tension styling, danger highlighting, item markup)
    while revealing text character by character using Rich's Live display.
    
    Item markup [ITEM:id]...[/ITEM] takes priority over danger highlighting.

    Args:
        narrative: The narrative text to display
        tension_level: Current tension level (1-10)
        console: Console to render to
        char_delay: Delay between characters (default: 0.012s = ~80 chars/sec)
        panel_width: Width of the panel
    """
    # Adjust speed based on text length for better UX
    text_length = len(narrative)
    if text_length < 100:
        char_delay = 0.015  # Slower for short text (engaging)
    elif text_length > 300:
        char_delay = 0.008  # Faster for long text (avoid tedium)

    # Determine base style based on tension
    if tension_level >= 8:
        base_style = "text.bright"
    elif tension_level >= 5:
        base_style = "text"
    else:
        base_style = "dim"

    # Danger words for highlighting
    danger_words = ["danger", "menace", "mort", "sang", "blessure", "alerte", "attention"]

    # Parse item markup to track which character ranges are items
    item_pattern = r'\[ITEM:[^\]]+\](.*?)\[/ITEM\]'
    item_ranges = []  # List of (start_pos, end_pos, is_item)
    
    # First, strip markup and track ranges
    stripped_narrative = narrative
    char_offset = 0
    
    for match in re.finditer(item_pattern, narrative):
        item_text = match.group(1)
        # Calculate position in stripped text
        stripped_start = match.start() - char_offset
        item_ranges.append((stripped_start, stripped_start + len(item_text), True))
        # Update offset for next match
        markup_len = match.end() - match.start() - len(item_text)
        char_offset += markup_len
    
    # Strip all markup from narrative
    stripped_narrative = re.sub(item_pattern, r'\1', narrative)

    # Build the text progressively
    current_text = Text()

    # Create initial empty panel
    panel = Panel(
        current_text,
        width=panel_width,
        padding=(1, 4),
        border_style="border",
    )
    centered_panel = Align.center(panel)

    with Live(centered_panel, console=console, refresh_per_second=30, transient=False) as live:
        char_count = 0

        for char in stripped_narrative:
            # Determine style for this character
            char_style = base_style
            
            # Check if this character is in an item range
            is_in_item = any(
                start <= char_count < end
                for start, end, is_item in item_ranges
                if is_item
            )
            
            if is_in_item:
                # Item markup takes priority over danger words
                char_style = "item"
            else:
                # Check for danger words only in non-item text
                # Build context around current position for word checking
                start_context = max(0, char_count - 20)
                end_context = min(len(stripped_narrative), char_count + 20)
                context = stripped_narrative[start_context:end_context].lower()
                
                has_danger = any(word in context for word in danger_words)
                if has_danger and tension_level >= 6:
                    char_style = "danger"
            
            current_text.append(char, style=char_style)
            char_count += 1

            # Only update display every few characters to reduce flicker
            # But always update on important punctuation
            if char_count % 2 == 0 or char in ".,!?;:":
                panel = Panel(
                    current_text,
                    width=panel_width,
                    padding=(1, 4),
                    border_style="border",
                )
                live.update(Align.center(panel))

            await asyncio.sleep(char_delay)

        # Final update with complete text
        panel = Panel(
            current_text,
            width=panel_width,
            padding=(1, 4),
            border_style="border",
        )
        live.update(Align.center(panel))


def format_damage_message(amount: int, source: str) -> Text:
    """
    Format a damage message.
    
    Args:
        amount: Damage amount
        source: Damage source
    
    Returns:
        Formatted damage message
    """
    text = Text()
    text.append(f"-{amount} HP", style="danger bold")
    text.append(f" ({source})", style="danger")
    return text


def format_heal_message(amount: int) -> Text:
    """
    Format a healing message.
    
    Args:
        amount: Heal amount
    
    Returns:
        Formatted heal message
    """
    text = Text()
    text.append(f"+{amount} HP", style="success bold")
    return text


def format_item_message(item_name: str, action: str = "obtained") -> Text:
    """
    Format an item-related message.
    
    Args:
        item_name: Name of the item
        action: Action ("obtained", "lost", "used")
    
    Returns:
        Formatted message
    """
    text = Text()
    
    if action == "obtained":
        text.append("Obtenu: ", style="success")
        text.append(item_name, style="item")
    elif action == "lost":
        text.append("Perdu: ", style="danger")
        text.append(item_name, style="item")
    elif action == "used":
        text.append("Utilisé: ", style="info")
        text.append(item_name, style="item")
    
    return text
