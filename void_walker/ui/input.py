"""
Void Walker - Input Handling.

Command parsing and input utilities.
"""

from dataclasses import dataclass
from enum import Enum, auto


class CommandType(Enum):
    """Types of special commands."""
    
    QUIT = auto()
    HELP = auto()
    INVENTORY = auto()
    MAP = auto()
    SUGGESTIONS = auto()
    ACTION = auto()  # Regular gameplay action


@dataclass
class ParsedInput:
    """Parsed player input."""
    
    command_type: CommandType
    raw_input: str
    action_text: str | None = None


# Quick command mappings
QUICK_COMMANDS: dict[str, CommandType] = {
    "q": CommandType.QUIT,
    "quit": CommandType.QUIT,
    "quitter": CommandType.QUIT,
    "exit": CommandType.QUIT,
    "?": CommandType.HELP,
    "h": CommandType.HELP,
    "help": CommandType.HELP,
    "aide": CommandType.HELP,
    "i": CommandType.INVENTORY,
    "inv": CommandType.INVENTORY,
    "inventaire": CommandType.INVENTORY,
    "inventory": CommandType.INVENTORY,
    "m": CommandType.MAP,
    "map": CommandType.MAP,
    "carte": CommandType.MAP,
}


def parse_input(raw_input: str) -> ParsedInput:
    """
    Parse player input into a command.
    
    Args:
        raw_input: Raw input string from player
    
    Returns:
        ParsedInput with command type and details
    """
    stripped = raw_input.strip()
    lower = stripped.lower()
    
    # Check for quick commands
    if lower in QUICK_COMMANDS:
        return ParsedInput(
            command_type=QUICK_COMMANDS[lower],
            raw_input=raw_input,
        )
    
    # Tab key is handled separately at input level
    # Everything else is a gameplay action
    return ParsedInput(
        command_type=CommandType.ACTION,
        raw_input=raw_input,
        action_text=stripped if stripped else None,
    )


def validate_action(action: str) -> tuple[bool, str | None]:
    """
    Validate a gameplay action.
    
    Args:
        action: The action text
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not action or not action.strip():
        return False, "Veuillez entrer une action."
    
    if len(action) > 500:
        return False, "Action trop longue. Soyez plus concis."
    
    # Check for obviously problematic input
    if action.strip() in ["...", "???", "!!!"]:
        return False, "Décrivez ce que vous voulez faire."
    
    return True, None


class InputHistory:
    """Tracks command history for up/down navigation."""
    
    def __init__(self, max_size: int = 50):
        self.history: list[str] = []
        self.max_size = max_size
        self.position = 0
    
    def add(self, command: str) -> None:
        """Add a command to history."""
        if command and command.strip():
            # Don't add duplicates of the last command
            if not self.history or self.history[-1] != command:
                self.history.append(command)
                if len(self.history) > self.max_size:
                    self.history.pop(0)
        self.position = len(self.history)
    
    def previous(self) -> str | None:
        """Get previous command in history."""
        if self.history and self.position > 0:
            self.position -= 1
            return self.history[self.position]
        return None
    
    def next(self) -> str | None:
        """Get next command in history."""
        if self.position < len(self.history) - 1:
            self.position += 1
            return self.history[self.position]
        elif self.position == len(self.history) - 1:
            self.position = len(self.history)
            return ""
        return None
    
    def reset_position(self) -> None:
        """Reset position to end of history."""
        self.position = len(self.history)


async def get_player_input(prompt: str = "> ") -> str:
    """
    Get input from player asynchronously.
    
    This is a simple wrapper - in the full implementation,
    this would handle special keys, history, etc.
    
    Args:
        prompt: Input prompt to display
    
    Returns:
        Player's input string
    """
    import asyncio
    from void_walker.ui.terminal import get_console
    
    console = get_console()
    
    # Check if prompt contains Rich markup
    if "[" in prompt and "]" in prompt:
        # Print styled prompt, then get plain input
        console.print(prompt, end="")
        plain_prompt = ""
    else:
        plain_prompt = prompt
    
    # Simple async input
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: input(plain_prompt))
