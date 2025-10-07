#!/bin/bash
set -euo pipefail

###############################################################################
# Generate SHA256 hash manifest for core automation scripts
# Output: .autonomy/security/script_hashes.manifest
###############################################################################

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST_DIR="$REPO_ROOT/.autonomy/security"
MANIFEST_FILE="$MANIFEST_DIR/script_hashes.manifest"

# Ensure directory exists
mkdir -p "$MANIFEST_DIR"

# Generate manifest header
cat > "$MANIFEST_FILE" <<EOF
# SHA256 Hash Manifest for Core Automation Scripts
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Format: <hash> <filepath>
#
# This file ensures integrity of critical automation scripts.
# Verify with: node scripts/verify_hashes.js

EOF

# Function to add file hash to manifest
add_hash() {
  local file="$1"
  if [ -f "$REPO_ROOT/$file" ]; then
    local hash=$(sha256sum "$REPO_ROOT/$file" | awk '{print $1}')
    echo "$hash  $file" >> "$MANIFEST_FILE"
    echo "✓ Added: $file"
  else
    echo "⚠ Skipped (not found): $file"
  fi
}

echo "🔨 Generating hash manifest..."
echo

# Add core automation scripts
add_hash "scripts/verify_hashes.js"
add_hash "scripts/generate_hash_manifest.sh"
add_hash "scripts/aggregate_reports.sh"

# Add workflow files (optional, can be extended)
for workflow in .github/workflows/*.yml; do
  if [ -f "$workflow" ]; then
    relative_path="${workflow#$REPO_ROOT/}"
    add_hash "$relative_path"
  fi
done

echo
echo "✅ Manifest generated: $MANIFEST_FILE"
echo "📄 Total entries: $(grep -c '^[^#]' "$MANIFEST_FILE" || echo 0)"
