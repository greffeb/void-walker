"""
Void Walker - Intent Validation.

LLM-based player intent validation to map free-form actions to valid locations.
Uses gemma-3-27b-it for fast, lightweight intent classification.
"""

import json
import logging
from dataclasses import dataclass

from void_walker.llm.client import call_llm, LLMError, ParseError

logger = logging.getLogger("void_walker.intent")

# Confidence threshold for requiring clarification
CONFIDENCE_THRESHOLD = 70


@dataclass
class IntentResult:
    """Result of intent validation."""
    matched_location_id: str | None  # Valid location ID or None if no match
    confidence: int  # 0-100 confidence score
    clarification_needed: bool  # Whether to ask player for clarification
    original_action: str  # The original player action
    

def _build_intent_prompt(action: str, available_exits: list[tuple[str, str]]) -> str:
    """
    Build the intent validation prompt.
    
    Args:
        action: Player's action text
        available_exits: List of (location_id, location_name) tuples
        
    Returns:
        Prompt string for the LLM
    """
    exits_text = "\n".join(
        f"  - ID: \"{loc_id}\" → Name: \"{loc_name}\""
        for loc_id, loc_name in available_exits
    )
    
    return f"""You are validating player intent in a French RPG game.

PLAYER ACTION: "{action}"

AVAILABLE EXITS (the player can ONLY go to these locations):
{exits_text}

TASK:
1. Determine if the player is trying to move to one of the available exits
2. Match their intent to the most likely destination
3. Return a confidence score (0-100)

MATCHING RULES:
- "salle de contrôle" could match "Pont de Commandement" (control room = bridge)
- "salle des machines" could match "Ingénierie" (engine room = engineering)
- Match based on semantic similarity, not just exact words
- French synonyms and paraphrases should be considered
- If the action is NOT a movement action (e.g., "je fouille", "j'examine"), return null with high confidence

OUTPUT JSON ONLY:
{{
  "matched_location_id": "location_id_here" or null,
  "confidence": 0-100,
  "reasoning": "brief explanation"
}}

OUTPUT RAW JSON ONLY, NO MARKDOWN:"""


def _parse_intent_response(response_text: str) -> tuple[str | None, int]:
    """
    Parse the intent validation response.
    
    Args:
        response_text: Raw LLM response
        
    Returns:
        Tuple of (matched_location_id, confidence)
    """
    # Clean up response
    text = response_text.strip()
    
    # Remove markdown code blocks if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Find the actual JSON content
        json_lines = []
        in_json = False
        for line in lines:
            if line.startswith("```") and not in_json:
                in_json = True
                continue
            elif line.startswith("```") and in_json:
                break
            elif in_json:
                json_lines.append(line)
        text = "\n".join(json_lines)
    
    try:
        data = json.loads(text)
        matched = data.get("matched_location_id")
        confidence = int(data.get("confidence", 0))
        return matched, confidence
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        logger.warning(f"Failed to parse intent response: {e}")
        return None, 0


async def validate_player_intent(
    action: str,
    available_exits: list[tuple[str, str]],
) -> IntentResult:
    """
    Validate player intent and match to valid locations.
    
    Args:
        action: Player's action text (e.g., "j'entre dans la salle de contrôle")
        available_exits: List of (location_id, location_name) tuples
        
    Returns:
        IntentResult with matched location and confidence
    """
    # Quick check: if action doesn't seem like movement, skip validation
    movement_keywords = [
        "aller", "entre", "dirige", "rend", "va", "vais", 
        "passe", "traverse", "monte", "descend", "sors",
        "quitte", "retourne", "explore", "avance"
    ]
    action_lower = action.lower()
    is_movement = any(kw in action_lower for kw in movement_keywords)
    
    if not is_movement:
        # Not a movement action, no clarification needed
        return IntentResult(
            matched_location_id=None,
            confidence=100,
            clarification_needed=False,
            original_action=action,
        )
    
    # Build and send prompt
    prompt = _build_intent_prompt(action, available_exits)
    
    try:
        response_text = await call_llm(
            prompt,
            model_key="intent",
            max_retries=2,
            temperature=0.3,  # Low temperature for more deterministic output
            max_output_tokens=200,
        )
        
        matched_id, confidence = _parse_intent_response(response_text)
        
        # Validate that matched_id is actually in available exits
        valid_ids = {loc_id for loc_id, _ in available_exits}
        if matched_id and matched_id not in valid_ids:
            logger.warning(f"Intent matched invalid location: {matched_id}")
            matched_id = None
            confidence = 0
        
        # Determine if clarification is needed
        clarification_needed = confidence < CONFIDENCE_THRESHOLD and matched_id is None
        
        logger.debug(
            f"Intent validation: action='{action}' matched='{matched_id}' "
            f"confidence={confidence} clarification={clarification_needed}"
        )
        
        return IntentResult(
            matched_location_id=matched_id,
            confidence=confidence,
            clarification_needed=clarification_needed,
            original_action=action,
        )
        
    except (LLMError, ParseError) as e:
        logger.warning(f"Intent validation failed: {e}")
        # On error, don't block the player - let them proceed
        return IntentResult(
            matched_location_id=None,
            confidence=50,
            clarification_needed=False,
            original_action=action,
        )


def format_clarification_prompt(available_exits: list[tuple[str, str]]) -> str:
    """
    Format a numbered list of available exits for player clarification.
    
    Args:
        available_exits: List of (location_id, location_name) tuples
        
    Returns:
        Formatted prompt string
    """
    lines = ["[highlight]Destination incertaine. Où voulez-vous aller ?[/highlight]\n"]
    
    for i, (loc_id, loc_name) in enumerate(available_exits, 1):
        lines.append(f"  [info]{i}.[/info] {loc_name}")
    
    lines.append("\n[dim](Entrez un numéro ou reformulez votre action)[/dim]")
    
    return "\n".join(lines)


def parse_clarification_choice(
    choice: str,
    available_exits: list[tuple[str, str]],
) -> str | None:
    """
    Parse player's clarification choice.
    
    Args:
        choice: Player's input (number or text)
        available_exits: List of (location_id, location_name) tuples
        
    Returns:
        Location ID if valid choice, None otherwise
    """
    choice = choice.strip()
    
    # Try to parse as number
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(available_exits):
            return available_exits[idx][0]
    except ValueError:
        pass
    
    return None
