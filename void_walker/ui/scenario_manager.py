"""
Void Walker - Scenario Manager UI.

Provides a UI for browsing, viewing, and managing saved scenarios.
"""

from pathlib import Path

from rich.console import Console

from void_walker.core.state import Scenario
from void_walker.ui import clear_screen, create_divider, get_player_input
from void_walker.utils import (
    ScenarioMetadata,
    delete_scenario,
    list_saved_scenarios,
    load_scenario,
)


async def show_scenario_manager(console: Console) -> Scenario | None:
    """
    Show the scenario manager interface.

    Allows user to:
    - Browse all saved scenarios
    - View scenario details
    - Load a scenario to play
    - Delete scenarios
    - Generate new scenario

    Args:
        console: Rich console for output

    Returns:
        Selected Scenario to play, or None to generate new
    """
    while True:
        clear_screen()

        console.print("\n[text.bright]GESTIONNAIRE DE SCÉNARIOS[/text.bright]\n")
        console.print(create_divider())

        # List all saved scenarios
        scenarios = list_saved_scenarios()

        if not scenarios:
            console.print("\n[dim]Aucun scénario sauvegardé trouvé.[/dim]")
            console.print("[text]Générez votre premier scénario !\n[/text]")
            console.print("  [highlight]N[/highlight]. Générer un Nouveau Scénario\n")
            console.print("  [highlight]Q[/highlight]. Retour\n")
            console.print(create_divider())

            choice = await get_player_input("\nChoix: ")
            choice = choice.strip().lower()

            if choice in ("n", "new", "nouveau"):
                return None  # Signal to generate new
            elif choice in ("q", "quit", "retour"):
                return None
            else:
                console.print("[danger]Choix invalide.[/danger]")
                await get_player_input("[dim]Appuyez sur Entrée...[/dim]")
                continue

        # Display scenarios
        console.print(f"\n[text]Scénarios sauvegardés ({len(scenarios)} total):\n[/text]")

        for i, meta in enumerate(scenarios, 1):
            time_str = meta.saved_at.strftime("%d/%m/%Y %H:%M")

            console.print(
                f"  [highlight]{i:2d}[/highlight]. [text.bright]{meta.title}[/text.bright]"
            )
            console.print(
                f"      [dim]{meta.setting_type} | "
                f"{meta.location_count} lieux | "
                f"Difficulté: {meta.estimated_difficulty} | "
                f"{time_str}[/dim]"
            )

        console.print()
        console.print(create_divider())
        console.print()
        console.print("[text]Actions disponibles:[/text]")
        console.print(
            f"  [highlight]1-{len(scenarios)}[/highlight] - Sélectionner un scénario"
        )
        console.print("  [highlight]N[/highlight] - Générer un Nouveau Scénario")
        console.print("  [highlight]Q[/highlight] - Retour")
        console.print()
        console.print(create_divider())

        choice = await get_player_input("\nChoix: ")
        choice = choice.strip().lower()

        # Handle special commands
        if choice in ("n", "new", "nouveau"):
            return None  # Signal to generate new
        elif choice in ("q", "quit", "retour"):
            return None

        # Handle scenario selection
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(scenarios):
                selected = scenarios[idx]
                # Show scenario detail menu
                result = await _show_scenario_detail(console, selected)
                if result is not None:
                    return result  # User chose to play this scenario
                # Otherwise loop back to main menu
            else:
                console.print("[danger]Numéro invalide.[/danger]")
                await get_player_input("[dim]Appuyez sur Entrée...[/dim]")
        except ValueError:
            console.print("[danger]Choix invalide.[/danger]")
            await get_player_input("[dim]Appuyez sur Entrée...[/dim]")


