#!/usr/bin/env bash
# Downloads the original login background photo from the Kloudspot Figma file.
#
# View-only Figma accounts can't export an image fill without its child layers baked in,
# but the REST API serves the original upload for any file you can view.
#
# Needs a Figma personal access token (Figma → Settings → Security → Personal access
# tokens, scope "File content: read-only"). The token is read with hidden input and only
# sent to api.figma.com; it is never written to disk.
set -euo pipefail

FILE_KEY="z5i2Uq31VuHTQvtbhIbZS6"
WRAPPER_NODE="7:10922" # Login → wrapper; its image fill is the office photo
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/scripts/.figma-download"
mkdir -p "$OUT_DIR"

read -r -s -p "Figma personal access token: " FIGMA_TOKEN
echo

api() { curl -fsS -H "X-Figma-Token: ${FIGMA_TOKEN}" "https://api.figma.com/v1/$1"; }

echo "Looking up the wrapper's image fill…"
REF=$(api "files/${FILE_KEY}/nodes?ids=${WRAPPER_NODE}" | python3 -c '
import json, sys
doc = json.load(sys.stdin)["nodes"]["'"${WRAPPER_NODE}"'"]["document"]
refs = [f["imageRef"] for f in doc.get("fills", []) if f.get("type") == "IMAGE" and f.get("imageRef")]
print(refs[0] if refs else "")')
[ -n "$REF" ] || { echo "No image fill found on ${WRAPPER_NODE}." >&2; exit 1; }

URL=$(api "files/${FILE_KEY}/images" | python3 -c 'import json,sys; print(json.load(sys.stdin)["meta"]["images"].get(sys.argv[1], ""))' "$REF")
[ -n "$URL" ] || { echo "Figma returned no URL for image ${REF}." >&2; exit 1; }

curl -fsSL -o "${OUT_DIR}/login-bg-original" "$URL"
echo "Saved: ${OUT_DIR}/login-bg-original"
file "${OUT_DIR}/login-bg-original"
