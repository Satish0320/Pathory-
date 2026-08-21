import { describe, expect, it } from "vitest";
import { decodeBaseLink } from "../base-link-decoder";

// The TH14/WB link below is a real, publicly shared copy-link (a war base
// listing from a public layout site, not one Pathory controls) used only to
// confirm the format/slot-byte-offset understanding documented in the
// 2026-08-21 entry of .claude/rules/api.md. Real, project-controlled
// fixtures per fixtures/base-links/README.md should still be added once
// available — this test exists to lock in the format itself, not to stand
// in for that fixture set.
const REAL_TH14_WB_URL =
  "https://link.clashofclans.com/en?action=OpenLayout&id=TH14%3AWB%3AAAAAQAAAAAJVzSwyPdweHcbDy0u1UcI9";

// Synthetic payload (bytes[4:8] = 1, rest zero/filler) constructed to match
// the confirmed format — not a real base, just valid-shaped test input.
const SYNTHETIC_TH9_HV_ID = "TH9:HV:AAAAAAAAAAEAAKsAAAAAAAAAAAAAAAAA";

describe("decodeBaseLink", () => {
  it("decodes a real TH14 war-base link (full URL, percent-encoded)", () => {
    const result = decodeBaseLink(REAL_TH14_WB_URL);
    expect(result).toEqual({
      townHallLevel: 14,
      baseType: "warBase",
      layoutSlot: 2,
    });
  });

  it("decodes a bare id string (no URL wrapper) for a home-village base", () => {
    const result = decodeBaseLink(SYNTHETIC_TH9_HV_ID);
    expect(result).toEqual({
      townHallLevel: 9,
      baseType: "homeVillage",
      layoutSlot: 1,
    });
  });

  it("returns null for a malformed Town Hall segment", () => {
    expect(decodeBaseLink("THX:WB:AAAAAAAAAAEAAKsAAAAAAAAAAAAAAAAA")).toBeNull();
  });

  it("returns null for an unrecognized base type code", () => {
    expect(decodeBaseLink("TH14:ZZ:AAAAAAAAAAEAAKsAAAAAAAAAAAAAAAAA")).toBeNull();
  });

  it("returns null when the payload isn't 32 base64 characters", () => {
    expect(decodeBaseLink("TH14:WB:tooShort")).toBeNull();
  });

  it("returns null for a payload with invalid base64 characters", () => {
    expect(decodeBaseLink("TH14:WB:!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")).toBeNull();
  });

  it("returns null when the id doesn't have exactly three colon-separated parts", () => {
    expect(decodeBaseLink("TH14:WB")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(decodeBaseLink("")).toBeNull();
  });

  it("returns null for a well-formed URL missing the id parameter", () => {
    expect(decodeBaseLink("https://link.clashofclans.com/en?action=OpenLayout")).toBeNull();
  });
});
