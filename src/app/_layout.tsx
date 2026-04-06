import { Stack } from "expo-router";
import { Provider } from "react-redux";

import { colors } from "@/constants/theme";
import { store } from "@/store";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "default",
          animationTypeForReplace: "push",
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="get-started" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="select-currency" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="home" />
        <Stack.Screen name="add-transaction" />
        <Stack.Screen name="transaction/[id]" />
      </Stack>
    </Provider>
  );
}