async def _show_scenario_detail(
    console: Console,
    meta: ScenarioMetadata,
) -> Scenario | None:
    """
    Show detailed view of a scenario with actions.

    Args:
        console: Rich console for output
        meta: Scenario metadata

    Returns:
        Loaded Scenario if user chose to play, None otherwise
    """
    while True:
        clear_screen()

        # Load full scenario to show details
        try:
            scenario = load_scenario(meta.file_path)
        except Exception as e:
            console.print(f"\n[danger]Erreur lors du chargement: {e}[/danger]")
            await get_player_input("[dim]Appuyez sur Entrée...[/dim]")
            return None

        # Display scenario details
        console.print(f"\n[text.bright]{scenario.title}[/text.bright]")
        console.print(f"[dim]{scenario.setting_name}[/dim]\n")
        console.print(create_divider())
        console.print()

        # Show premise
        console.print("[highlight]Histoire:[/highlight]")
        console.print(f"[text]{scenario.premise}[/text]")
        console.print()

        # Show metadata
        console.print("[highlight]Détails:[/highlight]")
        console.print(f"  [text]Type: {scenario.setting_type}[/text]")
        console.print(f"  [text]Menace: {scenario.main_threat}[/text]")
        console.print(f"  [text]Lieux: {len(scenario.locations)}[/text]")
        console.print(f"  [text]PNJs: {len(scenario.npcs)}[/text]")
        console.print(f"  [text]Secrets: {len(scenario.secrets)}[/text]")
        console.print(f"  [text]Difficulté: {meta.estimated_difficulty}[/text]")
        console.print(f"  [text]Sauvegardé: {meta.saved_at.strftime('%d/%m/%Y à %H:%M')}[/text]")
        console.print()

        # Show victory condition
        console.print("[highlight]Condition de victoire:[/highlight]")
        if isinstance(scenario.victory_condition, dict):
            victory = scenario.victory_condition.get("description", "Non définie")
        else:
            victory = (
                scenario.victory_condition.description
                if hasattr(scenario.victory_condition, "description")
                else "Non définie"
            )
        console.print(f"[text]{victory}[/text]")
        console.print()

        # Show validation warnings if any
        if scenario.validation_warnings:
            console.print("[highlight]Avertissements:[/highlight]")
            for warning in scenario.validation_warnings[:3]:  # Show first 3
                console.print(f"  [dim]⚠ {warning}[/dim]")
            if len(scenario.validation_warnings) > 3:
                remaining = len(scenario.validation_warnings) - 3
                console.print(f"  [dim]... et {remaining} autre(s)[/dim]")
            console.print()

        console.print(create_divider())
        console.print()
        console.print("[text]Actions:[/text]")
        console.print("  [highlight]P[/highlight] - Jouer avec ce scénario")
        console.print("  [highlight]V[/highlight] - Voir le JSON brut")
        console.print("  [highlight]D[/highlight] - Supprimer ce scénario")
        console.print("  [highlight]R[/highlight] - Retour à la liste")
        console.print()
        console.print(create_divider())

        choice = await get_player_input("\nChoix: ")
        choice = choice.strip().lower()

        if choice in ("p", "play", "jouer"):
            return scenario
        elif choice in ("v", "view", "voir"):
            await _show_raw_json(console, meta.file_path)
        elif choice in ("d", "delete", "supprimer"):
            if await _confirm_delete(console, scenario.title):
                if delete_scenario(meta.file_path):
                    console.print("\n[success]Scénario supprimé avec succès![/success]")
                else:
                    console.print("\n[danger]Erreur lors de la suppression.[/danger]")
                await get_player_input("[dim]Appuyez sur Entrée...[/dim]")
                return None  # Exit to main menu
            # Otherwise loop back to detail view
        elif choice in ("r", "retour", "back"):
            return None  # Exit to main menu
        else:
            console.print("[danger]Choix invalide.[/danger]")
            await get_player_input("[dim]Appuyez sur Entrée...[/dim]")


async def _show_raw_json(console: Console, scenario_path: Path) -> None:
    """
    Display the raw JSON content of a scenario file.

    Args:
        console: Rich console for output
        scenario_path: Path to scenario JSON file
    """
    clear_screen()

    console.print("\n[text.bright]CONTENU JSON BRUT[/text.bright]\n")
    console.print(create_divider())
    console.print()

    try:
        with open(scenario_path, encoding="utf-8") as f:
            content = f.read()

        # Display with syntax highlighting
        from rich.syntax import Syntax

        syntax = Syntax(
            content,
            "json",
            theme="monokai",
            line_numbers=True,
            word_wrap=True,
        )

        console.print(syntax)
        console.print()
        console.print(create_divider())
        console.print(f"\n[dim]Fichier: {scenario_path}[/dim]")

    except Exception as e:
        console.print(f"[danger]Erreur lors de la lecture: {e}[/danger]")

    console.print()
    await get_player_input("[dim]Appuyez sur Entrée pour retour...[/dim]")


async def _confirm_delete(console: Console, scenario_title: str) -> bool:
    """
    Ask user to confirm scenario deletion.

    Args:
        console: Rich console for output
        scenario_title: Title of scenario to delete

    Returns:
        True if user confirms, False otherwise
    """
    console.print()
    console.print(f"[danger]⚠ Confirmer la suppression de '{scenario_title}' ?[/danger]")
    console.print("[dim]Cette action est irréversible.[/dim]")

    response = await get_player_input("\n[highlight]Supprimer ? (o/n):[/highlight] ")
    return response.strip().lower() in ("o", "oui", "y", "yes")
