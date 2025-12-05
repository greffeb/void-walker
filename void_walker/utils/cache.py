"""
Void Walker - Option Pool Cache.

Caches generated option pools to avoid regenerating on every scenario.
"""

import json
import logging
import time
from pathlib import Path
from typing import Any

from void_walker.config import DATA_DIR

logger = logging.getLogger("void_walker.cache")

# Cache configuration
OPTION_CACHE_TTL_HOURS = 24
CACHE_DIR = DATA_DIR / "cache"
OPTION_CACHE_FILE = CACHE_DIR / "option_pool.json"


class OptionCache:
    """Cache for option pools with TTL-based expiry."""
    
    def __init__(self, cache_file: Path = OPTION_CACHE_FILE, ttl_hours: int = OPTION_CACHE_TTL_HOURS):
        """
        Initialize the cache.
        
        Args:
            cache_file: Path to the cache file
            ttl_hours: Time-to-live in hours for cached data
        """
        self.cache_file = cache_file
        self.ttl_seconds = ttl_hours * 3600
        
        # Ensure cache directory exists
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
    
    def get(self) -> dict | None:
        """
        Get cached option pool if valid.
        
        Returns:
            Cached options dict or None if expired/missing
        """
        if not self.cache_file.exists():
            logger.debug("Option cache file does not exist")
            return None
        
        try:
            with open(self.cache_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Check if cache is expired
            timestamp = data.get("timestamp", 0)
            if time.time() - timestamp > self.ttl_seconds:
                logger.info("Option cache expired, will regenerate")
                return None
            
            options = data.get("options")
            if options:
                logger.info("Loaded option pool from cache")
                return options
            
            return None
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning(f"Failed to read option cache: {e}")
            return None
    
    def set(self, options: dict) -> None:
        """
        Cache option pool.
        
        Args:
            options: Option pool dictionary to cache
        """
        try:
            data = {
                "timestamp": time.time(),
                "options": options,
            }
            
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved option pool to cache: {self.cache_file}")
            
        except Exception as e:
            logger.warning(f"Failed to write option cache: {e}")
    
    def clear(self) -> None:
        """Clear the cache."""
        if self.cache_file.exists():
            self.cache_file.unlink()
            logger.info("Option cache cleared")
    
    def is_valid(self) -> bool:
        """Check if cache exists and is not expired."""
        return self.get() is not None


# Global cache instance
_option_cache: OptionCache | None = None


def get_option_cache() -> OptionCache:
    """Get the global option cache instance."""
    global _option_cache
    if _option_cache is None:
        _option_cache = OptionCache()
    return _option_cache


async def get_or_generate_options(force_regenerate: bool = False) -> dict:
    """
    Get option pool from cache or generate new one.
    
    Args:
        force_regenerate: If True, bypass cache and generate fresh options
    
    Returns:
        Option pool dictionary
    """
    from void_walker.llm.option_generator import generate_option_pool, FALLBACK_OPTIONS
    
    cache = get_option_cache()
    
    # Try cache first (unless forcing regeneration)
    if not force_regenerate:
        cached = cache.get()
        if cached:
            return cached
    
    # Generate new options
    logger.info("Generating new option pool...")
    try:
        options = await generate_option_pool()
        cache.set(options)
        return options
    except Exception as e:
        logger.warning(f"Option generation failed, using fallback: {e}")
        return FALLBACK_OPTIONS
