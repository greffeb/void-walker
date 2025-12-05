"""
Void Walker - Main Game Loop.

Contains the Game class that orchestrates the entire gameplay experience.
"""

import asyncio
from datetime import datetime
from typing import Literal

from rich.align import Align
from rich.console import Console
from rich.panel import Panel

from void_walker.config import SESSION_CONFIGS, get_settings
from void_walker.content.classes import create_player, get_class_names, CLASSES
from void_walker.core.dice import roll_check, DiceResult
from void_walker.core.guidance import GuidanceSystem
from void_walker.core.state import (
    GameResponse,
    GameState,
    SessionProgress,
    SessionScore,
)
from void_walker.llm.client import call_llm, LLMError
from void_walker.llm.intent import validate_player_intent, format_clarification_prompt
from void_walker.llm.parser import (
    parse_game_response,
    summarize_narrative,
    validate_game_response,
    ParseError,
)
from void_walker.llm.prompts import (
    build_gameplay_prompt,
    build_environment_prompt,
    build_location_name_prompt,
    build_npc_dialogue_prompt,
    get_exits_with_names,
)
from void_walker.llm.world_gen import create_fallback_scenario, generate_scenario
from void_walker.ui import (
    CommandType,
    CPUSpinner,
    animate_dice_roll,
    clear_screen,
    create_divider,
    create_help_bar,
    create_help_panel,
    create_inventory_panel,
    create_map_panel,
    create_status_bar,
    create_suggestions_panel,
    display_dice_result_static,
    format_narrative,
    get_console,
    get_player_input,
    parse_input,
    setup_terminal,
    cleanup_terminal,
    validate_action,
)
from void_walker.utils import (
    create_session_id,
    get_game_logger,
    list_saved_scenarios,
    load_scenario,
    save_state,
    setup_logging,
)


