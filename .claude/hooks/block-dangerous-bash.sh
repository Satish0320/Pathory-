#!/bin/bash
# Blocks destructive commands before they run.
# Wire this into settings.json under hooks.PreToolUse for the Bash tool.

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')

blocked_patterns=(
  "rm -rf /"
  "rm -rf \*"
  "git push --force"
  "git push -f"
  "DROP TABLE"
  "DROP DATABASE"
  "TRUNCATE"
)

for pattern in "${blocked_patterns[@]}"; do
  if echo "$command" | grep -qi "$pattern"; then
    echo "{\"decision\": \"block\", \"reason\": \"Blocked potentially destructive command matching: $pattern. Confirm with the person directly before running anything like this.\"}"
    exit 0
  fi
done

echo "{\"decision\": \"allow\"}"
