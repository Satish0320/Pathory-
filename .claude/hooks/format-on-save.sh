#!/bin/bash
# Auto-formats a file immediately after Claude edits it.
# Wire this into settings.json under hooks.PostToolUse for Edit/Write tools.

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

if [[ "$file_path" =~ \.(ts|tsx|js|jsx)$ ]]; then
  npx prettier --write "$file_path" 2>/dev/null
fi

if [[ "$file_path" =~ \.(ts|tsx)$ ]]; then
  npx eslint --fix "$file_path" 2>/dev/null
fi

exit 0
