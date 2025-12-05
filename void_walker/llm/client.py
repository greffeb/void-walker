"""
Void Walker - LLM Client.

API wrapper for Google GenAI with rate limiting and retry logic.
"""

import asyncio
import json
import logging
import time
from typing import Any

from google import genai
from google.genai import types
from pydantic import BaseModel

from void_walker.config import MODELS, RATE_LIMITS, get_settings

# Logger for LLM interactions
logger = logging.getLogger("void_walker.llm")


class LLMError(Exception):
    """Base exception for LLM errors."""
    pass


class RateLimitError(LLMError):
    """Raised when rate limit is exceeded."""
    pass


class ParseError(LLMError):
    """Raised when response cannot be parsed."""
    pass


class RateLimiter:
    """Simple rate limiter for API calls."""
    
    def __init__(self, rpm: int, rpd: int):
        """
        Initialize rate limiter.
        
        Args:
            rpm: Requests per minute limit
            rpd: Requests per day limit
        """
        self.rpm = rpm
        self.rpd = rpd
        self.minute_calls: list[float] = []
        self.day_calls: list[float] = []
    
    def can_call(self) -> bool:
        """Check if a call can be made now."""
        now = time.time()
        
        # Clean old calls
        self.minute_calls = [t for t in self.minute_calls if now - t < 60]
        self.day_calls = [t for t in self.day_calls if now - t < 86400]
        
        return len(self.minute_calls) < self.rpm and len(self.day_calls) < self.rpd
    
    def wait_time(self) -> float:
        """Get time to wait before next call is allowed."""
        if self.can_call():
            return 0.0
        
        now = time.time()
        
        # Check minute limit
        if len(self.minute_calls) >= self.rpm:
            oldest = min(self.minute_calls)
            wait = 60 - (now - oldest) + 0.1
            if wait > 0:
                return wait
        
        # Check day limit
        if len(self.day_calls) >= self.rpd:
            oldest = min(self.day_calls)
            return 86400 - (now - oldest) + 0.1
        
        return 0.0
    
    def record_call(self) -> None:
        """Record that a call was made."""
        now = time.time()
        self.minute_calls.append(now)
        self.day_calls.append(now)


class LLMClient:
    """Client for interacting with Google GenAI."""
    
    def __init__(self):
        """Initialize the LLM client."""
        settings = get_settings()
        if not settings.google_api_key:
            raise LLMError("GOOGLE_API_KEY not set in environment")
        
        self._client = genai.Client(api_key=settings.google_api_key)
        self.rate_limiters: dict[str, RateLimiter] = {}
        self.current_model: str = "gameplay"
        
        # Initialize rate limiters for each model
        for model_key, limits in RATE_LIMITS.items():
            self.rate_limiters[model_key] = RateLimiter(
                rpm=limits["rpm"],
                rpd=limits["rpd"]
            )
    
    def _get_model_name(self, model_key: str) -> str:
        """Get the model name for a model key."""
        model_name = MODELS.get(model_key)
        if not model_name:
            raise LLMError(f"Unknown model key: {model_key}")
        return model_name
    
    def _get_rate_limiter(self, model_key: str) -> RateLimiter:
        """Get rate limiter for a model."""
        model_name = MODELS.get(model_key, model_key)
        if model_name in self.rate_limiters:
            return self.rate_limiters[model_name]
        # Default fallback limiter
        return RateLimiter(rpm=10, rpd=1000)
    
    async def call(
        self,
        prompt: str,
        model_key: str = "gameplay",
        max_retries: int = 3,
        temperature: float = 0.8,
        max_output_tokens: int | None = None,
    ) -> str:
        """
        Make an LLM call with rate limiting and retry logic.
        
        Args:
            prompt: The prompt to send
            model_key: Which model to use ("world_gen", "gameplay", "fallback")
            max_retries: Number of retry attempts
            temperature: Sampling temperature
            max_output_tokens: Maximum tokens in response (default based on model_key)
        
        Returns:
            The model's response text
        """
        model_name = self._get_model_name(model_key)
        limiter = self._get_rate_limiter(model_key)
        
        # Use larger token limit for world generation
        if max_output_tokens is None:
            max_output_tokens = 8192 if model_key == "world_gen" else 2048
        
        for attempt in range(max_retries):
            try:
                # Wait for rate limit if needed
                wait_time = limiter.wait_time()
                if wait_time > 0:
                    if wait_time > 60:
                        # Switch to fallback model if wait is too long
                        if model_key != "fallback":
                            return await self.call(
                                prompt, "fallback", max_retries, temperature, max_output_tokens
                            )
                        raise RateLimitError(f"Rate limit exceeded, wait {wait_time:.0f}s")
                    await asyncio.sleep(wait_time)
                
                # Make the call
                limiter.record_call()
                
                # Log the prompt being sent
                logger.debug(f"LLM REQUEST [{model_key}] (attempt {attempt + 1}/{max_retries}):")
                logger.debug(f"--- PROMPT START ---\n{prompt}\n--- PROMPT END ---")
                
                config = types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                )
                
                response = await self._client.aio.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config,
                )
                
                if response.text:
                    # Log the response received
                    logger.debug(f"LLM RESPONSE [{model_key}]:")
                    logger.debug(f"--- RESPONSE START ---\\n{response.text}\\n--- RESPONSE END ---")
                    return response.text
                else:
                    logger.warning(f"Empty response from model {model_key}")
                    raise LLMError("Empty response from model")
                    
            except Exception as e:
                error_str = str(e).lower()
                logger.error(f"LLM error [{model_key}] attempt {attempt + 1}: {e}")
                
                # Handle rate limit errors
                if "rate" in error_str or "quota" in error_str:
                    logger.warning(f"Rate limit hit for {model_key}, switching to fallback")
                    if model_key != "fallback":
                        return await self.call(
                            prompt, "fallback", max_retries, temperature, max_output_tokens
                        )
                    raise RateLimitError(str(e))
                
                # Retry on other errors
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {2 ** attempt}s...")
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise LLMError(f"Failed after {max_retries} attempts: {e}")
        
        raise LLMError("Unexpected error in LLM call")
    
    async def call_for_json(
        self,
        prompt: str,
        model_key: str = "gameplay",
        max_retries: int = 3,
    ) -> dict:
        """
        Make an LLM call expecting JSON response.
        
        Args:
            prompt: The prompt to send
            model_key: Which model to use
            max_retries: Number of retry attempts
        
        Returns:
            Parsed JSON as dictionary
        """
        response_text = await self.call(prompt, model_key, max_retries)
        
        # Try to parse as JSON
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            extracted = extract_json(response_text)
            if extracted:
                return extracted
            raise ParseError(f"Could not parse response as JSON: {response_text[:200]}")


