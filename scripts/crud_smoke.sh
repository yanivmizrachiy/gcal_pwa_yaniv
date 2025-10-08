#!/usr/bin/env bash
set -euo pipefail
BASE="$1"
CREATE=$(curl -sS -X POST "$BASE" -H 'Content-Type: application/json' -d '{"action":"create","title":"AutoOps Smoke","start":"now+2m","end":"now+12m"}')
ID=$(echo "$CREATE" | jq -r '.event_id // empty'); [ -z "$ID" ] && { echo "No event_id"; exit 10; }
curl -sS -X POST "$BASE" -H 'Content-Type: application/json' -d "{\"action\":\"update\",\"event_id\":\"$ID\",\"title\":\"AutoOps Smoke (updated)\"}" >/dev/null
curl -sS -X POST "$BASE" -H 'Content-Type: application/json' -d "{\"action\":\"delete\",\"event_id\":\"$ID\"}" >/dev/null
mkdir -p status; jq -n --arg id "$ID" '{ok:true,smoke:true,event_id:$id}' > status/crud-report.json
