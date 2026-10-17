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
    "password-assign": r"(?i)(password|passwd|pwd)\s*[:=]\s*(?P<value>'(?:[^']*)'|\"(?:[^\"]*)\"|\S+)",
    "api-key-assign": r"(?i)(api[_-]?key|auth[_-]?token|access[_-]?token|secret)\s*[:=]\s*['\"]?\S{12,}",
}

SKIP_DIRS = {".git", "node_modules", "dist", "build", ".next", "__pycache__"}
SKIP_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf"}
ALLOWLIST = {"scripts/secret_scan.py"}  # pattern definitions themselves

# Precision filter for "password-assign": the raw pattern must stay broad
# (it is the only generic credential-assignment rule), so false positives are
# excluded semantically instead of by weakening the pattern itself. Only
# documented, non-secret local/test fixture values are allowlisted; every
# unknown literal value still reports.
NON_SECRET_VALUES = {
    "postgres",          # CI service / docker-compose dev database user credential
    "udehlabs_dev",      # documented local docker-compose credential (README)
    "udehlabs_test",     # documented CI database name
    "udehlabs",          # local docker-compose user
    "strong-password-123",  # integration/unit test fixture password (documented)
    "wrong-password-99",    # deliberate wrong-password test fixture
}
CONFIG_EXTS = {".yml", ".yaml", ".env", ".properties", ".ini", ".conf", ".toml"}
IDENTIFIER_RE = re.compile(r"^[A-Za-z_$][\w$]*$")
CODE_EXPR_RE = re.compile(r"[.()\[\]+]")


def is_expected(name: str, value: str, rel_path: str, file_name: str) -> bool:
    """Return True when this password-assign match is a known non-secret.

    Skips: comparisons/operators, env references, template interpolation,
    documented fixtures, type annotations and bare identifiers (e.g.
    "password: string"), and expression values (e.g. "String(body.password)").
    Bare values in config files are treated as literals and still report;
    unknown quoted literals of 8+ characters still report. Other pattern
    names are never filtered here.
    """
    if name != "password-assign":
        return False
    if not value:
        return True
    if value[0] in "=!<>&|":  # comparison or operator, not an assignment
        return True
    if len(value) >= 2 and value[0] in "'\"" and value[-1] == value[0]:
        inner = value[1:-1]
        return inner.lower() in NON_SECRET_VALUES or len(inner) < 8
    if value[0] in ("$", "{"):  # env reference / interpolation
        return True
    if value[0] == "`":  # template literal
        if "${" in value:
            return True
        body = value[1:-1]
        return body.lower() in NON_SECRET_VALUES or len(body) < 8
    core = re.sub(r"[;,),\]}:]+$", "", value)
    if not core:
        return True
    if core.lower() in NON_SECRET_VALUES:
        return True
    ext = Path(file_name).suffix.lower()
    if ext in CONFIG_EXTS or file_name.startswith(".env"):
        return False  # bare config value is a literal credential
    if IDENTIFIER_RE.match(core):  # type word / variable reference
        return True
    if CODE_EXPR_RE.search(core):  # expression, not a literal
        return True
    return False


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
                m = rx.search(line)
                if not m:
                    continue
                value = m.group("value") if "value" in m.groupdict() else m.group(0)
                if is_expected(name, value, rel, path.name):
                    continue
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
