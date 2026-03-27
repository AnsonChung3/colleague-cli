#!/usr/bin/env bash
set -e

# Always run from the project root regardless of where this script is called from
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "→ Relinking CLI..."
npm link

echo "→ Refreshing completion..."
colleague completion --install

echo ""
echo "Done. Run: source ~/.bashrc"
