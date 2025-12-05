#!/usr/bin/env python3
"""
Quick test of fast mode command-line argument parsing.
This tests the argument parsing without needing the full game to run.
"""

import sys
from pathlib import Path

# Add project to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from void_walker.__main__ import parse_args


def test_fast_mode_parsing():
    """Test that --fast arguments are parsed correctly."""
    print("Testing --fast argument parsing...\n")
    
    test_cases = [
        (["--fast"], 
         {"fast": True, "player_name": None, "player_class": None, "scenario": None}),
        
        (["--fast", "--player-name", "Alice"],
         {"fast": True, "player_name": "Alice", "player_class": None, "scenario": None}),
        
        (["--fast", "--player-class", "Marine"],
         {"fast": True, "player_name": None, "player_class": "Marine", "scenario": None}),
        
        (["--fast", "--player-name", "Bob", "--player-class", "Diplomate"],
         {"fast": True, "player_name": "Bob", "player_class": "Diplomate", "scenario": None}),
        
        (["--fast", "--scenario", "test.json"],
         {"fast": True, "player_name": None, "player_class": None, "scenario": "test.json"}),
        
        (["--fast", "--player-name", "Charlie", "--player-class", "Pilote", "--scenario", "scenario.json"],
         {"fast": True, "player_name": "Charlie", "player_class": "Pilote", "scenario": "scenario.json"}),
        
        ([],  # No fast mode
         {"fast": False, "player_name": None, "player_class": None, "scenario": None}),
        
        (["--player-name", "Dave", "--player-class", "Médecin"],  # Without --fast
         {"fast": False, "player_name": "Dave", "player_class": "Médecin", "scenario": None}),
    ]
    
    all_passed = True
    for i, (argv, expected) in enumerate(test_cases, 1):
        sys.argv = ["void-walker"] + argv
        try:
            args = parse_args()
            result = {
                "fast": args.fast,
                "player_name": args.player_name,
                "player_class": args.player_class,
                "scenario": args.scenario,
            }
            
            if result == expected:
                print(f"✓ Test {i}: PASSED")
                print(f"  Args: {argv}")
                print(f"  Result: {result}\n")
            else:
                print(f"✗ Test {i}: FAILED")
                print(f"  Args: {argv}")
                print(f"  Expected: {expected}")
                print(f"  Got: {result}\n")
                all_passed = False
        except Exception as e:
            print(f"✗ Test {i}: ERROR")
            print(f"  Args: {argv}")
            print(f"  Error: {e}\n")
            all_passed = False
    
    if all_passed:
        print("=" * 50)
        print("All tests PASSED! ✓")
        print("=" * 50)
        return 0
    else:
        print("=" * 50)
        print("Some tests FAILED! ✗")
        print("=" * 50)
        return 1


if __name__ == "__main__":
    sys.exit(test_fast_mode_parsing())
