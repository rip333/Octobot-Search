"""
json_to_markdown.py
-------------------
Converts Marvel Champions card JSON files in ./card_json/ into a single
Markdown file optimised for AI chunking and embedding.

Each card becomes its own fenced section so a splitter can slice cleanly at
the H2 boundary.  Null / empty fields are omitted entirely to keep the chunks
dense and noise-free.

Usage:
    python scripts/json_to_markdown.py
    python scripts/json_to_markdown.py --out my_output.md
    python scripts/json_to_markdown.py --official-only
"""

import json
import re
import textwrap
from pathlib import Path
import argparse

# ---------------------------------------------------------------------------
# Resource / icon substitution map
# Keeps the text readable while preserving game-specific symbols as words.
# ---------------------------------------------------------------------------
RESOURCE_MAP = {
    "{e}": "[Energy]",
    "{m}": "[Mental]",
    "{p}": "[Physical]",
    "{w}": "[Wild]",
    "{d}": "[Double]",
    "{i}": "[Indirect]",
    "{h}": "[Hero]",
    "{s}": "[Special]",
    "{b}": "[Boost]",
}


def clean_text(text: str) -> str:
    """Replace icon codes, normalise whitespace."""
    if not text:
        return text
    for code, label in RESOURCE_MAP.items():
        text = text.replace(code, label)
    # Windows-style line endings → single newline
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse runs of blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def opt(label: str, value) -> str:
    """Return a markdown bullet line only when value is truthy."""
    if value is None or value == "" or value == [] or value == "—":
        return ""
    return f"- **{label}:** {value}\n"


def card_to_markdown(card: dict) -> str:
    """Convert one card dict to a Markdown section."""
    lines = []

    # ── Title ────────────────────────────────────────────────────────────────
    name = card.get("Name") or "Unknown Card"
    subname = card.get("Subname")
    full_title = f"{name} ({subname})" if subname else name
    card_id = card.get("Id", "")
    lines.append(f"## {full_title}  [ID: {card_id}]\n")

    # ── Identity line ─────────────────────────────────────────────────────────
    parts = []
    card_type = card.get("Type")
    if card_type:
        parts.append(card_type)
    classification = card.get("Classification")
    if classification:
        parts.append(classification)
    traits = card.get("Traits")
    if traits:
        parts.append("· ".join(traits))
    if parts:
        lines.append(f"*{' — '.join(parts)}*\n")

    lines.append("")

    # ── Stats block ─────────────────────────────────────────────────────────
    cost = card.get("Cost")
    health = card.get("Health")
    attack = card.get("Attack")
    thwart = card.get("Thwart")
    defense = card.get("Defense")
    recover = card.get("Recover")
    hand = card.get("Hand")
    resource = card.get("Resource")
    boost = card.get("Boost")
    scheme = card.get("Scheme")
    stage = card.get("Stage")
    acceleration = card.get("Acceleration")
    starting_threat = card.get("StartingThreat")
    target_threat = card.get("TargetThreat")

    stat_lines = ""
    stat_lines += opt("Cost", cost)
    stat_lines += opt("Resource", clean_text(resource))
    stat_lines += opt("Health", health)
    stat_lines += opt("Attack", clean_text(attack))
    stat_lines += opt("Thwart", clean_text(thwart))
    stat_lines += opt("Defense", clean_text(defense))
    stat_lines += opt("Recover", recover)
    stat_lines += opt("Hand Size", hand)
    stat_lines += opt("Boost", clean_text(boost))
    stat_lines += opt("Scheme", clean_text(scheme))
    stat_lines += opt("Stage", stage)
    stat_lines += opt("Acceleration", acceleration)
    stat_lines += opt("Starting Threat", starting_threat)
    stat_lines += opt("Target Threat", target_threat)

    unique = card.get("Unique", False)
    if unique:
        stat_lines += "- **Unique:** Yes\n"

    if stat_lines.strip():
        lines.append("### Stats\n")
        lines.append(stat_lines)

    # ── Rules text ────────────────────────────────────────────────────────────
    rules = clean_text(card.get("Rules") or "")
    special = clean_text(card.get("Special") or "")

    if rules or special:
        lines.append("### Rules\n")
        if rules:
            lines.append(rules + "\n")
        if special:
            if rules:
                lines.append("")
            lines.append(f"*Special:* {special}\n")
        lines.append("")

    # ── Printings / Flavor ────────────────────────────────────────────────────
    printings = card.get("Printings") or []
    flavors = [
        p["Flavor"]
        for p in printings
        if p.get("Flavor") and p["Flavor"].strip()
    ]
    if flavors:
        lines.append("### Flavor\n")
        for flavor in flavors:
            lines.append(f"> {clean_text(flavor)}\n")
        lines.append("")

    # ── Meta ─────────────────────────────────────────────────────────────────
    official = card.get("Official", False)
    slash = card.get("Slash", False)
    meta_parts = []
    if official:
        meta_parts.append("Official")
    if slash:
        meta_parts.append("Slash card")
    if len(printings) > 1:
        meta_parts.append(f"{len(printings)} printings")
    if meta_parts:
        lines.append(f"*{' · '.join(meta_parts)}*\n")

    lines.append("\n---\n")
    return "".join(lines)


