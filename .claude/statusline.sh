#!/bin/bash
# Renders the bottom status bar in Claude Code: branch, phase, model, token usage.
# Wire into settings.json under "statusLine".

input=$(cat)
model=$(echo "$input" | jq -r '.model.display_name // "unknown"')
branch=$(git branch --show-current 2>/dev/null || echo "no-git")
tokens=$(echo "$input" | jq -r '.cost.total_tokens // "?"')

echo "pathory | phase:1 | $branch | $model | ${tokens} tok"
