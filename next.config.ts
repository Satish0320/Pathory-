import type { NextConfig } from "next";

// Kept minimal deliberately — add options here only when a concrete need
// arises (e.g. remote image domains for base screenshots), per CLAUDE.md §3's
// rule against introducing config/complexity ahead of an actual requirement.
const nextConfig: NextConfig = {
  images: {
    // Base screenshots and any CV-fallback assets will be served from here
    // once Phase 1C (fixtures/base-links, screenshot CV path) is built —
    // left empty now rather than guessing a domain before it's known.
    remotePatterns: [],
  },
};

export default nextConfig;
