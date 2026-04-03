#!/bin/bash
# Assembles index.html from the template and individual API JSON files.
#
# Usage: ./etc/build.sh
#
# The order of JSON files here determines the sidebar category order.

set -euo pipefail
cd "$(dirname "$0")"
OUT=".."

CATEGORIES=(
  blockchain
  mempool
  transactions
  index
  names
  wallet
  payments
  auctions
  batch
  building
  signing
  backup
  network
  mining
  control
)

# Combine category JSON files into a single array
json="["
first=true
for cat in "${CATEGORIES[@]}"; do
  file="api/${cat}.json"
  if [ ! -f "$file" ]; then
    echo "error: missing $file" >&2
    exit 1
  fi
  if [ "$first" = true ]; then
    first=false
  else
    json+=","
  fi
  json+=$(python3 -c "import json; print(json.dumps(json.load(open('$file')), separators=(',',':'), ensure_ascii=False))")
done
json+="]"

# Replace placeholder in template
python3 -c "
import sys
with open('index.template.html') as f:
    template = f.read()
json_data = sys.stdin.read()
output = template.replace('%%API_DATA%%', json_data)
with open('$OUT/index.html', 'w') as f:
    f.write(output)
" <<< "$json"

echo "Built index.html ($(wc -c < "$OUT/index.html" | tr -d ' ') bytes)"
