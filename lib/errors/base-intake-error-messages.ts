import type { UserFacingError } from "./coc-error-messages";

// Base-intake-specific failure modes, following the same what/why/action
// shape and single-source-of-truth rule as coc-error-messages.ts — see
// .claude/skills/error-states/SKILL.md.
export const BASE_LINK_UNREADABLE: UserFacingError = {
  what: "We couldn't read that base link.",
  why: "The link might be broken, expired, or in a format we don't support yet.",
  action: "Try copying the link again, or upload a screenshot instead.",
  recoverable: false,
};

export const SCREENSHOT_TOO_LARGE: UserFacingError = {
  what: "That screenshot is too large to process.",
  why: "Screenshots over 8MB can't be analyzed.",
  action: "Try a smaller image or a cropped screenshot of just the base.",
  recoverable: false,
};

export const SCREENSHOT_UNSUPPORTED_FORMAT: UserFacingError = {
  what: "We couldn't read that image.",
  why: "Only JPEG and PNG screenshots are supported right now.",
  action: "Save the screenshot as a JPEG or PNG and try again.",
  recoverable: false,
};

export const NO_INPUT_PROVIDED: UserFacingError = {
  what: "Add a base link or a screenshot to continue.",
  why: "We need at least one to read the base.",
  action: "Paste a copy-link, upload a screenshot, or both.",
  recoverable: false,
};

export function cvFailureToUserFacingError(): UserFacingError {
  return {
    what: "We couldn't analyze that screenshot right now.",
    why: "Our base-reading service is temporarily unavailable.",
    action: "Try again in a minute.",
    recoverable: true,
  };
}