class Game:
    """Main game controller."""
    
    def __init__(
        self,
        session_type: str = "standard",
        debug: bool = False,
        fast_mode: bool = False,
    ):
        """
        Initialize the game.
        
        Args:
            session_type: Type of session (quick, standard, extended)
            debug: Enable debug mode
            fast_mode: Skip menus and use defaults
        """
        self.session_type = session_type
        self.debug = debug
        self.fast_mode = fast_mode
        self.console: Console | None = None
        self.state: GameState | None = None
        self.running = False
        self.show_suggestions = True  # Always show suggestions
        self.show_map = False
        self.show_inventory = False
        self.current_suggestions: list[str] = []
        self.logger = get_game_logger()
        self.start_time: datetime | None = None
    
    async def run(self) -> None:
        """Run the main game loop."""
        try:
            # Setup
            setup_logging(debug=self.debug)
            self.console = setup_terminal()
            self.running = True
            self.start_time = datetime.now()
            
            # Show title screen (skip in fast mode)
            if not self.fast_mode:
                await self._show_title_screen()
            
            # Character creation
            if self.fast_mode:
                player = await self._fast_character_creation()
            else:
                player = await self._character_creation()
            
            if player is None:
                return
            
            # Generate scenario with spinner
            if self.fast_mode:
                scenario = await self._fast_scenario_loading()
            else:
                scenario = await self._generate_or_fallback_scenario()
            
            # Initialize game state
            session_id = create_session_id()
            config = SESSION_CONFIGS.get(self.session_type, SESSION_CONFIGS["standard"])
            
            self.state = GameState(
                session_id=session_id,
                session_config=self.session_type,
                player=player,
                scenario=scenario,
                current_location=scenario.starting_location,
                progress=SessionProgress(total_scenes=config["scenes"]),
            )
            
            # Mark starting location as visited
            self.state.visit_location(scenario.starting_location)
            
            self.logger.set_session(session_id)
            self.logger.game_start(
                player.name,
                player.class_name,
                scenario.title,
            )
            
            # Show intro
            await self._show_intro()
            
            # Main game loop
            while self.running and not self.state.player.is_dead:
                await self._game_turn()
                
                # Check for game end
                if self.state.progress.story_beat == "resolution":
                    break
            
            # End game
            await self._end_game()
            
        except KeyboardInterrupt:
            self.console.print("\n\n[dim]Partie interrompue.[/dim]")
        except Exception as e:
            if self.debug:
                raise
            self.console.print(f"\n[danger]Erreur: {e}[/danger]")
        finally:
            cleanup_terminal()
    
    async def _show_title_screen(self) -> None:
        """Display the title screen."""
        clear_screen()
        
        title = """
[dim]
██╗   ██╗ ██████╗ ██╗██████╗     ██╗    ██╗ █████╗ ██╗     ██╗  ██╗███████╗██████╗ 
██║   ██║██╔═══██╗██║██╔══██╗    ██║    ██║██╔══██╗██║     ██║ ██╔╝██╔════╝██╔══██╗
██║   ██║██║   ██║██║██║  ██║    ██║ █╗ ██║███████║██║     █████╔╝ █████╗  ██████╔╝
╚██╗ ██╔╝██║   ██║██║██║  ██║    ██║███╗██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗
 ╚████╔╝ ╚██████╔╝██║██████╔╝    ╚███╔███╔╝██║  ██║███████╗██║  ██╗███████╗██║  ██║
  ╚═══╝   ╚═════╝ ╚═╝╚═════╝      ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
[/dim]

[text]Un RPG d'horreur spatiale avec un maître de jeu IA[/text]
"""
        
        self.console.print(Align.center(title))
        self.console.print()
        self.console.print(Align.center("[highlight]Appuyez sur Entrée pour commencer...[/highlight]"))
        
        await get_player_input("")
    
    async def _character_creation(self):
        """Character creation flow."""
        clear_screen()
        
        self.console.print("\n[text.bright]CRÉATION DE PERSONNAGE[/text.bright]\n")
        
        # Get player name
        self.console.print("[text]Entrez votre nom:[/text]")
        name = await get_player_input("> ")
        name = name.strip() or "Voyageur"
        
        # Choose class
        self.console.print("\n[text]Choisissez votre classe:[/text]\n")
        
        class_names = get_class_names()
        for i, class_name in enumerate(class_names, 1):
            info = CLASSES[class_name]
            stats = info["stats"]
            self.console.print(
                f"  [highlight]{i}[/highlight]. [text.bright]{class_name}[/text.bright]"
            )
            self.console.print(
                f"     FOR {stats['FOR']} | INT {stats['INT']} | CHA {stats['CHA']} | "
                f"HP {info['hp']}"
            )
            self.console.print(f"     [dim]{info['description']}[/dim]\n")
        
        while True:
            choice = await get_player_input("Choix (1-5): ")
            try:
                idx = int(choice.strip()) - 1
                if 0 <= idx < len(class_names):
                    chosen_class = class_names[idx]
                    break
            except ValueError:
                pass
            self.console.print("[danger]Choix invalide.[/danger]")
        
        # Create player
        player = create_player(name, chosen_class)
        
        self.console.print(f"\n[success]Bienvenue, {name} le {chosen_class}![/success]")
        await asyncio.sleep(1)
        
        return player
    
    async def _fast_character_creation(self):
        """Fast character creation - uses Voyageur and first available class."""
        clear_screen()
        
        name = "Voyageur"
        class_names = get_class_names()
        chosen_class = class_names[0]  # Default to first class (Technicien)
        
        # Create player
        player = create_player(name, chosen_class)
        
        self.console.print(f"\n[success]FAST MODE: {name} le {chosen_class}[/success]")
        
        return player
    
    async def _fast_scenario_loading(self):
        """Fast scenario loading - uses latest saved scenario or generates new."""
        settings = get_settings()
        
        # Try to load the most recent scenario
        scenarios = list_saved_scenarios(limit=1)
        if scenarios:
            try:
                self.console.print(f"[dim]Chargement du dernier scénario: {scenarios[0].title}...[/dim]")
                scenario = load_scenario(scenarios[0].file_path)
                self.console.print(f"[success]Scénario chargé![/success]")
                return scenario
            except Exception as e:
                self.console.print(f"[warning]Erreur lors du chargement: {e}[/warning]")
        
        # Try to generate new scenario if API key available
        if settings.google_api_key:
            self.console.print("[dim]Génération d'un nouveau scénario...[/dim]")
            spinner = CPUSpinner()
            spinner.start()
            
            try:
                scenario = await generate_scenario(self.session_type)
                spinner.stop()
                self.console.print()  # Add newline after spinner
                
                # Log generated scenario
                self.logger.scenario_generated(
                    scenario.title,
                    scenario.model_dump_json(indent=2)
                )
                return scenario
            except LLMError as e:
                spinner.stop()
                self.console.print(f"[warning]Erreur de génération: {e}[/warning]")
        
        # Final fallback
        self.console.print("[dim]Utilisation du scénario par défaut[/dim]")
        return create_fallback_scenario()
    
    async def _show_scenario_selection_menu(self):
        """Display scenario selection menu with last 4 scenarios."""
        clear_screen()
        
        self.console.print("\n[text.bright]SÉLECTION DE SCÉNARIO[/text.bright]\n")
        
        # Get last 4 saved scenarios
        scenarios = list_saved_scenarios(limit=4)
        
        if not scenarios:
            # No scenarios available - only show generate option
            self.console.print("[dim]Aucun scénario sauvegardé trouvé.[/dim]")
            self.console.print("[text]Générez votre premier scénario !\n[/text]")
            self.console.print("  [highlight]1[/highlight]. [text.bright]Générer un Nouveau Scénario[/text.bright]\n")
            
            while True:
                choice = await get_player_input("Choix (1): ")
                if choice.strip() == "1":
                    return None  # Signal to generate new scenario
                self.console.print("[danger]Choix invalide.[/danger]")
        else:
            # Display available scenarios
            self.console.print("[text]Scénarios disponibles:\n[/text]")
            
            for i, scenario_meta in enumerate(scenarios, 1):
                # Format timestamp as "Dec 4, 20:13"
                time_str = scenario_meta.saved_at.strftime("%b %d, %H:%M")
                
                self.console.print(f"  [highlight]{i}[/highlight]. [text.bright]{scenario_meta.title}[/text.bright]")
                self.console.print(
                    f"     [dim]{scenario_meta.setting_type} | "
                    f"{scenario_meta.location_count} locations | "
                    f"Difficulté: {scenario_meta.estimated_difficulty} | "
                    f"{time_str}[/dim]\n"
                )
            
            # Add generate new option
            generate_option = len(scenarios) + 1
            self.console.print(f"  [highlight]{generate_option}[/highlight]. [text.bright]Générer un Nouveau Scénario[/text.bright]\n")
            
            # Get user choice
            while True:
                choice = await get_player_input(f"Choix (1-{generate_option}): ")
                try:
                    idx = int(choice.strip()) - 1
                    if idx == len(scenarios):
                        # Generate new scenario
                        return None
                    elif 0 <= idx < len(scenarios):
                        # Load selected scenario
                        return scenarios[idx]
                except ValueError:
                    pass
                self.console.print("[danger]Choix invalide.[/danger]")
    
    async def _generate_or_fallback_scenario(self):
        """Show scenario selection menu and generate/load scenario."""
        settings = get_settings()
        
        # Show scenario selection menu
        selected_scenario = await self._show_scenario_selection_menu()
        
        if selected_scenario is not None:
            # User selected an existing scenario - load it
            try:
                self.console.print(f"\n[dim]Chargement du scénario: {selected_scenario.title}...[/dim]")
                scenario = load_scenario(selected_scenario.file_path)
                self.console.print(f"[success]Scénario chargé ![/success]")
                await asyncio.sleep(0.5)
                return scenario
            except Exception as e:
                self.console.print(f"\n[danger]Erreur lors du chargement: {e}[/danger]")
                self.console.print("[dim]Utilisation du scénario par défaut[/dim]")
                return create_fallback_scenario()
        
        # User chose to generate new scenario
        if not settings.google_api_key:
            self.console.print("\n[dim]Pas de clé API - utilisation du scénario par défaut[/dim]")
            return create_fallback_scenario()

        # Use spinner for scenario generation
        spinner = CPUSpinner()
        spinner.start()

        try:
            scenario = await generate_scenario(self.session_type)
            spinner.stop()
            self.console.print()  # Add newline after spinner
            # Log generated scenario
            self.logger.scenario_generated(
                scenario.title,
                scenario.model_dump_json(indent=2)
            )
            return scenario
        except LLMError as e:
            spinner.stop()
            self.console.print(f"\n[dim]Erreur de génération: {e}[/dim]")
            self.console.print("[dim]Utilisation du scénario par défaut[/dim]")
            return create_fallback_scenario()
    
    async def _show_intro(self) -> None:
        """Show scenario introduction."""
        clear_screen()
        
        scenario = self.state.scenario
        
        self.console.print(f"\n[text.bright]{scenario.title}[/text.bright]")
        self.console.print(f"[dim]{scenario.setting_name}[/dim]\n")
        self.console.print(create_divider())
        self.console.print()
        self.console.print(f"[text]{scenario.premise}[/text]")
        self.console.print()

        # Only show detailed objective in debug mode
        if self.debug:
            self.console.print(f"[highlight]Objectif: {scenario.victory_condition}[/highlight]")
            self.console.print()

        self.console.print(create_divider())
        self.console.print()
        
        await get_player_input("[dim]Appuyez sur Entrée pour continuer...[/dim]")
        
        # Show starting location
        location = scenario.get_location(scenario.starting_location)
        if location:
            clear_screen()
            await self._display_narrative(location.description, 3)
    
    async def _game_turn(self) -> None:
        """Execute a single game turn."""
        # Display current state
        await self._display_status()
        
        # Handle panels if shown
        if self.show_inventory:
            self.console.print(create_inventory_panel(self.state.player.inventory))
            self.show_inventory = False
        
        if self.show_map:
            self.console.print(create_map_panel(self.state))
            self.show_map = False
        
        # Always show suggestions if available
        if self.show_suggestions and self.current_suggestions:
            self.console.print(create_suggestions_panel(self.current_suggestions))
        
        # Display shortcuts hint
        self.console.print()
        self.console.print(Align.center(create_help_bar()))

        # Get player input
        self.console.print()
        self.console.print("[highlight]Que faites-vous ?[/highlight]")
        self.console.print(create_divider())
        
        raw_input = await get_player_input("> ")
        parsed = parse_input(raw_input)
        
        # Handle special commands
        if parsed.command_type == CommandType.QUIT:
            if await self._confirm_quit():
                self.running = False
            return
        
        if parsed.command_type == CommandType.HELP:
            self.console.print(create_help_panel())
            await get_player_input("[dim]Appuyez sur Entrée...[/dim]")
            return
        
        if parsed.command_type == CommandType.INVENTORY:
            self.show_inventory = True
            return
        
        if parsed.command_type == CommandType.MAP:
            self.show_map = True
            return
        
        if parsed.command_type == CommandType.SUGGESTIONS:
            self.show_suggestions = True
            return

        # Handle suggestion selection
        if parsed.command_type == CommandType.SUGGESTION_SELECT:
            if not self.current_suggestions:
                self.console.print("[danger]Aucune suggestion disponible.[/danger]")
                return

            try:
                choice_idx = int(parsed.action_text) - 1
                if 0 <= choice_idx < len(self.current_suggestions):
                    # Execute the selected suggestion
                    action = self.current_suggestions[choice_idx]
                    self.console.print(f"[dim]> {action}[/dim]")  # Echo selection
                    await self._process_action(action)
                else:
                    self.console.print(
                        f"[danger]Choix invalide. Entrez 1-{len(self.current_suggestions)}.[/danger]"
                    )
            except ValueError:
                # Should never happen due to parse_input validation
                self.console.print("[danger]Erreur de saisie.[/danger]")
            return

        # Handle gameplay action
        if parsed.command_type == CommandType.ACTION:
            action = parsed.action_text
            
            is_valid, error = validate_action(action)
            if not is_valid:
                self.console.print(f"[danger]{error}[/danger]")
                return
            
            await self._process_action(action)
    
    async def _process_action(self, action: str) -> None:
        """Process a gameplay action."""
        # Validate player intent if it looks like movement
        current_loc = self.state.scenario.get_location(self.state.current_location)
        if current_loc:
            available_exits = current_loc.connections
            # Build list of (location_id, location_name) tuples
            exit_tuples = []
            for exit_id in available_exits:
                exit_loc = self.state.scenario.get_location(exit_id)
                exit_name = exit_loc.name if exit_loc else exit_id
                exit_tuples.append((exit_id, exit_name))
            
            intent_result = await validate_player_intent(action, exit_tuples)
            
            if intent_result.clarification_needed:
                # Show numbered list of valid exits and ask for choice
                clarification = format_clarification_prompt(exit_tuples)
                self.console.print(f"\n[warning]{clarification}[/warning]")
                
                # Get clarified choice
                choice_input = await get_player_input("> ")
                try:
                    choice_idx = int(choice_input.strip()) - 1
                    if 0 <= choice_idx < len(available_exits):
                        # Rewrite action to use valid exit ID
                        action = f"aller vers {available_exits[choice_idx]}"
                    else:
                        self.console.print("[danger]Choix invalide.[/danger]")
                        return
                except ValueError:
                    # Player typed something else, let them try again
                    self.console.print("[dim]Action annulée.[/dim]")
                    return
            
            elif intent_result.matched_location_id:
                # Use the matched location ID directly
                action = f"aller vers {intent_result.matched_location_id}"
        
        self.state.turn_number += 1
        self.logger.turn(
            self.state.turn_number,
            action,
            self.state.current_location,
        )
        # Log full user action
        self.logger.user_action(self.state.turn_number, action)
        
        # First call: assess action and get narrative
        try:
            prompt = build_gameplay_prompt(self.state, action)
            
            # Log guidance hint if active
            guidance = GuidanceSystem(self.state)
            hint_level = guidance.get_hint_level()
            if hint_level > 0:
                self.logger.state_change(
                    "guidance_hint",
                    f"level={hint_level}, turns_since_progress={self.state.turns_since_progress}"
                )
            
            response_text = await call_llm(prompt, model_key="gameplay")
            # Log raw response before parsing
            self.logger.llm_response("gameplay", response_text)
            response = parse_game_response(response_text, scenario=self.state.scenario)
            # Log parsed data
            self.logger.llm_response("gameplay_parsed", response_text, response.model_dump())
            response = validate_game_response(response, self.state.progress, self.state)
        except (LLMError, ParseError) as e:
            self.logger.error("llm_parse_error", str(e))
            self.console.print(f"[danger]Erreur: {e}[/danger]")
            return
        
        # Handle dice roll if required
        if response.requires_roll and response.difficulty:
            dice_result = await self._handle_dice_roll(
                response.relevant_stat or "INT",
                response.difficulty,
                response.suggested_modifier,
            )
            
            # Second call: get outcome based on dice
            try:
                prompt = build_gameplay_prompt(self.state, action, dice_result)
                response_text = await call_llm(prompt, model_key="gameplay")
                # Log raw response before parsing
                self.logger.llm_response("gameplay_dice", response_text)
                response = parse_game_response(response_text, scenario=self.state.scenario)
                # Log parsed data
                self.logger.llm_response("gameplay_dice_parsed", response_text, response.model_dump())
                response = validate_game_response(response, self.state.progress, self.state)
            except (LLMError, ParseError) as e:
                self.logger.error("llm_parse_error_dice", str(e))
                self.console.print(f"[danger]Erreur: {e}[/danger]")
                return
        
        # Apply state changes FIRST (so location is updated before environment generation)
        messages, new_valid_location, objective_completed, secret_found = (
            self.state.apply_state_changes(response.state_changes)
        )
        
        # Check for NPCs at current location and generate dialogue in parallel with environment
        npcs_present = await self._get_npcs_at_location()
        npc_dialogue: str | None = None
        
        # Generate environment and NPC dialogue in parallel
        if npcs_present:
            # Pick first NPC for dialogue (could be extended to handle multiple)
            npc = npcs_present[0]
            
            # Run both LLM calls in parallel
            env_task = self._get_environment_description(response.scene_elements)
            dialogue_task = self._generate_npc_dialogue(npc, action)
            
            environment_text, npc_dialogue = await asyncio.gather(
                env_task, dialogue_task
            )
        else:
            # No NPCs, just get environment
            environment_text = await self._get_environment_description(response.scene_elements)
        
        # Combine narrative with NPC dialogue and environment description
        combined_narrative = response.narrative
        
        # Add NPC dialogue after the main narrative (before environment)
        if npc_dialogue:
            combined_narrative = f"{response.narrative}\n\n---\n\n{npc_dialogue}"
        
        # Add environment description at the end
        if environment_text:
            combined_narrative = f"{combined_narrative}\n\n{environment_text}"
        
        # Display combined narrative
        clear_screen()
        await self._display_narrative(combined_narrative, response.tension_level)
        
        # Only display "Obtenu:" messages in debug mode
        if self.debug:
            for msg in messages:
                self.console.print(f"[info]{msg}[/info]")
        
        # Update state
        self.state.tension_level = response.tension_level
        self.current_suggestions = response.suggestions
        
        # Add event to history
        self.state.add_event(summarize_narrative(response.narrative))
        
        # Advance scene only on meaningful events
        if self.state.progress.maybe_advance_scene(
            new_valid_location=new_valid_location,
            objective_completed=objective_completed,
            secret_found=secret_found,
        ):
            self.logger.state_change("scene_advance", "Scene advanced due to meaningful event")
        
        # Check for ending
        if response.is_ending:
            self.state.progress.story_beat = "resolution"
    
    async def _handle_dice_roll(
        self,
        stat: str,
        difficulty: int,
        modifier: int,
    ) -> DiceResult:
        """Handle a dice roll with animation."""
        stat_value = self.state.player.get_stat(stat)
        result = roll_check(stat_value, difficulty, modifier, stat)
        
        self.logger.dice_roll(
            stat,
            result.roll,
            result.total,
            difficulty,
            result.outcome.value,
        )
        
        # Show dice animation
        if self.debug:
            display_dice_result_static(result, self.console)
        else:
            await animate_dice_roll(result, self.console)
        
        # Grant XP on success
        if result.is_success:
            if self.state.player.stat_progress.add_xp(stat):
                if self.state.player.increase_stat(stat):
                    self.console.print(f"[success]{stat} augmenté![/success]")
        
        return result
    
    async def _get_npcs_at_location(self) -> list:
        """Get NPCs present at the current location."""
        return [
            npc for npc in self.state.scenario.npcs
            if npc.location == self.state.current_location and npc.is_alive
        ]
    
    async def _generate_npc_dialogue(
        self,
        npc,
        player_action: str,
    ) -> str | None:
        """
        Generate NPC dialogue, with cinematic introduction if first encounter.
        
        Args:
            npc: The NPC to generate dialogue for
            player_action: What the player is doing
        
        Returns:
            NPC dialogue text, or None on error
        """
        is_first_encounter = not self.state.has_met_npc(npc.id)
        
        prompt = build_npc_dialogue_prompt(
            npc=npc,
            player_action=player_action,
            state=self.state,
            is_first_encounter=is_first_encounter,
        )
        
        try:
            dialogue = await call_llm(prompt, model_key="dialogue")
            dialogue = dialogue.strip()
            
            # Mark NPC as encountered
            if is_first_encounter:
                self.state.mark_npc_encountered(npc.id)
                self.logger.state_change("npc_encountered", f"First meeting with {npc.name}")
            
            self.logger.llm_response("npc_dialogue", dialogue)
            return dialogue
        except LLMError as e:
            self.logger.error("npc_dialogue_error", str(e))
            return None
    
    async def _display_narrative(self, text: str, tension: int) -> None:
        """Display narrative text with typewriter effect."""
        from void_walker.ui.layout import calculate_layout
        from void_walker.ui.text import display_narrative_progressive

        # Calculate responsive panel width constrained by terminal size
        layout = calculate_layout()
        terminal_width = self.console.size.width
        ideal_width = layout.narrative_width + 8  # +8 for horizontal padding (4 left + 4 right)
        panel_width = min(ideal_width, terminal_width - 4)  # Leave 2 chars margin each side
        panel_width = max(panel_width, 40)  # Minimum 40 chars for readability

        # Use progressive display (or instant in debug mode)
        if self.debug:
            # Keep current instant display behavior in debug mode
            formatted = format_narrative(text, tension)
            panel = Panel(
                formatted,
                width=panel_width,
                padding=(1, 4),
                border_style="border",
            )
            self.console.print()
            self.console.print(Align.center(panel))
            self.console.print()
        else:
            # Progressive typewriter effect
            self.console.print()
            await display_narrative_progressive(
                text, tension, self.console, panel_width=panel_width
            )
            self.console.print()
    
    async def _generate_hallucinated_location_name(self, location_id: str) -> str:
        """
        Generate a human-readable French name for a hallucinated location.
        
        Uses LLM to convert snake_case IDs to proper French names.
        Caches the result for future use.
        
        Args:
            location_id: The location ID to convert
        
        Returns:
            Human-readable French name
        """
        # Check cache first
        if location_id in self.state.hallucinated_location_names:
            return self.state.hallucinated_location_names[location_id]
        
        try:
            prompt = build_location_name_prompt(location_id)
            name = await call_llm(prompt, model_key="gameplay")
            name = name.strip().strip('"').strip("'")
            
            # Cache for future use
            self.state.cache_hallucinated_location_name(location_id, name)
            self.logger.llm_response("location_name", f"{location_id} -> {name}")
            
            return name
        except LLMError as e:
            self.logger.error("location_name_error", str(e))
            # Fallback: basic cleanup of the ID
            return location_id.replace('_', ' ').title()
    
    async def _get_location_display_name(self, location_id: str) -> str:
        """
        Get display name for a location, generating if needed for hallucinated ones.
        
        Args:
            location_id: The location ID
        
        Returns:
            Human-readable French name
        """
        # Check if it's a valid scenario location
        location = self.state.scenario.get_location(location_id)
        if location:
            return location.name
        
        # It's a hallucinated location - generate name if needed
        return await self._generate_hallucinated_location_name(location_id)
    
    async def _get_environment_description(self, scene_elements: list[str]) -> str | None:
        """
        Get environment description, using cache if valid.
        
        Generates a prose description of available exits and interactive elements.
        Uses caching to avoid redundant LLM calls when nothing has changed.
        
        Args:
            scene_elements: Scene elements from the current LLM response
        
        Returns:
            Environment description prose in French, or None on error
        """
        # Check if cache is valid
        if self.state.is_environment_cache_valid(scene_elements):
            self.logger.state_change("environment_cache", "Using cached environment description")
            return self.state.cached_environment_description
        
        # Get location info - use async display name for hallucinated locations
        location_name = await self._get_location_display_name(self.state.current_location)
        
        # Get exits with readable names (handle hallucinated exits too)
        exits_with_names = []
        for exit_id in self.state.available_exits:
            exit_name = await self._get_location_display_name(exit_id)
            exits_with_names.append((exit_id, exit_name))
        
        # Get NPCs at current location
        npcs_present = [
            npc.name for npc in self.state.scenario.npcs
            if npc.location == self.state.current_location and npc.is_alive
        ]
        
        # Build and call environment prompt
        prompt = build_environment_prompt(
            location_name=location_name,
            exits_with_names=exits_with_names,
            scene_elements=scene_elements,
            npcs_present=npcs_present,
        )
        
        try:
            environment_text = await call_llm(prompt, model_key="gameplay")
            # Clean up response (remove any markdown or extra formatting)
            environment_text = environment_text.strip()
            if environment_text.startswith('"') and environment_text.endswith('"'):
                environment_text = environment_text[1:-1]
            
            # Cache the result
            self.state.update_environment_cache(environment_text, scene_elements)
            self.logger.llm_response("environment", environment_text)
            
            return environment_text
        except LLMError as e:
            self.logger.error("environment_llm_error", str(e))
            return None
    
    async def _display_status(self) -> None:
        """Display the status bar."""
        elapsed = datetime.now() - self.start_time if self.start_time else datetime.now() - datetime.now()
        elapsed_str = f"{int(elapsed.total_seconds() // 60):02d}:{int(elapsed.total_seconds() % 60):02d}"
        
        # Use async method to ensure hallucinated location names are generated
        location_name = await self._get_location_display_name(self.state.current_location)
        
        # Check if we're in a hallucinated location
        is_hallucinated = self.state.is_in_hallucinated_location
        
        status = create_status_bar(
            hp=self.state.player.hp,
            max_hp=self.state.player.max_hp,
            o2=100,  # Oxygen not yet implemented
            location=location_name,
            inventory_count=self.state.player.inventory.count,
            setting_name=self.state.scenario.setting_name,
            elapsed_time=elapsed_str,
            is_hallucinated=is_hallucinated,
        )
        
        self.console.print(create_divider())
        self.console.print(status)
        self.console.print(create_divider())
    
    async def _confirm_quit(self) -> bool:
        """Confirm quit action."""
        self.console.print("[highlight]Quitter la partie ? (o/n)[/highlight]")
        response = await get_player_input("> ")
        return response.lower().strip() in ("o", "oui", "y", "yes")
    
    async def _end_game(self) -> None:
        """Handle game ending."""
        clear_screen()
        
        # Calculate score
        score = SessionScore(
            secrets_found=self.state.progress.secrets_found,
            enemies_defeated=self.state.progress.enemies_defeated,
            hp_remaining=self.state.player.hp,
            items_collected=self.state.player.inventory.count,
            objectives_completed=len(self.state.progress.objectives_completed),
            total_turns=self.state.turn_number,
            ending_type="defeat" if self.state.player.is_dead else "escape",
        )
        
        total = score.calculate_total()
        
        # Log game end
        self.logger.game_end(
            score.ending_type,
            total,
            self.state.turn_number,
        )
        
        # Display ending
        if self.state.player.is_dead:
            self.console.print("\n[danger bold]VOUS ÊTES MORT[/danger bold]\n")
        else:
            self.console.print("\n[success bold]FIN DE PARTIE[/success bold]\n")
        
        self.console.print(create_divider())
        self.console.print(f"\n[text.bright]Score final: {total}[/text.bright]\n")
        self.console.print(f"  Tours joués: {score.total_turns}")
        self.console.print(f"  Secrets découverts: {score.secrets_found}")
        self.console.print(f"  Ennemis vaincus: {score.enemies_defeated}")
        self.console.print(f"  Objectifs complétés: {score.objectives_completed}")
        self.console.print(f"  HP restants: {score.hp_remaining}")
        self.console.print()
        self.console.print(create_divider())
        
        # Save final state
        save_state(self.state)
        
        self.console.print("\n[dim]Partie sauvegardée.[/dim]")
        await get_player_input("\n[dim]Appuyez sur Entrée pour quitter...[/dim]")
        
        self.running = False
