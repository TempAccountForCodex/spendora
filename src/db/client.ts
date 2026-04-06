import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "@/db/schema";

neonConfig.webSocketConstructor = ws;

declare global {
  var __spendoraNeonPool__: Pool | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing.");
}

const pool =
  global.__spendoraNeonPool__ ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  global.__spendoraNeonPool__ = pool;
}

export const db = drizzle({
  client: pool,
  schema,
});

export type DB = typeof db;
