import { and, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db/client";
import { categories, transactions } from "@/db/schema";

export type CreateTransactionInput = {
  title: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  notes?: string;
  occurredAt: Date;
};

export async function createTransactionForUser(
  userId: string,
  input: CreateTransactionInput,
) {
  const normalizedCategory = input.category.trim();

  return db.transaction(async (tx) => {
    const [category] = await tx
      .insert(categories)
      .values({
        userId,
        name: normalizedCategory,
      })
      .onConflictDoUpdate({
        target: [categories.userId, categories.name],
        set: {
          updatedAt: new Date(),
        },
      })
      .returning({
        id: categories.id,
        name: categories.name,
      });

    const [transaction] = await tx
      .insert(transactions)
      .values({
        userId,
        categoryId: category.id,
        title: input.title.trim(),
        notes: input.notes?.trim() ? input.notes.trim() : null,
        amount: input.amount,
        type: input.type,
        occurredAt: input.occurredAt,
      })
      .returning({
        id: transactions.id,
        title: transactions.title,
        amount: transactions.amount,
        type: transactions.type,
        occurredAt: transactions.occurredAt,
      });

    return {
      id: transaction.id,
      title: transaction.title,
      amount: Number(transaction.amount),
      type: transaction.type,
      category: category.name,
      date: transaction.occurredAt.toISOString().slice(0, 10),
      notes: input.notes?.trim() ? input.notes.trim() : null,
    };
  });
}

export async function searchTransactionsForUser(
  userId: string,
  query?: string,
) {
  const normalizedQuery = query?.trim() ?? "";
  const pattern = `%${normalizedQuery}%`;

  const rows = await db
    .select({
      id: transactions.id,
      title: transactions.title,
      amount: transactions.amount,
      type: transactions.type,
      category: categories.name,
      notes: transactions.notes,
      occurredAt: transactions.occurredAt,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      normalizedQuery
        ? and(
            eq(transactions.userId, userId),
            or(
              ilike(transactions.title, pattern),
              ilike(transactions.notes, pattern),
              ilike(categories.name, pattern),
            ),
          )
        : eq(transactions.userId, userId),
    )
    .orderBy(desc(transactions.occurredAt))
    .limit(25);

  return rows.map((transaction) => ({
    id: transaction.id,
    title: transaction.title,
    amount: Number(transaction.amount),
    type: transaction.type,
    category: transaction.category ?? "Uncategorized",
    notes: transaction.notes,
    date: transaction.occurredAt.toISOString().slice(0, 10),
  }));
}

export async function getTransactionForUser(userId: string, transactionId: string) {
  const [transaction] = await db
    .select({
      id: transactions.id,
      title: transactions.title,
      amount: transactions.amount,
      type: transactions.type,
      category: categories.name,
      notes: transactions.notes,
      occurredAt: transactions.occurredAt,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.id, transactionId),
      ),
    )
    .limit(1);

  if (!transaction) {
    return null;
  }

  return {
    id: transaction.id,
    title: transaction.title,
    amount: Number(transaction.amount),
    type: transaction.type,
    category: transaction.category ?? "Uncategorized",
    notes: transaction.notes,
    date: transaction.occurredAt.toISOString().slice(0, 10),
  };
}
