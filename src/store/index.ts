import { configureStore } from "@reduxjs/toolkit";

import expensesReducer from "@/store/slices/expenses-slice";

export const store = configureStore({
  reducer: {
    expenses: expensesReducer,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
