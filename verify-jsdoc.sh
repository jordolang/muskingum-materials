#!/bin/bash

echo "=== JSDoc Coverage Verification ==="
echo ""

total_handlers=0
handlers_with_jsdoc=0
missing_handlers=""

# Find all route.ts files recursively
while IFS= read -r file; do

  # Extract all handler functions
  handlers=$(grep -n '^export async function \(GET\|POST\|PUT\|PATCH\|DELETE\)' "$file" | cut -d: -f1)

  for line_num in $handlers; do
    total_handlers=$((total_handlers + 1))

    # Check if there's a JSDoc comment above this handler
    # Look for /** within 80 lines before the export (some JSDoc comments are very comprehensive, like checkout which spans 70 lines)
    start_line=$((line_num - 80))
    if [ $start_line -lt 1 ]; then
      start_line=1
    fi

    # Extract the range and check for JSDoc
    has_jsdoc=$(sed -n "${start_line},${line_num}p" "$file" | grep -c '/\*\*')

    if [ $has_jsdoc -gt 0 ]; then
      handlers_with_jsdoc=$((handlers_with_jsdoc + 1))
    else
      handler_name=$(sed -n "${line_num}p" "$file" | grep -o 'export async function [A-Z]*' | awk '{print $4}')
      missing_handlers="${missing_handlers}\n  ${file}:${line_num} (${handler_name})"
    fi
  done
done < <(find app/api -name "route.ts" -type f)

handlers_without_jsdoc=$((total_handlers - handlers_with_jsdoc))

echo "Total handlers found: $total_handlers"
echo "Handlers with JSDoc: $handlers_with_jsdoc"
echo "Handlers without JSDoc: $handlers_without_jsdoc"

if [ $handlers_without_jsdoc -gt 0 ]; then
  echo ""
  echo "Missing JSDoc in:"
  echo -e "$missing_handlers"
  exit 1
else
  echo ""
  echo "✓ All handlers have JSDoc!"
  exit 0
fi
