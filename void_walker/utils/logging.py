"""
Void Walker - Logging utilities.

Configures logging for the application.
"""

import logging
import sys
from datetime import datetime
from pathlib import Path

from void_walker.config import LOGS_DIR, get_settings


def setup_logging(
    debug: bool | None = None,
    log_file: bool = True,
) -> logging.Logger:
    """
    Set up logging for the application.
    
    Args:
        debug: Enable debug logging (overrides settings)
        log_file: Whether to also log to file
    
    Returns:
        Configured logger
    """
    settings = get_settings()
    
    if debug is None:
        debug = settings.debug
    
    # Determine log level
    if debug:
        level = logging.DEBUG
    else:
        level_str = settings.log_level.upper()
        level = getattr(logging, level_str, logging.INFO)
    
    # Create logger
    logger = logging.getLogger("void_walker")
    logger.setLevel(level)
    
    # Ensure propagation is enabled for child loggers
    logger.propagate = False  # Root logger shouldn't propagate to root
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Console handler (minimal for gameplay, verbose for debug)
    if debug:
        console_handler = logging.StreamHandler(sys.stderr)
        console_handler.setLevel(logging.DEBUG)
        console_format = logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%H:%M:%S"
        )
        console_handler.setFormatter(console_format)
        logger.addHandler(console_handler)
    
    # File handler
    if log_file:
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_path = LOGS_DIR / f"void_walker_{timestamp}.log"
        
        file_handler = logging.FileHandler(log_path, encoding="utf-8")
        file_handler.setLevel(logging.DEBUG)
        file_format = logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s.%(funcName)s:%(lineno)d - %(message)s"
        )
        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)
    
    return logger


def get_logger(name: str = "void_walker") -> logging.Logger:
    """Get a logger instance."""
    return logging.getLogger(name)


class GameLogger:
    """
    Specialized logger for game events.
    
    Logs game events in a format suitable for analysis and debugging.
    """
    
    def __init__(self):
        self.logger = get_logger("void_walker.game")
        self.session_id: str | None = None
    
    def set_session(self, session_id: str) -> None:
        """Set current session ID for log context."""
        self.session_id = session_id
    
    def _log(self, level: int, event: str, **kwargs) -> None:
        """Log with session context."""
        extra = {"session": self.session_id}
        extra.update(kwargs)
        self.logger.log(level, f"[{event}] {extra}")
    
    def game_start(self, player_name: str, player_class: str, scenario: str) -> None:
        """Log game start."""
        self._log(
            logging.INFO,
            "GAME_START",
            player=player_name,
            player_class=player_class,
            scenario=scenario,
        )
    
    def game_end(self, ending_type: str, score: int, turns: int) -> None:
        """Log game end."""
        self._log(
            logging.INFO,
            "GAME_END",
            ending_type=ending_type,
            score=score,
            turns=turns,
        )
    
    def turn(self, turn_number: int, action: str, location: str) -> None:
        """Log a game turn."""
        self._log(
            logging.DEBUG,
            "TURN",
            turn=turn_number,
            action=action[:50],
            location=location,
        )
    
    def dice_roll(self, stat: str, roll: int, total: int, difficulty: int, outcome: str) -> None:
        """Log a dice roll."""
        self._log(
            logging.DEBUG,
            "DICE_ROLL",
            stat=stat,
            roll=roll,
            total=total,
            difficulty=difficulty,
            outcome=outcome,
        )
    
    def state_change(self, change_type: str, details: str) -> None:
        """Log a state change."""
        self._log(
            logging.DEBUG,
            "STATE_CHANGE",
            type=change_type,
            details=details,
        )
    
    def error(self, error_type: str, message: str) -> None:
        """Log an error."""
        self._log(
            logging.ERROR,
            "ERROR",
            error_type=error_type,
            message=message,
        )
    
    def llm_call(self, model: str, prompt_length: int, response_length: int) -> None:
        """Log an LLM API call."""
        self._log(
            logging.DEBUG,
            "LLM_CALL",
            model=model,
            prompt_len=prompt_length,
            response_len=response_length,
        )
    
    def llm_response(self, model: str, raw_response: str, parsed_data: dict | None = None) -> None:
        """Log raw LLM response and parsed data for debugging crashes."""
        self._log(
            logging.INFO,
            "LLM_RESPONSE",
            model=model,
            raw_response=raw_response,
            parsed_data=str(parsed_data) if parsed_data else None,
        )
    
    def user_action(self, turn: int, action: str) -> None:
        """Log full user action without truncation."""
        self._log(
            logging.INFO,
            "USER_ACTION",
            turn=turn,
            action=action,
        )
    
    def scenario_generated(self, scenario_title: str, scenario_json: str) -> None:
        """Log full scenario JSON after generation."""
        self._log(
            logging.INFO,
            "SCENARIO_GENERATED",
            title=scenario_title,
            scenario_json=scenario_json,
        )


# Global game logger instance
_game_logger: GameLogger | None = None


def get_game_logger() -> GameLogger:
    """Get or create the global game logger."""
    global _game_logger
    if _game_logger is None:
        _game_logger = GameLogger()
    return _game_logger
