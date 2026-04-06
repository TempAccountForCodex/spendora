import { and, desc, eq, gte, lt, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { categories, transactions } from "@/db/schema";

export type DashboardTransaction = {
  id: string;
  title: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  date: string;
};

export type DashboardData = {
  expenseTotal: number;
  incomeTotal: number;
  transactions: DashboardTransaction[];
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [summary] = await db
    .select({
      expenseTotal: sql<string>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`,
      incomeTotal: sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.occurredAt, monthStart),
        lt(transactions.occurredAt, nextMonthStart),
      ),
    );

  const recentTransactions = await db
    .select({
      id: transactions.id,
      title: transactions.title,
      amount: transactions.amount,
      type: transactions.type,
      category: categories.name,
      occurredAt: transactions.occurredAt,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.occurredAt))
    .limit(8);

  return {
    expenseTotal: Number(summary?.expenseTotal ?? 0),
    incomeTotal: Number(summary?.incomeTotal ?? 0),
    transactions: recentTransactions.map((transaction) => ({
      id: transaction.id,
      title: transaction.title,
      amount: Number(transaction.amount),
      type: transaction.type,
      category: transaction.category ?? "Uncategorized",
      date: transaction.occurredAt.toISOString().slice(0, 10),
    })),
  };
}