def extract_json(text: str) -> dict | None:
    """
    Try to extract JSON from a text that might contain other content.
    
    Args:
        text: Text that might contain JSON
    
    Returns:
        Parsed JSON dict or None if extraction failed
    """
    import re
    
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Look for JSON block markers (various formats)
    patterns = [
        r"```json\s*\n(.*?)\n```",  # ```json ... ```
        r"```\s*\n(\{.*?\})\s*\n```",  # ``` { } ```
        r"```json\s*(\{.*\})",  # ```json { } (no closing)
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                continue
    
    # Look for { ... } pattern with balanced braces
    start = text.find("{")
    if start >= 0:
        # Find matching closing brace
        depth = 0
        in_string = False
        escape_next = False
        
        for i, char in enumerate(text[start:], start):
            if escape_next:
                escape_next = False
                continue
            
            if char == "\\" and in_string:
                escape_next = True
                continue
                
            if char == '"' and not escape_next:
                in_string = not in_string
            elif not in_string:
                if char == "{":
                    depth += 1
                elif char == "}":
                    depth -= 1
                    if depth == 0:
                        json_str = text[start:i+1]
                        try:
                            return json.loads(json_str)
                        except json.JSONDecodeError:
                            # Try to repair common issues
                            repaired = _repair_json(json_str)
                            if repaired:
                                return repaired
                            break
    
    return None


def _repair_json(json_str: str) -> dict | None:
    """
    Attempt to repair common JSON issues.
    
    Args:
        json_str: Potentially broken JSON string
    
    Returns:
        Parsed dict or None
    """
    import re
    
    # Try original first
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        pass
    
    # Fix trailing commas
    fixed = re.sub(r",\s*}", "}", json_str)
    fixed = re.sub(r",\s*]", "]", fixed)
    
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass
    
    # Fix unquoted keys
    fixed = re.sub(r"(\{|,)\s*(\w+)\s*:", r'\1"\2":', json_str)
    
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass
    
    return None


# Global client instance
_client: LLMClient | None = None


def get_client() -> LLMClient:
    """Get or create the global LLM client."""
    global _client
    if _client is None:
        _client = LLMClient()
    return _client


async def call_llm(
    prompt: str,
    model_key: str = "gameplay",
    max_retries: int = 3,
) -> str:
    """Convenience function to call LLM."""
    client = get_client()
    return await client.call(prompt, model_key, max_retries)


async def call_llm_json(
    prompt: str,
    model_key: str = "gameplay",
    max_retries: int = 3,
) -> dict:
    """Convenience function to call LLM and get JSON."""
    client = get_client()
    return await client.call_for_json(prompt, model_key, max_retries)
