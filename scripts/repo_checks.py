"""Repository integrity checks for Phase 1.

Validates Markdown / HTML / links WITHOUT failing on the intentional
characteristics of the preserved Stitch prototype export:

- Stitch mockups are static prototypes: inline styles, legacy conventions,
  and placeholder links are EXPECTED and never fail the build.
- Only structural errors (missing files, unreadable files, broken
  *repository-relative* links between real files) fail the check.

Usage: python scripts/repo_checks.py
Exit 0 = pass, exit 1 = real repository error.
"""
from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# The preserved prototype export is reference material, not build source.
# We inventory it but never fail on its internal conventions.
PROTOTYPE_DIR = ROOT / "stitch_udehlabs_operating_system"

failures: list[str] = []
warnings: list[str] = []


def check_markdown() -> None:
    """Basic Markdown validity: file readable, has content, headings sane."""
    md_files = [p for p in ROOT.rglob("*.md") if ".git" not in p.parts]
    if not md_files:
        failures.append("markdown: no Markdown files found at all")
        return
    bad_h1 = 0
    for path in md_files:
        try:
            text = path.read_text(encoding="utf-8", errors="strict")
        except Exception as exc:  # unreadable = real error
            failures.append(f"markdown: unreadable {path.relative_to(ROOT)}: {exc}")
            continue
        if not text.strip():
            failures.append(f"markdown: empty file {path.relative_to(ROOT)}")
            continue
        h1s = [ln for ln in text.splitlines() if ln.startswith("# ")]
        if len(h1s) > 1 and PROTOTYPE_DIR not in path.parents:
            # Multiple H1s inside prototype specs are tolerated; new docs are not.
            bad_h1 += 1
            warnings.append(f"markdown: multiple H1s in {path.relative_to(ROOT)}")
    print(f"markdown: checked {len(md_files)} files")


class _TagCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[str] = []
        self.errors: list[str] = []

    VOID = {"br", "hr", "img", "input", "link", "meta", "source", "wbr",
            "area", "base", "col", "embed", "track", "param"}

    def handle_starttag(self, tag: str, attrs: list) -> None:
        if tag not in self.VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag: str) -> None:
        if tag in self.VOID:
            return
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
        elif tag in self.stack:
            # Mismatched nesting inside prototype HTML is tolerated (warning only).
            self.stack.remove(tag)
        else:
            self.errors.append(f"stray </{tag}>")

    def handle_startendtag(self, tag: str, attrs: list) -> None:
        pass


def check_html() -> None:
    """HTML well-formedness inventory.

    Prototype mockups are intentionally preserved static files: parse errors
    there are WARNINGS, never failures. Only unreadable files fail.
    """
    html_files = [p for p in ROOT.rglob("*.html") if ".git" not in p.parts]
    print(f"html: inventoried {len(html_files)} files (prototype conventions tolerated)")
    for path in html_files:
        try:
            text = path.read_text(encoding="utf-8", errors="strict")
        except Exception as exc:
            failures.append(f"html: unreadable {path.relative_to(ROOT)}: {exc}")
            continue
        parser = _TagCollector()
        try:
            parser.feed(text)
        except Exception as exc:
            warnings.append(f"html: parse warning {path.relative_to(ROOT)}: {exc}")
            continue
        for err in parser.errors:
            warnings.append(f"html: {path.relative_to(ROOT)}: {err}")
        if parser.stack and PROTOTYPE_DIR not in path.parents:
            failures.append(
                f"html: unclosed tags {parser.stack} in {path.relative_to(ROOT)}"
            )


def check_links() -> None:
    """Local link checking (no network).

    Only repository-relative links pointing at non-existent files OUTSIDE the
    prototype export fail. Links inside the prototype dir are inventoried only.
    """
    link_re = re.compile(r"\[[^\]]*\]\(([^)#\s]+)\)")
    checked = 0
    for path in ROOT.rglob("*.md"):
        if ".git" in path.parts or PROTOTYPE_DIR in path.parents:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="strict")
        except Exception:
            continue
        for match in link_re.finditer(text):
            target = match.group(1)
            if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", target):
                continue  # external URL: skip (no network-dependent checks)
            checked += 1
            resolved = (path.parent / target).resolve()
            try:
                resolved.relative_to(ROOT.resolve())
            except ValueError:
                failures.append(
                    f"links: {path.relative_to(ROOT)} escapes repo: {target}"
                )
                continue
            if not resolved.exists():
                failures.append(
                    f"links: broken in {path.relative_to(ROOT)}: {target}"
                )
    print(f"links: checked {checked} local links (network checks skipped by design)")


def main() -> int:
    check_markdown()
    check_html()
    check_links()
    for warn in warnings[:20]:
        print(f"WARNING: {warn}")
    if len(warnings) > 20:
        print(f"... and {len(warnings) - 20} more warnings")
    if failures:
        print("FAILURES:")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    print("repo_checks: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
