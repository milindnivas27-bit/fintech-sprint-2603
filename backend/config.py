"""
Configuration loader for FS-2603.

Loads config.toml from the repo root. Every tunable lives there so
the H+8 mid-event spec change can be absorbed without touching code.
"""

import tomllib
from pathlib import Path
from typing import Any


_CONFIG_CACHE: dict[str, Any] | None = None


def _find_config_path() -> Path:
    """Walk up from this file to find config.toml at the repo root."""
    here = Path(__file__).resolve()
    for parent in [here.parent, *here.parents]:
        candidate = parent / "config.toml"
        if candidate.exists():
            return candidate
    raise FileNotFoundError("config.toml not found in any parent directory")


def load_config(force_reload: bool = False) -> dict[str, Any]:
    """Load and cache config.toml. Call with force_reload=True to re-read."""
    global _CONFIG_CACHE
    if _CONFIG_CACHE is not None and not force_reload:
        return _CONFIG_CACHE

    path = _find_config_path()
    with open(path, "rb") as f:
        _CONFIG_CACHE = tomllib.load(f)
    return _CONFIG_CACHE


def cfg(section: str, key: str, default: Any = None) -> Any:
    """Shorthand accessor: cfg('forecast', 'seed')"""
    return load_config().get(section, {}).get(key, default)