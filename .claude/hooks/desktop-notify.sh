#!/bin/bash
# Pings the desktop when Claude finishes a task — useful for long agentic runs
# (e.g. scaffolding the recommendation engine, running a full test suite).
# Wire into settings.json under hooks.Stop.

title="Pathory"
message="Claude finished the current task."

if command -v notify-send &> /dev/null; then
  notify-send "$title" "$message"
elif command -v osascript &> /dev/null; then
  osascript -e "display notification \"$message\" with title \"$title\""
fi

exit 0
