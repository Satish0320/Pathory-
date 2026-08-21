// Pure function, no API calls, no side effects — see
// .claude/skills/coc-api-integration/SKILL.md. Only extracts what a base
// copy-link actually encodes locally: Town Hall level, base type, and layout
// slot. It does NOT and cannot extract building positions — see the
// 2026-08-21 correction in .claude/rules/api.md for why. Screenshot CV
// (lib/coc-api/screenshot-cv.ts, once built) is the real source of building
// data; this is a fast, exact sanity check alongside it.

export type BaseType = "warBase" | "homeVillage";

export interface DecodedBaseLink {
  townHallLevel: number;
  baseType: BaseType;
  layoutSlot: number;
}

const BASE_TYPE_CODES: Record<string, BaseType> = {
  WB: "warBase",
  HV: "homeVillage",
};

const PAYLOAD_BYTE_LENGTH = 24;
const SLOT_OFFSET = 4;

function extractRawId(link: string): string | null {
  const trimmed = link.trim();

  // Accept either a bare "TH14:WB:..." id or a full link.clashofclans.com URL.
  if (!trimmed.includes("://")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const id = url.searchParams.get("id");
    return id;
  } catch {
    return null;
  }
}

function decodeBase64Payload(payload: string): Uint8Array | null {
  // The payload is URL-safe base64 without padding; normalize to standard
  // base64 before decoding. Always exactly 32 chars -> 24 bytes, no padding
  // needed (32 * 6 bits = 192 bits = 24 bytes exactly).
  if (payload.length !== 32) return null;

  const standardBase64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]+$/.test(standardBase64)) return null;

  try {
    const binary = atob(standardBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.length === PAYLOAD_BYTE_LENGTH ? bytes : null;
  } catch {
    return null;
  }
}

function readSlot(bytes: Uint8Array): number {
  // Layout slot is a big-endian uint32 at bytes[4:8] — confirmed against a
  // real link during the 1C investigation (see .claude/rules/api.md).
  // Non-null assertions are safe here: the caller already validated bytes
  // is exactly PAYLOAD_BYTE_LENGTH (24) long, well past index 7.
  return (
    (bytes[SLOT_OFFSET]! << 24) |
    (bytes[SLOT_OFFSET + 1]! << 16) |
    (bytes[SLOT_OFFSET + 2]! << 8) |
    bytes[SLOT_OFFSET + 3]!
  );
}

export function decodeBaseLink(link: string): DecodedBaseLink | null {
  const rawId = extractRawId(link);
  if (!rawId) return null;

  const parts = rawId.split(":");
  if (parts.length !== 3) return null;

  // Safe to assert non-null: the length check above guarantees exactly
  // three elements.
  const [thPart, typeCode, payload] = parts as [string, string, string];

  const thMatch = /^TH(\d{1,2})$/.exec(thPart);
  if (!thMatch) return null;
  const townHallLevel = Number(thMatch[1]);

  const baseType = BASE_TYPE_CODES[typeCode];
  if (!baseType) return null;

  const bytes = decodeBase64Payload(payload);
  if (!bytes) return null;

  return {
    townHallLevel,
    baseType,
    layoutSlot: readSlot(bytes),
  };
}
