---
description: Review the staged diff and write a conventional commit message
---

Look at the currently staged git diff. Write a commit message following conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).

Before writing the message, check the diff against `CLAUDE.md` §2 (Phase 1 scope). If the diff includes anything that looks like Phase 2+ scope (war room, CR, rankings, replay/video analysis, community features), say so explicitly before proposing the commit message — don't silently commit scope creep.

Keep the subject line under 72 characters. Add a body only if the change isn't self-explanatory from the subject and diff alone — don't pad every commit with boilerplate description.
