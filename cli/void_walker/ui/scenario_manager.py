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
    list_preset_scenarios,
    list_saved_scenarios,
    load_scenario,
)


async def show_scenario_manager(console: Console) -> Scenario | None:
    """
    Show the scenario manager interface.

    Allows user to:
    - Browse preset scenarios
    - Browse saved scenarios
    - View scenario details
    - Load a scenario to play
    - Delete saved scenarios
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

        # List preset scenarios
        presets = list_preset_scenarios()

        # List user saved scenarios
        scenarios = list_saved_scenarios()

        # Build combined list with markers
        all_scenarios = []
        scenario_index_map = []  # Map display index to (type, actual_index)

        # Add presets first
        if presets:
            console.print("\n[text.bright]📚 Scénarios Prédéfinis:[/text.bright]\n")
            for i, meta in enumerate(presets):
                display_idx = len(all_scenarios) + 1
                all_scenarios.append(meta)
                scenario_index_map.append(("preset", i, False))  # Not deletable

                console.print(
                    f"  [highlight]{display_idx:2d}[/highlight]. "
                    f"[text.bright]{meta.title}[/text.bright] [dim](prédéfini)[/dim]"
                )
                console.print(
                    f"      [dim]{meta.setting_type} | "
                    f"{meta.location_count} lieux | "
                    f"Difficulté: {meta.estimated_difficulty}[/dim]"
                )
            console.print()

        # Add user scenarios
        if scenarios:
            console.print("[text.bright]💾 Vos Scénarios:[/text.bright]\n")
            for i, meta in enumerate(scenarios):
                display_idx = len(all_scenarios) + 1
                all_scenarios.append(meta)
                scenario_index_map.append(("user", i, True))  # Deletable

                time_str = meta.saved_at.strftime("%d/%m/%Y %H:%M")
                console.print(
                    f"  [highlight]{display_idx:2d}[/highlight]. "
                    f"[text.bright]{meta.title}[/text.bright]"
                )
                console.print(
                    f"      [dim]{meta.setting_type} | "
                    f"{meta.location_count} lieux | "
                    f"Difficulté: {meta.estimated_difficulty} | "
                    f"{time_str}[/dim]"
                )
            console.print()

        if not all_scenarios:
            console.print("\n[dim]Aucun scénario disponible.[/dim]")
            console.print("[text]Générez votre premier scénario !\n[/text]")

        console.print(create_divider())
        console.print()
        console.print("[text]Actions disponibles:[/text]")
        if all_scenarios:
            console.print(
                f"  [highlight]1-{len(all_scenarios)}[/highlight] - "
                "Sélectionner un scénario"
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
            if 0 <= idx < len(all_scenarios):
                selected = all_scenarios[idx]
                scenario_type, _, is_deletable = scenario_index_map[idx]
                # Show scenario detail menu
                result = await _show_scenario_detail(
                    console, selected, is_deletable
                )
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
    is_deletable: bool = True,
) -> Scenario | None:
    """
    Show detailed view of a scenario with actions.

    Args:
        console: Rich console for output
        meta: Scenario metadata
        is_deletable: Whether the scenario can be deleted (False for presets)

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
        console.print("  [highlight]F[/highlight] - Lire le scénario complet (spoilers!)")
        console.print("  [highlight]V[/highlight] - Voir le JSON brut")
        if is_deletable:
            console.print("  [highlight]D[/highlight] - Supprimer ce scénario")
        console.print("  [highlight]R[/highlight] - Retour à la liste")
        console.print()
        console.print(create_divider())

        choice = await get_player_input("\nChoix: ")
        choice = choice.strip().lower()

        if choice in ("p", "play", "jouer"):
            return scenario
        elif choice in ("f", "full", "complet"):
            await _show_full_scenario_details(console, scenario)
        elif choice in ("v", "view", "voir"):
            await _show_raw_json(console, meta.file_path)
        elif choice in ("d", "delete", "supprimer"):
            if not is_deletable:
                console.print(
                    "\n[danger]Les scénarios prédéfinis ne peuvent pas être supprimés.[/danger]"
                )
                await get_player_input("[dim]Appuyez sur Entrée...[/dim]")
                continue
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


async def _show_full_scenario_details(console: Console, scenario: Scenario) -> None:
    """
    Display complete scenario details including all locations, NPCs, and secrets.

    ⚠️ SPOILERS: This shows everything about the scenario!

    Args:
        console: Rich console for output
        scenario: The scenario to display
    """
    clear_screen()

    console.print("\n[text.bright]DÉTAILS COMPLETS DU SCÉNARIO[/text.bright]")
    console.print("[danger]⚠️ ATTENTION: SPOILERS![/danger]\n")
    console.print(create_divider())
    console.print()

    # Basic info
    console.print(f"[text.bright]Titre:[/text.bright] {scenario.title}")
    console.print(f"[text.bright]Lieu:[/text.bright] {scenario.setting_name}")
    console.print(f"[text.bright]Type:[/text.bright] {scenario.setting_type}")
    console.print(f"[text.bright]Menace:[/text.bright] {scenario.main_threat}")
    console.print()

    # Premise
    console.print("[text.bright]Histoire:[/text.bright]")
    console.print(f"[text]{scenario.premise}[/text]")
    console.print()

    # Victory condition
    console.print("[text.bright]Condition de victoire:[/text.bright]")
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

    console.print(create_divider())
    console.print()

    # Locations
    console.print(f"[text.bright]LIEUX ({len(scenario.locations)}):[/text.bright]\n")
    for i, location in enumerate(scenario.locations, 1):
        console.print(f"[highlight]{i}. {location.name}[/highlight] [dim]({location.id})[/dim]")
        console.print(f"   [text]{location.description[:150]}...[/text]")
        console.print(f"   [dim]Connexions: {', '.join(location.connections)}[/dim]")
        if location.items:
            console.print(f"   [item]Items: {', '.join(location.items)}[/item]")
        console.print()

    console.print(create_divider())
    console.print()

    # NPCs
    console.print(f"[text.bright]PNJs ({len(scenario.npcs)}):[/text.bright]\n")
    for i, npc in enumerate(scenario.npcs, 1):
        console.print(f"[highlight]{i}. {npc.name}[/highlight] [dim]({npc.id})[/dim]")
        console.print(f"   [text]{npc.description}[/text]")
        console.print(f"   [dim]Position: {npc.location} | État: {'Vivant' if npc.is_alive else 'Mort'}[/dim]")
        if npc.motivation:
            console.print(f"   [text]Motivation: {npc.motivation}[/text]")
        if npc.knowledge:
            console.print(f"   [info]Connaissances: {', '.join(npc.knowledge)}[/info]")
        console.print()

    console.print(create_divider())
    console.print()

    # Secrets
    console.print(f"[text.bright]SECRETS ({len(scenario.secrets)}):[/text.bright]\n")
    for i, secret in enumerate(scenario.secrets, 1):
        console.print(f"[highlight]{i}. {secret.id}[/highlight]")
        console.print(f"   [text]{secret.description}[/text]")
        console.print(f"   [dim]Lieu: {secret.location}[/dim]")
        if secret.discovery_method:
            console.print(f"   [info]Méthode: {secret.discovery_method}[/info]")
        if secret.rewards:
            console.print(f"   [success]Récompenses: {', '.join(secret.rewards)}[/success]")
        console.print()

    console.print(create_divider())
    await get_player_input("\n[dim]Appuyez sur Entrée pour retour...[/dim]")


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
