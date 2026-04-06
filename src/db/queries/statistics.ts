import { and, eq, gte } from "drizzle-orm";

import type { StatisticsPayload } from "@/features/expenses/types";
import { db } from "@/db/client";
import { transactions } from "@/db/schema";

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export async function getStatisticsData(userId: string): Promise<StatisticsPayload> {
  const now = new Date();
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const rows = await db
    .select({
      amount: transactions.amount,
      type: transactions.type,
      occurredAt: transactions.occurredAt,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.occurredAt, firstMonth),
      ),
    );

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);

    return {
      key: getMonthKey(date),
      label: date.toLocaleDateString(undefined, { month: "short" }),
      income: 0,
      expense: 0,
    };
  });

  const monthMap = new Map(months.map((month) => [month.key, month]));

  for (const row of rows) {
    const key = getMonthKey(row.occurredAt);
    const bucket = monthMap.get(key);

    if (!bucket) {
      continue;
    }

    if (row.type === "income") {
      bucket.income += Number(row.amount);
    } else {
      bucket.expense += Number(row.amount);
    }
  }

  return {
    months,
    incomeTotal: months.reduce((sum, month) => sum + month.income, 0),
    expenseTotal: months.reduce((sum, month) => sum + month.expense, 0),
  };
}
