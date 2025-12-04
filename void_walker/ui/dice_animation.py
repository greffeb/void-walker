"""
Void Walker - Dice Animation.

Animated dice roll display with suspense.
"""

import asyncio
import random

from rich.align import Align
from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.text import Text

from void_walker.core.dice import CheckResult, DiceResult
from void_walker.ui.terminal import get_console


# Dice face representations
DICE_FACES = {
    1: ["┌─────────┐", "│         │", "│    ●    │", "│         │", "└─────────┘"],
    2: ["┌─────────┐", "│  ●      │", "│         │", "│      ●  │", "└─────────┘"],
    3: ["┌─────────┐", "│  ●      │", "│    ●    │", "│      ●  │", "└─────────┘"],
    4: ["┌─────────┐", "│  ●   ●  │", "│         │", "│  ●   ●  │", "└─────────┘"],
    5: ["┌─────────┐", "│  ●   ●  │", "│    ●    │", "│  ●   ●  │", "└─────────┘"],
    6: ["┌─────────┐", "│  ●   ●  │", "│  ●   ●  │", "│  ●   ●  │", "└─────────┘"],
}


def get_dice_display(value: int, spinning: bool = False) -> Text:
    """
    Get ASCII art dice display.

    For d20, we show a simplified representation.
    """
    # For d20, show the number in the center
    if spinning:
        style = "dim"
    else:
        if value == 20:
            style = "success bold"
        elif value == 1:
            style = "danger bold"
        else:
            style = "text.bright"

    num_str = str(value).center(3)

    dice_text = Text()
    dice_text.append(f"┌─────────┐\n", style=style)
    dice_text.append(f"│         │\n", style=style)
    dice_text.append(f"│   {num_str}   │\n", style=style)
    dice_text.append(f"│         │\n", style=style)
    dice_text.append(f"└─────────┘", style=style)

    return dice_text


def create_roll_display(
    result: DiceResult,
    phase: str = "result",
    spinning_value: int | None = None,
) -> Text:
    """
    Create the complete roll display.
    
    Args:
        result: The dice roll result
        phase: Display phase ("spinning", "reveal", "result")
        spinning_value: Value to show while spinning
    
    Returns:
        Rich Text with the display
    """
    text = Text()
    
    if phase == "spinning" and spinning_value is not None:
        # Show spinning dice
        text.append(get_dice_display(spinning_value, spinning=True))
        text.append(f"\n                    {spinning_value}...", style="dim")
    else:
        # Show final result
        text.append(get_dice_display(result.roll))
        text.append("\n")
        
        # Roll breakdown
        text.append(f"                    Jet de dé: ", style="text")
        
        if result.roll == 20:
            text.append(f"{result.roll}", style="success bold")
        elif result.roll == 1:
            text.append(f"{result.roll}", style="danger bold")
        else:
            text.append(f"{result.roll}", style="text.bright")
        
        text.append("\n")
        
        # Calculation
        mod_sign = "+" if result.modifier >= 0 else ""
        text.append(
            f"                    {result.stat} ({result.stat_value}) "
            f"{mod_sign}{result.modifier} = +{result.stat_value + result.modifier}\n",
            style="dim"
        )
        text.append("                    ─────────────────────\n", style="border")
        text.append(f"                    Total: ", style="text")
        text.append(f"{result.total}", style="text.bright")
        text.append(f" vs Difficulté ", style="text")
        text.append(f"{result.difficulty}\n\n", style="text.bright")
        
        # Outcome
        if result.outcome == CheckResult.CRITICAL_SUCCESS:
            text.append("                    ✓ SUCCÈS CRITIQUE !", style="success bold")
        elif result.outcome == CheckResult.SUCCESS:
            text.append("                    ✓ SUCCÈS", style="success")
        elif result.outcome == CheckResult.FAILURE:
            text.append("                    ✗ ÉCHEC", style="danger")
        else:  # CRITICAL_FAILURE
            text.append("                    ✗ ÉCHEC CRITIQUE !", style="danger bold")
    
    return text


async def animate_dice_roll(result: DiceResult, console: Console | None = None) -> None:
    """
    Display animated dice roll with suspense.
    
    Total duration: ~2 seconds
    
    Args:
        result: The final dice result
        console: Console to use (defaults to global)
    """
    if console is None:
        console = get_console()
    
    # Phase 1: Rapid cycling (1 second)
    with Live(console=console, refresh_per_second=20) as live:
        for _ in range(20):
            fake = random.randint(1, 20)
            display = create_roll_display(result, phase="spinning", spinning_value=fake)
            live.update(Align.center(display))
            await asyncio.sleep(0.05)
        
        # Phase 2: Slowing down (0.7 seconds)
        delays = [0.1, 0.12, 0.15, 0.2, 0.25]
        for delay in delays:
            fake = random.randint(1, 20)
            display = create_roll_display(result, phase="spinning", spinning_value=fake)
            live.update(Align.center(display))
            await asyncio.sleep(delay)
        
        # Phase 3: Final reveal (0.3 seconds)
        await asyncio.sleep(0.3)
        display = create_roll_display(result, phase="result")
        live.update(Align.center(display))
    
    # Hold final result for a moment
    await asyncio.sleep(1.0)


def display_dice_result_static(result: DiceResult, console: Console | None = None) -> None:
    """
    Display dice result without animation (for debug mode).
    
    Args:
        result: The dice result
        console: Console to use
    """
    if console is None:
        console = get_console()
    
    display = create_roll_display(result, phase="result")
    console.print(Align.center(display))
