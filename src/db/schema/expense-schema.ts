import { relations, sql } from "drizzle-orm";
import {
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole, crudPolicy } from "drizzle-orm/neon";

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export const transactionTypeEnum = pgEnum("transaction_type", [
  "expense",
  "income",
]);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().default(sql`(auth.user_id())`),
    name: text("name").notNull(),
    icon: text("icon"),
    color: text("color"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("categories_user_id_idx").on(table.userId),
    uniqueIndex("categories_user_id_name_idx").on(table.userId, table.name),
    ...crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }).filter(isDefined),
  ],
).enableRLS();

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().default(sql`(auth.user_id())`),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    notes: text("notes"),
    amount: numeric("amount", { precision: 12, scale: 2, mode: "number" })
      .notNull(),
    type: transactionTypeEnum("type").notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("transactions_user_id_idx").on(table.userId),
    index("transactions_user_id_occurred_at_idx").on(
      table.userId,
      table.occurredAt,
    ),
    index("transactions_category_id_idx").on(table.categoryId),
    ...crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }).filter(isDefined),
  ],
).enableRLS();

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));
