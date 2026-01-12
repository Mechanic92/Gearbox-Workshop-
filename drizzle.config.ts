import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/schema.ts",
  driver: "turso", // Use turso/libsql driver
  dbCredentials: {
    url: "file:local.db",
  },
  out: "./drizzle",
} satisfies Config;
