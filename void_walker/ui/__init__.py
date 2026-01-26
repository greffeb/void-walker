"""Void Walker - UI module."""

from void_walker.ui.terminal import (
    ANSI,
    apply_ansi,
    check_terminal_capabilities,
    cleanup_terminal,
    clear_screen,
    get_console,
    get_terminal_size,
    setup_terminal,
    terminal_session,
)
from void_walker.ui.layout import (
    Layout,
    calculate_layout,
    center_text,
    create_divider,
    create_help_bar,
    create_prompt_area,
    create_status_bar,
    wrap_narrative,
)
from void_walker.ui.panels import (
    create_character_panel,
    create_help_panel,
    create_inventory_panel,
    create_map_panel,
    create_scene_elements_panel,
    create_suggestions_panel,
)
from void_walker.ui.dice_animation import (
    animate_dice_roll,
    display_dice_result_static,
)
from void_walker.ui.input import (
    CommandType,
    InputHistory,
    ParsedInput,
    get_player_input,
    parse_input,
    validate_action,
)
from void_walker.ui.text import (
    blink_text,
    create_alert_text,
    format_damage_message,
    format_heal_message,
    format_item_message,
    format_narrative,
    progressive_text,
    typewriter_text,
)
from void_walker.ui.spinner import (
    CPUSpinner,
)
from void_walker.ui.scenario_manager import (
    show_scenario_manager,
)

__all__ = [
    # Terminal
    "ANSI",
    "apply_ansi",
    "check_terminal_capabilities",
    "cleanup_terminal",
    "clear_screen",
    "get_console",
    "get_terminal_size",
    "setup_terminal",
    "terminal_session",
    # Layout
    "Layout",
    "calculate_layout",
    "center_text",
    "create_divider",
    "create_help_bar",
    "create_prompt_area",
    "create_status_bar",
    "wrap_narrative",
    # Panels
    "create_character_panel",
    "create_help_panel",
    "create_inventory_panel",
    "create_map_panel",
    "create_scene_elements_panel",
    "create_suggestions_panel",
    # Dice
    "animate_dice_roll",
    "display_dice_result_static",
    # Input
    "CommandType",
    "InputHistory",
    "ParsedInput",
    "get_player_input",
    "parse_input",
    "validate_action",
    # Text
    "blink_text",
    "create_alert_text",
    "format_damage_message",
    "format_heal_message",
    "format_item_message",
    "format_narrative",
    "progressive_text",
    "typewriter_text",
    # Spinner
    "CPUSpinner",
    # Scenario Manager
    "show_scenario_manager",
]
