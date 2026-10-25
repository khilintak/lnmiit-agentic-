"""
Local LLM Client for FocusMate Local
Communicates with Ollama running locally at http://127.0.0.1:11434.
Includes automatic detection, fallback, and tokens/sec latency benchmarking.
"""

import time
import json
import logging
from typing import Optional, Dict, Any, List
import requests

logger = logging.getLogger("focusmate.ollama")

DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434"
DEFAULT_MODEL = "qwen2.5:1.5b"
FALLBACK_MODEL = "llama3.2:3b"

class LocalLLMClient:
    def __init__(self, base_url: str = DEFAULT_OLLAMA_URL, model: str = DEFAULT_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.fallback_model = FALLBACK_MODEL

    def is_available(self) -> bool:
        """Check if local Ollama daemon is active and responsive."""
        try:
            resp = requests.get(f"{self.base_url}/api/version", timeout=1.5)
            return resp.status_code == 200
        except Exception:
            return False

    def list_installed_models(self) -> List[str]:
        """Return list of locally downloaded models in Ollama."""
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=2.0)
            if resp.status_code == 200:
                data = resp.json()
                return [m.get("name", "") for m in data.get("models", [])]
        except Exception as e:
            logger.debug(f"Failed to fetch Ollama models: {e}")
        return []

    def generate(self, prompt: str, system: Optional[str] = None, model: Optional[str] = None) -> Dict[str, Any]:
        """
        Execute local inference against Ollama and record speed metrics.
        Returns dict with: response, tokens_per_sec, total_duration_ms, eval_count.
        """
        chosen_model = model or self.model
        payload = {
            "model": chosen_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "top_p": 0.9,
            }
        }
        if system:
            payload["system"] = system

        start_time = time.perf_counter()
        try:
            resp = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=45.0
            )
            elapsed_sec = time.perf_counter() - start_time

            if resp.status_code == 200:
                data = resp.json()
                eval_count = data.get("eval_count", 0)
                eval_duration_ns = data.get("eval_duration", 1)
                
                # Use Ollama's reported eval duration if present, otherwise wall clock
                if eval_duration_ns > 0:
                    eval_sec = eval_duration_ns / 1e9
                    tokens_per_sec = round(eval_count / eval_sec, 2) if eval_sec > 0 else 0.0
                else:
                    tokens_per_sec = round(eval_count / elapsed_sec, 2) if elapsed_sec > 0 else 0.0

                return {
                    "success": True,
                    "response": data.get("response", "").strip(),
                    "model": chosen_model,
                    "eval_count": eval_count,
                    "total_duration_ms": round(elapsed_sec * 1000, 1),
                    "tokens_per_sec": tokens_per_sec,
                    "is_local_ollama": True
                }
            else:
                return {
                    "success": False,
                    "error": f"Ollama HTTP {resp.status_code}: {resp.text}",
                    "is_local_ollama": False
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "is_local_ollama": False
            }
