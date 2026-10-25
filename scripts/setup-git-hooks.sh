#!/usr/bin/env sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit

echo "Git hooks enabled (core.hooksPath=.githooks)"
echo "Pre-commit runs: format:check, lint, typecheck, test"
