import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { DashboardPayload, ExpenseTransaction } from "@/features/expenses/types";
import type { RootState } from "@/store";

type RequestState = "idle" | "loading" | "succeeded" | "failed";

type ExpensesState = {
  transactions: ExpenseTransaction[];
  expenseTotal: number;
  incomeTotal: number;
  status: RequestState;
  error: string | null;
};

const initialState: ExpensesState = {
  transactions: [],
  expenseTotal: 0,
  incomeTotal: 0,
  status: "idle",
  error: null,
};

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    dashboardRequested: (state) => {
      state.status = "loading";
      state.error = null;
    },
    dashboardReceived: (state, action: PayloadAction<DashboardPayload>) => {
      state.transactions = action.payload.transactions;
      state.expenseTotal = action.payload.expenseTotal;
      state.incomeTotal = action.payload.incomeTotal;
      state.status = "succeeded";
      state.error = null;
    },
    dashboardRequestFailed: (state, action: PayloadAction<string>) => {
      state.status = "failed";
      state.error = action.payload;
    },
    clearExpensesState: () => initialState,
  },
});

export const {
  clearExpensesState,
  dashboardReceived,
  dashboardRequested,
  dashboardRequestFailed,
} = expensesSlice.actions;

export const selectTransactions = (state: RootState) =>
  state.expenses.transactions;

export const selectExpenseTotal = (state: RootState) => state.expenses.expenseTotal;

export const selectIncomeTotal = (state: RootState) => state.expenses.incomeTotal;

export const selectExpensesStatus = (state: RootState) => state.expenses.status;

export const selectExpensesError = (state: RootState) => state.expenses.error;

export default expensesSlice.reducer;
