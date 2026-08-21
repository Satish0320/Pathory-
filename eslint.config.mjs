import nextConfig from "eslint-config-next";

// ESLint 9+ requires flat config (this file) — the legacy .eslintrc.json
// format is no longer auto-detected. eslint-config-next v16 ships a native
// flat-config array as its default export, so it's imported directly here —
// do not route this through @eslint/eslintrc's FlatCompat legacy bridge,
// which hits a circular-reference serialization failure with this package's
// React plugin configs (confirmed by actually running eslint, not just
// --print-config, against this project).
export default [...nextConfig];
