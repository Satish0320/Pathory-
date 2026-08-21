import type { Config } from "tailwindcss";
import tokens from "./design/tokens.json";

// This file has no hardcoded design values on purpose — see
// .claude/skills/ui-ux-pro-max/SKILL.md and design/tokens.json's own
// $comment: that file is the single source of truth. If a color, spacing,
// or motion value needs to change, change it there — never here directly,
// or the two will drift and .claude/rules/code-quality.md's "no repetition"
// rule is being violated.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: tokens.color.background,
        text: tokens.color.text,
        accent: tokens.color.accent,
        accentSecondary: tokens.color.accentSecondary,
        semantic: tokens.color.semantic,
        chart: tokens.color.chart.series.reduce(
          (acc, color, i) => ({ ...acc, [`series${i + 1}`]: color }),
          {} as Record<string, string>
        ),
      },
      fontSize: tokens.typography.scale,
      fontFamily: {
        sans: [tokens.typography.bodyFont, "system-ui", "sans-serif"],
        display: [tokens.typography.displayFont, "system-ui", "sans-serif"],
      },
      spacing: tokens.spacing.scale.reduce(
        (acc, val, i) => ({ ...acc, [i]: `${val}px` }),
        {} as Record<number, string>
      ),
      transitionDuration: {
        fast: tokens.motion.duration.fast,
        DEFAULT: tokens.motion.duration.base,
        deploySequence: tokens.motion.duration.deploySequence,
      },
      transitionTimingFunction: {
        standard: tokens.motion.easing.standard,
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        // Reveal transition per .claude/skills/ui-ux-pro-max/SKILL.md's
        // "purposeful, not decorative" motion guidance — use with the
        // motion-safe: variant so prefers-reduced-motion users just see the
        // content appear, per design/tokens.json's accessibility note.
        "fade-in": `fadeIn ${tokens.motion.duration.base} ${tokens.motion.easing.standard}`,
      },
    },
  },
  plugins: [],
};

export default config;
