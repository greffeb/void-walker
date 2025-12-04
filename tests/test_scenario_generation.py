"""
Test script for debugging scenario generation with Gemini.

Run with: python -m tests.test_scenario_generation
"""

import asyncio
import logging
from datetime import datetime
from pathlib import Path

# Configure logging to file
log_dir = Path("data/logs")
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / f"scenario_gen_debug_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


async def test_scenario_generation():
    """Test scenario generation and log raw prompt/response."""
    # Import directly to avoid circular imports
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    
    from void_walker.llm.prompts import build_world_gen_prompt
    from void_walker.llm.client import call_llm, LLMError
    from void_walker.llm.parser import parse_scenario, ParseError

    session_type = "standard"
    
    # Build and log the prompt
    prompt = build_world_gen_prompt(session_type)
    logger.info("=" * 80)
    logger.info("RAW PROMPT:")
    logger.info("=" * 80)
    logger.info(prompt)
    logger.info("=" * 80)
    
    try:
        # Call the LLM
        logger.info("Calling LLM (model_key='world_gen')...")
        response = await call_llm(prompt, model_key="world_gen", max_retries=3)
        
        logger.info("=" * 80)
        logger.info("RAW LLM RESPONSE:")
        logger.info("=" * 80)
        logger.info(response)
        logger.info("=" * 80)
        logger.info(f"Response length: {len(response)} characters")
        
        # Try to parse
        try:
            scenario = parse_scenario(response)
            logger.info("SUCCESS: Scenario parsed successfully!")
            logger.info(f"Title: {scenario.title}")
            logger.info(f"Setting: {scenario.setting_name}")
            logger.info(f"Locations: {len(scenario.locations)}")
            logger.info(f"NPCs: {len(scenario.npcs)}")
            logger.info(f"Secrets: {len(scenario.secrets)}")
        except ParseError as e:
            logger.error(f"PARSE ERROR: {e}")
            
    except LLMError as e:
        logger.error(f"LLM ERROR: {e}")
    except Exception as e:
        logger.exception(f"UNEXPECTED ERROR: {e}")
    
    logger.info(f"\nLog file saved to: {log_file}")


if __name__ == "__main__":
    print(f"Starting scenario generation test...")
    print(f"Log file will be saved to: {log_file}")
    asyncio.run(test_scenario_generation())
