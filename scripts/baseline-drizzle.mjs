import "dotenv/config";

import crypto from "node:crypto";
import { readFile } from "node:fs/promises";

import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

const journal = JSON.parse(
  await readFile(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"),
);
const latestMigration = journal.entries.at(-1);

if (!latestMigration) {
  throw new Error("No Drizzle migrations were found to baseline.");
}

const migrationSql = await readFile(
  new URL(`../drizzle/${latestMigration.tag}.sql`, import.meta.url),
  "utf8",
);
const migrationHash = crypto
  .createHash("sha256")
  .update(migrationSql)
  .digest("hex");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const requiredTables = ["user", "session", "account", "verification"];

try {
  const existingTables = await pool.query(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])
    `,
    [requiredTables],
  );

  if (existingTables.rowCount !== requiredTables.length) {
    throw new Error(
      `Cannot baseline Drizzle because the expected Better Auth tables are missing. Found ${existingTables.rowCount}/${requiredTables.length} tables.`,
    );
  }

  await pool.query(`create schema if not exists drizzle`);
  await pool.query(`
    create table if not exists drizzle.__drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `);

  const currentMigration = await pool.query(
    `
      select hash, created_at
      from drizzle.__drizzle_migrations
      where hash = $1 and created_at = $2
      limit 1
    `,
    [migrationHash, latestMigration.when],
  );

  if (currentMigration.rowCount) {
    console.log(`Drizzle baseline already recorded for ${latestMigration.tag}.`);
    process.exit(0);
  }

  await pool.query(
    `
      insert into drizzle.__drizzle_migrations (hash, created_at)
      values ($1, $2)
    `,
    [migrationHash, latestMigration.when],
  );

  console.log(`Baselined Drizzle migration ${latestMigration.tag}.`);
} finally {
  await pool.end();
}