def load_json_files(card_json_dir: Path) -> list[dict]:
    """Load and merge all JSON files from the given directory."""
    all_cards: list[dict] = []
    json_files = sorted(card_json_dir.glob("*.json"))
    if not json_files:
        raise FileNotFoundError(f"No JSON files found in {card_json_dir}")

    seen_ids: set[str] = set()
    for path in json_files:
        with open(path, encoding="utf-8") as f:
            cards = json.load(f)
        for card in cards:
            card_id = card.get("Id")
            if card_id and card_id in seen_ids:
                continue  # skip duplicates across files
            if card_id:
                seen_ids.add(card_id)
            all_cards.append(card)

    return all_cards


def sort_key(card: dict):
    """Sort by classification then name, grouping encounter/villain last."""
    classification = card.get("Classification") or "Z"
    name = card.get("Name") or ""
    subname = card.get("Subname") or ""
    return (classification, name, subname)


def build_markdown(cards: list[dict], official_only: bool = False) -> str:
    """Build the full Markdown document from a list of card dicts."""
    if official_only:
        cards = [c for c in cards if c.get("Official")]

    # Filter deleted cards
    cards = [c for c in cards if not c.get("Deleted")]

    cards.sort(key=sort_key)

    sections: list[str] = []

    # Document header
    total = len(cards)
    sections.append(
        textwrap.dedent(f"""\
        # Marvel Champions Card Database

        > Auto-generated from card JSON data.  
        > Total cards: **{total}**  
        > Each section below represents one card, separated by `---` for chunking.

        ---

        """)
    )

    for card in cards:
        sections.append(card_to_markdown(card))

    return "".join(sections)


def main():
    parser = argparse.ArgumentParser(
        description="Convert Marvel Champions card JSON files to Markdown."
    )
    parser.add_argument(
        "--card-dir",
        default=None,
        help="Path to the card_json directory (default: scripts/card_json relative to repo root)",
    )
    parser.add_argument(
        "--out",
        default=None,
        help="Output Markdown file path (default: scripts/cards.md)",
    )
    parser.add_argument(
        "--official-only",
        action="store_true",
        help="Only include cards marked as Official",
    )
    args = parser.parse_args()

    # Resolve paths relative to this script's location
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent

    card_dir = Path(args.card_dir) if args.card_dir else script_dir / "card_json"
    out_path = Path(args.out) if args.out else script_dir / "cards.md"

    print(f"Loading cards from: {card_dir}")
    cards = load_json_files(card_dir)
    print(f"Loaded {len(cards)} unique cards")

    if args.official_only:
        before = len(cards)
        cards_filtered = [c for c in cards if c.get("Official") and not c.get("Deleted")]
        print(f"Filtered to {len(cards_filtered)} official cards (dropped {before - len(cards_filtered)})")
    else:
        cards_filtered = [c for c in cards if not c.get("Deleted")]

    cards_filtered.sort(key=sort_key)

    # Build document header
    total = len(cards_filtered)
    header = textwrap.dedent(f"""\
        # Marvel Champions Card Database

        > Auto-generated from card JSON data.  
        > Total cards: **{total}**  
        > Each section below represents one card, separated by `---` for chunking.

        ---

        """)

    print(f"Writing Markdown to: {out_path}")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(header)
        for card in cards_filtered:
            f.write(card_to_markdown(card))

    size_kb = out_path.stat().st_size / 1024
    print(f"Done! Output: {out_path} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
