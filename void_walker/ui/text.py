"""
Void Walker - Text Rendering.

Text effects, progressive display, and blinking alerts.
"""

import asyncio

from rich.align import Align
from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.text import Text

from void_walker.ui.terminal import ANSI, get_console


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

    Args:
        narrative: The narrative text
        tension_level: Current tension level (1-10)

    Returns:
        Formatted Rich Text
    """
    text = Text()

    # Base style depends on tension
    if tension_level >= 8:
        base_style = "text.bright"
    elif tension_level >= 5:
        base_style = "text"
    else:
        base_style = "dim"

    # Split into sentences for potential highlighting
    sentences = narrative.replace("\n", " \n ").split(". ")

    for i, sentence in enumerate(sentences):
        if not sentence.strip():
            continue

        sentence = sentence.strip()

        # Highlight danger words
        danger_words = ["danger", "menace", "mort", "sang", "blessure", "alerte", "attention"]
        has_danger = any(word in sentence.lower() for word in danger_words)

        if has_danger and tension_level >= 6:
            text.append(sentence, style="danger")
        else:
            text.append(sentence, style=base_style)

        if i < len(sentences) - 1:
            text.append(". ")

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

    Maintains all formatting (tension styling, danger highlighting)
    while revealing text character by character using Rich's Live display.

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

    # Build the text progressively
    current_text = Text()
    sentences = narrative.replace("\n", " \n ").split(". ")

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

        for sentence_idx, sentence in enumerate(sentences):
            if not sentence.strip():
                continue

            sentence = sentence.strip()

            # Check if sentence contains danger words
            has_danger = any(word in sentence.lower() for word in danger_words)
            style = "danger" if (has_danger and tension_level >= 6) else base_style

            # Add characters one by one
            for char in sentence:
                current_text.append(char, style=style)
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

            # Add period and space after sentence (if not last)
            if sentence_idx < len(sentences) - 1:
                current_text.append(". ")

            # Update display at end of sentence
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
