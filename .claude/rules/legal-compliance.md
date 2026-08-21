---
scope: "app/**, components/**, lib/**, public/**, docs/**"
---

# Legal & Compliance Rules

This is a standalone rule, not a sub-bullet of the API rules, because getting this wrong doesn't just break a feature — it can get the app taken down or exposed to real liability. Read this before shipping anything user-facing, and re-read it before every public release, not just once at project start.

**None of this is legal advice.** These are engineering-relevant checkpoints, not a substitute for an actual lawyer reviewing the Terms of Service, Privacy Policy, and launch plan before real users' data is involved — flag that need to the person rather than assuming this file covers it.

## 1. Supercell Fan Content Policy

Pathory exists entirely inside Supercell's Fan Content Policy — this isn't optional compliance, it's the entire legal basis for the app being allowed to use Clash of Clans/Clash Royale data and branding at all.

- **Disclaimer is mandatory on every user-facing surface** (every page, not just a buried footer link on one page): *"This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell. For more information see Supercell's Fan Content Policy."* Link "Fan Content Policy" to Supercell's current policy page.
- **Never imply official status.** No use of "official," no styling/branding so close to Supercell's own that a reasonable user would think this is a Supercell product. This includes the app name/logo — differentiated branding (which `.claude/skills/ui-ux-pro-max/SKILL.md` already pushes for on design grounds) also serves this legal purpose. Two birds, one requirement.
- **Don't extract or reuse Supercell's actual game assets** — troop/building sprites, icons, artwork ripped from the game files. Build original iconography and illustration for the base overlay, UI icons, and marketing material. This is both a compliance requirement and a design one — see the recurring note in `ui-ux-pro-max/SKILL.md` about avoiding generic/reused icon packs.
- **No pay-to-win adjacency.** Never sell anything that functions as an in-game advantage (this product is coaching/analytics on top of the game, not a mechanism that changes in-game outcomes directly). A paid subscription for better recommendations or deeper history is fine; anything that could be read as "pay us and your attacks do more damage" is not.
- **The policy can change.** Before every public release (not just Phase 1 launch), check the current Fan Content Policy at supercell.com against this file — don't rely on this file being permanently accurate.

## 2. Trademark usage

- "Clash of Clans" and "Clash Royale" are Supercell trademarks. Referring to them descriptively (e.g., "an AI coach for Clash of Clans") is standard fan-content practice; using them as if co-branded, or in a way suggesting partnership, is not.
- The product name ("Pathory") should stand clearly apart from Supercell's own naming and visual identity — already the design direction, reinforced here as a compliance reason too.

## 3. Data privacy — this app stores real people's account and performance history

This is a genuinely global product per the blueprint (`docs/Pathory_Product_Blueprint.docx` — "athletes... all around the world"), which means privacy obligations aren't limited to one jurisdiction.

- **A Privacy Policy and Terms of Service are required before any real user data is collected** — not just best practice, a legal requirement in most jurisdictions this product will have users in. This needs an actual lawyer's review before public launch; flag this explicitly rather than shipping without one.
- **Minors will use this product.** Clash of Clans and Clash Royale have players well under 18. Do not collect more personal data than the product needs (a player tag and gameplay-derived data is not the same risk category as an email/name/location tied to a real identity — be deliberate about which of these are actually necessary). Age-appropriate ToS language and avoiding behavioral-advertising-style data use are both relevant if minors are foreseeably part of the user base.
- **Right to deletion / data export.** A player should be able to request their account and attack history be deleted, and get their own data out. Design the schema (`prisma/schema.prisma`) so a "delete this player's data" operation is a clean cascade, not a multi-table archaeology project — this is both a GDPR-style requirement (EU users) and increasingly expected globally (India's DPDP Act follows a similar principle, relevant given the app is built and likely first-marketed from India).
- **Don't sell or share player performance data with third parties** beyond what's needed to run the product (e.g., a hosted CV inference provider for the screenshot fallback). If a third-party service is added, note in the privacy policy what data it receives.

## 4. Before every public release — checklist

- [ ] Disclaimer present on every user-facing page, current wording
- [ ] No Supercell-extracted assets anywhere in the shipped bundle
- [ ] Privacy Policy and ToS exist, are current, and a real person (not just Claude) has reviewed them
- [ ] Data deletion request path works end-to-end
- [ ] No feature added since the last check that could read as pay-to-win
- [ ] Current Fan Content Policy re-checked against this file for changes
