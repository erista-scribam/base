#!/usr/bin/env python3
"""Sync glyph and app mark from the approved vector scribam-s-glyph.svg (no auto-trace)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / "docs" / "brands" / "scribam-brand-kit"
SOURCE = KIT / "scribam-s-glyph.svg"


def parse_source() -> tuple[str, str, str, tuple[float, float, float, float]]:
    if not SOURCE.is_file():
        print(f"Missing approved glyph: {SOURCE}", file=sys.stderr)
        sys.exit(1)
    text = SOURCE.read_text()
    view_box = re.search(r'viewBox="([^"]+)"', text)
    path = re.search(r'\sd="([^"]+)"', text)
    if not view_box or not path:
        print(f"Could not parse viewBox/path from {SOURCE}", file=sys.stderr)
        sys.exit(1)
    fill_rule = ' fill-rule="evenodd"' if 'fill-rule="evenodd"' in text else ""
    d = path.group(1)
    nums = re.findall(r"-?\d+(?:\.\d+)?", d)
    if len(nums) % 2:
        print("Invalid path coordinate count", file=sys.stderr)
        sys.exit(1)
    xs = [float(nums[i]) for i in range(0, len(nums), 2)]
    ys = [float(nums[i + 1]) for i in range(0, len(nums), 2)]
    bbox = (min(xs), min(ys), max(xs), max(ys))
    return view_box.group(1), d, fill_rule, bbox


def path_el(d: str, fill: str, fill_rule: str) -> str:
    return f'  <path fill="{fill}"{fill_rule} d="{d}" />'


def mark_transform(bbox: tuple[float, float, float, float]) -> tuple[float, float, float]:
    minx, miny, maxx, maxy = bbox
    bw, bh = maxx - minx, maxy - miny
    target = 148
    scale = target / bh
    sw, sh = bw * scale, bh * scale
    tx = (256 - sw) / 2 - minx * scale
    ty = (256 - sh) / 2 - miny * scale
    return tx, ty, scale


def main() -> None:
    view_box, d, fill_rule, bbox = parse_source()

    (KIT / "scribam-glyph.svg").write_text(
        f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}" role="img" aria-label="Scribam mark">
{path_el(d, "#0F172A", fill_rule)}
</svg>
"""
    )

    mtx, mty, mscale = mark_transform(bbox)
    (KIT / "scribam-mark.svg").write_text(
        f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Scribam">
  <rect width="256" height="256" rx="52" fill="#0F172A" />
  <g transform="translate({mtx:.3f} {mty:.3f}) scale({mscale:.6f})">
{path_el(d, "#F8FAFC", fill_rule)}
  </g>
</svg>
"""
    )

    print(f"Synced {SOURCE.name} → scribam-glyph.svg, scribam-mark.svg")


if __name__ == "__main__":
    main()
