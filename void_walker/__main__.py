"""
Void Walker - Entry point.

Run with: python -m void_walker
"""

import argparse
import asyncio
import sys

from void_walker.core.game import Game
from void_walker.ui.terminal import cleanup_terminal


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Void Walker - A terminal-based space horror RPG",
        prog="void-walker",
    )
    
    parser.add_argument(
        "--session", "-s",
        choices=["quick", "standard", "extended"],
        default="standard",
        help="Session length (quick=5min, standard=30min, extended=2h)",
    )
    
    parser.add_argument(
        "--debug", "-d",
        action="store_true",
        help="Enable debug mode (verbose logging, no animations)",
    )
    
    parser.add_argument(
        "--version", "-v",
        action="store_true",
        help="Show version and exit",
    )
    
    return parser.parse_args()


def main() -> None:
    """Main entry point."""
    args = parse_args()
    
    if args.version:
        from void_walker import __version__
        print(f"Void Walker v{__version__}")
        sys.exit(0)
    
    try:
        game = Game(
            session_type=args.session,
            debug=args.debug,
        )
        asyncio.run(game.run())
    except KeyboardInterrupt:
        print("\n\nPartie interrompue.")
    except Exception as e:
        if args.debug:
            raise
        print(f"\nErreur: {e}")
        sys.exit(1)
    finally:
        cleanup_terminal()


if __name__ == "__main__":
    main()
