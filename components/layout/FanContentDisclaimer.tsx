// Required verbatim on every user-facing page — .claude/rules/legal-compliance.md §1.
// This is the entire legal basis for using Clash of Clans data/branding at all,
// not a formality — don't reword it or move it behind a click-through.
export function FanContentDisclaimer() {
  return (
    <p className="px-6 py-4 text-center text-xs text-text-disabled">
      This content is not affiliated with, endorsed, sponsored, or specifically
      approved by Supercell. For more information see{" "}
      <a
        href="https://supercell.com/en/fan-content-policy/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-text-secondary"
      >
        Supercell&apos;s Fan Content Policy
      </a>
      .
    </p>
  );
}
