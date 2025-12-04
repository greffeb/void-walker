"""
Void Walker - Terminal UI Setup.

Terminal initialization, colors, and cleanup utilities.
"""

import os
import sys
from contextlib import contextmanager

from rich.console import Console
from rich.theme import Theme

from void_walker.config import COLORS, TERMINAL_MIN_HEIGHT, TERMINAL_MIN_WIDTH


# Create custom theme from color palette
VOID_WALKER_THEME = Theme({
    "text": COLORS["text"],
    "text.bright": COLORS["text_bright"],
    "danger": COLORS["danger"],
    "success": COLORS["success"],
    "info": COLORS["info"],
    "highlight": COLORS["highlight"],
    "item": COLORS["item"],
    "border": COLORS["border"],
    "dim": COLORS["dim"],
    "hp": COLORS["hp_bar"],
    "o2": COLORS["o2_bar"],
})

# Global console instance
_console: Console | None = None


def get_console() -> Console:
    """Get or create the global console instance."""
    global _console
    if _console is None:
        _console = Console(theme=VOID_WALKER_THEME, force_terminal=True)
    return _console


def setup_terminal() -> Console:
    """
    Set up the terminal for the game.
    
    Returns:
        Configured Console instance
    """
    console = get_console()
    
    # Check terminal size
    width, height = console.size
    if width < TERMINAL_MIN_WIDTH or height < TERMINAL_MIN_HEIGHT:
        console.print(
            f"[danger]⚠ Terminal trop petit![/danger]\n"
            f"Taille actuelle: {width}x{height}\n"
            f"Taille minimale: {TERMINAL_MIN_WIDTH}x{TERMINAL_MIN_HEIGHT}\n"
            f"Veuillez agrandir votre terminal.",
            style="danger"
        )
    
    # Clear screen and hide cursor
    console.clear()
    
    # Set terminal title if possible
    if sys.platform == "win32":
        os.system("title Void Walker")
    else:
        console.print("\033]0;Void Walker\007", end="")
    
    return console


def cleanup_terminal() -> None:
    """Clean up terminal state on exit."""
    console = get_console()
    
    # Show cursor
    console.show_cursor(True)
    
    # Reset any styling
    console.print()


@contextmanager
def terminal_session():
    """Context manager for terminal session."""
    console = setup_terminal()
    try:
        yield console
    finally:
        cleanup_terminal()


def check_terminal_capabilities() -> dict:
    """
    Check terminal capabilities.
    
    Returns:
        Dictionary of capability checks
    """
    console = get_console()
    
    return {
        "width": console.size.width,
        "height": console.size.height,
        "color_system": console.color_system,
        "is_terminal": console.is_terminal,
        "encoding": console.encoding,
        "size_ok": (
            console.size.width >= TERMINAL_MIN_WIDTH and
            console.size.height >= TERMINAL_MIN_HEIGHT
        ),
    }


def clear_screen() -> None:
    """Clear the terminal screen."""
    console = get_console()
    console.clear()


def get_terminal_size() -> tuple[int, int]:
    """Get current terminal size (width, height)."""
    console = get_console()
    return console.size.width, console.size.height


# ANSI escape codes for advanced effects
ANSI = {
    "reset": "\033[0m",
    "bold": "\033[1m",
    "dim": "\033[2m",
    "italic": "\033[3m",
    "underline": "\033[4m",
    "blink": "\033[5m",
    "reverse": "\033[7m",
    "hidden": "\033[8m",
    "strikethrough": "\033[9m",
}


def apply_ansi(text: str, *effects: str) -> str:
    """
    Apply ANSI effects to text.
    
    Args:
        text: Text to style
        *effects: Effect names from ANSI dict
    
    Returns:
        Styled text with reset at end
    """
    codes = "".join(ANSI.get(e, "") for e in effects)
    return f"{codes}{text}{ANSI['reset']}"
