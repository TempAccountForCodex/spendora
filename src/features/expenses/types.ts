export type ExpenseTransaction = {
  id: string;
  title: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  date: string;
  notes?: string | null;
};

export type DashboardPayload = {
  expenseTotal: number;
  incomeTotal: number;
  transactions: ExpenseTransaction[];
};

export type StatisticsMonth = {
  key: string;
  label: string;
  income: number;
  expense: number;
};

export type StatisticsPayload = {
  months: StatisticsMonth[];
  incomeTotal: number;
  expenseTotal: number;
};

export type SearchTransactionsPayload = {
  query: string;
  transactions: ExpenseTransaction[];
};

export type TransactionDetailPayload = {
  transaction: ExpenseTransaction;
};
