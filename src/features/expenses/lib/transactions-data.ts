import type { DashboardPayload, ExpenseTransaction } from "@/features/expenses/types";
import { neonDataFetch } from "@/lib/neon-data-api";

type RawCategoryRow = {
  id: string;
  name: string;
};

type RawTransactionRow = {
  id: string;
  title: string;
  notes: string | null;
  amount: number | string;
  type: "expense" | "income";
  occurred_at: string;
  category_id: string | null;
};

type CreateTransactionInput = {
  title: string;
  amount: number;
  category: string;
  type: "expense" | "income";
  date: string;
  notes?: string | null;
};

function normalizeAmount(value: number | string) {
  const parsedValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeDate(value: string) {
  return value.slice(0, 10);
}

function mapTransactionRow(
  transaction: RawTransactionRow,
  categoryMap: Map<string, string>,
): ExpenseTransaction {
  return {
    id: transaction.id,
    title: transaction.title,
    amount: normalizeAmount(transaction.amount),
    type: transaction.type,
    category:
      (transaction.category_id
        ? categoryMap.get(transaction.category_id)
        : undefined) ?? "Uncategorized",
    date: normalizeDate(transaction.occurred_at),
    notes: transaction.notes,
  };
}

async function listCategories() {
  const categories = await neonDataFetch<RawCategoryRow[]>(
    "/categories?select=id,name",
  );

  return new Map(categories.map((category) => [category.id, category.name]));
}

async function getCategoryByName(name: string) {
  const rows = await neonDataFetch<RawCategoryRow[]>(
    `/categories?select=id,name&name=eq.${encodeURIComponent(name)}&limit=1`,
  );

  return rows[0] ?? null;
}

async function createCategory(name: string) {
  const rows = await neonDataFetch<RawCategoryRow[]>("/categories", {
    method: "POST",
    body: {
      name,
    },
    headers: {
      Prefer: "return=representation",
    },
  });

  if (!rows[0]) {
    throw new Error("Unable to create a category for this transaction.");
  }

  return rows[0];
}

async function getOrCreateCategory(name: string) {
  const existingCategory = await getCategoryByName(name);

  if (existingCategory) {
    return existingCategory;
  }

  return createCategory(name);
}

export async function listTransactions() {
  const [transactions, categoryMap] = await Promise.all([
    neonDataFetch<RawTransactionRow[]>(
      "/transactions?select=id,title,notes,amount,type,occurred_at,category_id&order=occurred_at.desc",
    ),
    listCategories(),
  ]);

  return transactions.map((transaction) =>
    mapTransactionRow(transaction, categoryMap),
  );
}

export async function fetchDashboardFromTransactions(): Promise<DashboardPayload> {
  const transactions = await listTransactions();

  return {
    transactions,
    incomeTotal: transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0),
    expenseTotal: transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0),
  };
}

export async function fetchTransactionById(transactionId: string) {
  const rows = await neonDataFetch<RawTransactionRow[]>(
    `/transactions?select=id,title,notes,amount,type,occurred_at,category_id&id=eq.${encodeURIComponent(
      transactionId,
    )}&limit=1`,
  );

  const transaction = rows[0];

  if (!transaction) {
    return null;
  }

  const categoryMap = transaction.category_id
    ? await listCategories()
    : new Map<string, string>();

  return mapTransactionRow(transaction, categoryMap);
}

export async function createTransaction(input: CreateTransactionInput) {
  const category = await getOrCreateCategory(input.category);
  const rows = await neonDataFetch<RawTransactionRow[]>("/transactions", {
    method: "POST",
    body: {
      title: input.title,
      amount: input.amount,
      type: input.type,
      notes: input.notes?.trim() ? input.notes.trim() : null,
      category_id: category.id,
      occurred_at: `${input.date}T00:00:00.000Z`,
    },
    headers: {
      Prefer: "return=representation",
    },
  });

  if (!rows[0]) {
    throw new Error("Unable to save your transaction.");
  }

  return mapTransactionRow(rows[0], new Map([[category.id, category.name]]));
}
