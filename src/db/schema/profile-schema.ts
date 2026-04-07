import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { authUid, authenticatedRole, crudPolicy } from "drizzle-orm/neon";

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export const profiles = pgTable(
  "profiles",
  {
    userId: text("user_id").primaryKey().notNull().default(sql`(auth.user_id())`),
    currency: text("currency").notNull().default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("profiles_currency_idx").on(table.currency),
    ...crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }).filter(isDefined),
  ],
).enableRLS();
