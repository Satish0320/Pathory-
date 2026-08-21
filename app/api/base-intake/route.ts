import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { decodeBaseLink } from "@/lib/coc-api/base-link-decoder";
import { analyzeBaseScreenshot } from "@/lib/coc-api/screenshot-cv";
import type { UserFacingError } from "@/lib/errors/coc-error-messages";
import {
  BASE_LINK_UNREADABLE,
  NO_INPUT_PROVIDED,
  SCREENSHOT_TOO_LARGE,
  SCREENSHOT_UNSUPPORTED_FORMAT,
  cvFailureToUserFacingError,
} from "@/lib/errors/base-intake-error-messages";

const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

type FieldResult<T> = { ok: true; data: T } | { ok: false; error: UserFacingError };

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const formData = await req.formData();
  const baseLink = formData.get("baseLink");
  const screenshot = formData.get("screenshot");

  const hasLink = typeof baseLink === "string" && baseLink.trim().length > 0;
  const hasScreenshot = screenshot instanceof File && screenshot.size > 0;

  if (!hasLink && !hasScreenshot) {
    return NextResponse.json({ error: NO_INPUT_PROVIDED }, { status: 400 });
  }

  // Each input is analyzed independently — see
  // .claude/skills/interface-states/SKILL.md's "partial success" state: a
  // bad link shouldn't block a valid screenshot's CV result, or vice versa.
  let linkResult: FieldResult<ReturnType<typeof decodeBaseLink>> | null = null;
  if (hasLink) {
    const decoded = decodeBaseLink(baseLink as string);
    linkResult = decoded
      ? { ok: true, data: decoded }
      : { ok: false, error: BASE_LINK_UNREADABLE };
  }

  let cvResult: FieldResult<Awaited<ReturnType<typeof analyzeBaseScreenshot>>> | null = null;
  if (hasScreenshot) {
    const file = screenshot as File;
    if (file.size > MAX_SCREENSHOT_BYTES) {
      cvResult = { ok: false, error: SCREENSHOT_TOO_LARGE };
    } else if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      cvResult = { ok: false, error: SCREENSHOT_UNSUPPORTED_FORMAT };
    } else {
      try {
        const bytes = Buffer.from(await file.arrayBuffer());
        const reading = await analyzeBaseScreenshot(bytes.toString("base64"));
        cvResult = { ok: true, data: reading };
      } catch {
        cvResult = { ok: false, error: cvFailureToUserFacingError() };
      }
    }
  }

  return NextResponse.json({ linkResult, cvResult });
}
