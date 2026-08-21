#!/bin/bash
# Fires at the start of every Claude Code session in this repo.
# Prints the current phase scope so it's surfaced automatically, not just
# something Claude has to remember to go check CLAUDE.md for.
# Wire into settings.json under hooks.SessionStart.

cat <<'EOF'
[Pathory] Current phase: PHASE 1 — core attack recommendation loop only.
In scope: base intake, account sync, recommendation + reasoning, visual overlay, post-attack self-report, skill profile.
Out of scope until Phase 1 has real returning users: War Room, CR, rankings, rivalry memory, training mode, video/replay analysis.
Full detail: CLAUDE.md §2. Product vision: docs/Pathory_Product_Blueprint.docx.
EOF
