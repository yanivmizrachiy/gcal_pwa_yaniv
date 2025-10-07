#!/bin/bash
set -euo pipefail

###############################################################################
# Aggregate autonomy reports into timeline.json
# Compiles recent autonomy reports (max 60 entries)
# Output: .autonomy/analytics/timeline.json
###############################################################################

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANALYTICS_DIR="$REPO_ROOT/.autonomy/analytics"
TIMELINE_FILE="$ANALYTICS_DIR/timeline.json"
REPORTS_DIR="$REPO_ROOT/.autonomy/reports"
MAX_ENTRIES=60

# Ensure directories exist
mkdir -p "$ANALYTICS_DIR"
mkdir -p "$REPORTS_DIR"

echo "📊 Aggregating autonomy reports..."

# Initialize or load existing timeline
if [ -f "$TIMELINE_FILE" ]; then
  EXISTING_DATA=$(cat "$TIMELINE_FILE")
else
  EXISTING_DATA='{"timeline":[],"metadata":{"maxEntries":60,"generatedAt":""}}'
fi

# Create temporary working file
TMP_FILE=$(mktemp)
trap "rm -f $TMP_FILE" EXIT

# Start building new timeline
echo '{' > "$TMP_FILE"
echo '  "timeline": [' >> "$TMP_FILE"

# Find all report files and process them
FIRST_ENTRY=true
ENTRY_COUNT=0

# Look for report files in .autonomy/reports/
if [ -d "$REPORTS_DIR" ]; then
  while IFS= read -r report_file; do
    if [ -f "$report_file" ]; then
      filename=$(basename "$report_file")
      timestamp=$(date -r "$report_file" -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "unknown")
      
      # Get file size in bytes
      size_bytes=$(stat -f%z "$report_file" 2>/dev/null || stat -c%s "$report_file" 2>/dev/null || echo 0)
      
      # Determine impact level based on file size
      if [ "$size_bytes" -gt 5000 ]; then
        impact="high"
      elif [ "$size_bytes" -gt 1000 ]; then
        impact="medium"
      else
        impact="low"
      fi
      
      # Extract run ID from filename if available (format: report-RUNID-*.json)
      run_id=$(echo "$filename" | grep -oP '(?<=report-)\d+(?=-)' || echo "unknown")
      
      # Add entry separator
      if [ "$FIRST_ENTRY" = false ]; then
        echo "," >> "$TMP_FILE"
      fi
      FIRST_ENTRY=false
      
      # Add entry
      cat >> "$TMP_FILE" <<EOF
    {
      "file": "$filename",
      "timestamp": "$timestamp",
      "runId": "$run_id",
      "diffBytes": $size_bytes,
      "impact": "$impact"
    }
EOF
      
      ENTRY_COUNT=$((ENTRY_COUNT + 1))
      
      # Limit to MAX_ENTRIES
      if [ "$ENTRY_COUNT" -ge "$MAX_ENTRIES" ]; then
        break
      fi
    fi
  done < <(find "$REPORTS_DIR" -type f -name "*.json" -o -name "*.md" | sort -r | head -n "$MAX_ENTRIES")
fi

# If no entries found, try to extract from git log of workflow runs
if [ "$ENTRY_COUNT" -eq 0 ]; then
  echo "    {" >> "$TMP_FILE"
  echo "      \"file\": \"initial-setup\",\"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"runId\": \"0\",\"diffBytes\": 0,\"impact\": \"low\"" >> "$TMP_FILE"
  echo "    }" >> "$TMP_FILE"
  ENTRY_COUNT=1
fi

# Close timeline array and add metadata
echo "" >> "$TMP_FILE"
echo "  ]," >> "$TMP_FILE"
echo "  \"metadata\": {" >> "$TMP_FILE"
echo "    \"maxEntries\": $MAX_ENTRIES," >> "$TMP_FILE"
echo "    \"totalEntries\": $ENTRY_COUNT," >> "$TMP_FILE"
echo "    \"generatedAt\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"" >> "$TMP_FILE"
echo "  }" >> "$TMP_FILE"
echo "}" >> "$TMP_FILE"

# Format JSON nicely (if jq is available)
if command -v jq &> /dev/null; then
  jq . "$TMP_FILE" > "$TIMELINE_FILE"
else
  cp "$TMP_FILE" "$TIMELINE_FILE"
fi

echo "✅ Timeline aggregated: $TIMELINE_FILE"
echo "📈 Total entries: $ENTRY_COUNT"
