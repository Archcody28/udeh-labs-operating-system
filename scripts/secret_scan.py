"""Repository secret scanner for Phase 1 CI + local use.

Scans committed text files for likely credentials WITHOUT ever printing
secret values: matches are reported as <path>:<line> + pattern name only.

Usage: python scripts/secret_scan.py [--redact] [--staged]
  --redact  (CI default) exit 1 on any match, print no values
  --staged  scan only git-staged files (pre-commit style)

Exit 0 = clean, exit 1 = suspicious pattern found.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# The preserved Stitch prototype export is read-only reference material.
# Its static mockups contain long URL/token-like substrings (e.g. Google
# image URLs with "sk-...") that trip generic key patterns. Prototype files
# are therefore inventoried as advisory WARNINGS, never hard failures:
# failing the build on intentionally preserved artifacts would violate
# the Phase 1 "distinguish real errors from prototype characteristics" rule.
PROTOTYPE_DIR = ROOT / "stitch_udehlabs_operating_system"

PATTERNS: dict[str, str] = {
    "aws-access-key": r"AKIA[0-9A-Z]{16}",
    "aws-secret": r"aws_secret_access_key\s*=\s*\S+",
    "github-token": r"gh[pousr]_[A-Za-z0-9]{36,}",
    "openai-key": r"sk-(proj-)?[A-Za-z0-9_-]{20,}",
    "stripe-key": r"s[kr]_(live|test)_[A-Za-z0-9]{16,}",
    "private-key-block": r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----",
    "password-assign": r"(?i)(password|passwd|pwd)\s*[:=]\s*\S+",
    "api-key-assign": r"(?i)(api[_-]?key|auth[_-]?token|access[_-]?token|secret)\s*[:=]\s*['\"]?\S{12,}",
}

SKIP_DIRS = {".git", "node_modules", "dist", "build", ".next", "__pycache__"}
SKIP_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf"}
ALLOWLIST = {"scripts/secret_scan.py"}  # pattern definitions themselves


def candidate_files(staged_only: bool) -> list[Path]:
    if staged_only:
        out = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
            capture_output=True, text=True, cwd=ROOT,
        )
        return [ROOT / line for line in out.stdout.splitlines() if line.strip()]
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() in SKIP_EXTS:
            continue
        rel = path.relative_to(ROOT).as_posix()
        if rel in ALLOWLIST or rel.startswith(".git/"):
            continue
        files.append(path)
    return files


def main() -> int:
    staged = "--staged" in sys.argv
    compiled = {name: re.compile(rx) for name, rx in PATTERNS.items()}
    hits = 0
    advisories = 0
    for path in candidate_files(staged):
        try:
            text = path.read_text(encoding="utf-8", errors="strict")
        except Exception:
            continue  # binary/unreadable: skip
        rel = path.relative_to(ROOT).as_posix()
        try:
            in_prototype = PROTOTYPE_DIR in path.resolve().parents
        except Exception:
            in_prototype = False
        for lineno, line in enumerate(text.splitlines(), 1):
            for name, rx in compiled.items():
                if rx.search(line):
                    # NEVER print the matched value — path + line + rule only.
                    tag = "ADVISORY (preserved prototype)" if in_prototype else "SUSPICIOUS"
                    print(f"{tag} {rel}:{lineno} [{name}]")
                    if in_prototype:
                        advisories += 1
                    else:
                        hits += 1
                    break
    if advisories:
        print(f"secret_scan: {advisories} advisory match(es) inside preserved prototype (non-blocking)")
    if hits:
        print(f"secret_scan: {hits} suspicious match(es) — review before merging")
        return 1
    print("secret_scan: clean")
    return 0


if __name__ == "__main__":
    sys.exit(main())
