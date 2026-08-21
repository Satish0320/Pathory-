import { defineConfig, env } from "prisma/config";
import { config as loadEnv } from "dotenv";

// Prisma 7+ moved the CLI's datasource URL out of schema.prisma — see the
// comment on the datasource block in prisma/schema.prisma. The CLI only
// auto-loads .env, not .env.local (Next.js's convention), so load it
// explicitly here.
loadEnv({ path: ".env.local" });
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
