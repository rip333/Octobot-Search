"""Refresh src/data/heroes.json from Cerebro.

Dependencies:
    Python 3.9+ and `requests` (`pip install requests`).

Usage:
    python src/data/extract-hero-ids.py

Writes heroes.json next to this script, so the working directory does not
matter. Exits non-zero on any HTTP, timeout, or schema problem and leaves the
existing file untouched, so a failed refresh can never truncate the data.
"""

import json
import sys
from pathlib import Path

import requests

CEREBRO_URL = "https://cerebro-beta-bot.herokuapp.com/cards?type=hero&origin=official"
REQUEST_TIMEOUT_SECONDS = 30
OUTPUT_PATH = Path(__file__).resolve().parent / "heroes.json"


def fetch_hero_cards():
    """Returns the raw hero card list, or exits with a diagnostic."""
    try:
        response = requests.get(CEREBRO_URL, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
    except requests.Timeout:
        sys.exit(f"Timed out after {REQUEST_TIMEOUT_SECONDS}s fetching hero cards.")
    except requests.RequestException as error:
        sys.exit(f"Failed to fetch hero cards: {error}")

    try:
        data = response.json()
    except ValueError:
        sys.exit("Cerebro returned a body that is not JSON.")

    if not isinstance(data, list):
        sys.exit(f"Expected a list of cards, got {type(data).__name__}.")

    return data


def extract_hero_sets(cards):
    """Maps cards to unique {name, setid} entries, skipping unusable records."""
    seen_set_ids = set()
    heroes = []
    skipped = 0

    for card in cards:
        if not isinstance(card, dict):
            skipped += 1
            continue

        name = card.get("Name")
        printings = card.get("Printings")
        if not isinstance(name, str) or not isinstance(printings, list) or not printings:
            skipped += 1
            continue

        first_printing = printings[0]
        set_id = first_printing.get("SetId") if isinstance(first_printing, dict) else None
        if not isinstance(set_id, str) or not set_id:
            skipped += 1
            continue

        if set_id in seen_set_ids:
            continue

        seen_set_ids.add(set_id)
        heroes.append({"name": name, "setid": set_id})

    if skipped:
        print(f"Skipped {skipped} card(s) with no usable name or set ID.", file=sys.stderr)

    return sorted(heroes, key=lambda hero: hero["name"])


def main():
    heroes = extract_hero_sets(fetch_hero_cards())

    if not heroes:
        sys.exit("Cerebro returned no usable heroes; refusing to overwrite heroes.json.")

    OUTPUT_PATH.write_text(json.dumps(heroes, indent=4) + "\n", encoding="utf-8")
    print(f"Wrote {len(heroes)} heroes to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
