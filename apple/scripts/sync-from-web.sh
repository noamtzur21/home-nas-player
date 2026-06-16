#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FRONTEND="$ROOT/media-server/frontend"
OUT="$ROOT/apple/web-dist"

echo "Building web app (unchanged source in media-server/frontend)..."
cd "$FRONTEND"
npm run build

echo "Copying dist → apple/web-dist ..."
rm -rf "$OUT"
mkdir -p "$OUT"
cp -R "$FRONTEND/dist/"* "$OUT/"

echo "Done. Run: cd apple && npx cap sync ios"
