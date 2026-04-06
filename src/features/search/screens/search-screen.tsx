import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { HeroScreen } from "@/components/layout/hero-screen";
import { colors, gradients, radius, spacing, typography } from "@/constants/theme";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import type {
  ExpenseTransaction,
  SearchTransactionsPayload,
} from "@/features/expenses/types";
import { appApiFetch } from "@/lib/app-api-client";
import { formatCurrency, getUserCurrencyCode } from "@/lib/currency";
import { hp, rs, wp } from "@/lib/responsive";

type LoadState = "idle" | "loading" | "succeeded" | "failed";

function formatDateLabel(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SearchScreenView() {
  const router = useRouter();
  const { user } = useAuthSession();
  const currencyCode = getUserCurrencyCode(
    (user as { currency?: string | null } | null)?.currency,
  );
  const [query, setQuery] = useState("");
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const timeoutId = setTimeout(() => {
      const loadResults = async () => {
        setStatus("loading");
        setError(null);

        try {
          const payload = await appApiFetch<SearchTransactionsPayload>(
            `/api/transactions?query=${encodeURIComponent(query.trim())}`,
          );

          if (!isCancelled) {
            setTransactions(payload.transactions);
            setStatus("succeeded");
          }
        } catch (loadError) {
          if (!isCancelled) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Unable to search transactions.",
            );
            setStatus("failed");
          }
        }
      };

      void loadResults();
    }, 220);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  const resultsLabel = useMemo(() => {
    if (!query.trim()) {
      return "Recent transactions";
    }

    return `Results for "${query.trim()}"`;
  }, [query]);

  return (
    <HeroScreen>
      {(topInset) => (
        <View style={styles.screen}>
          <LinearGradient
            colors={gradients.splash}
            style={[styles.hero, { paddingTop: topInset + spacing.sm }]}
          >
            <View style={[styles.ring, styles.ringOne]} />
            <View style={[styles.ring, styles.ringTwo]} />

            <View style={styles.headerRow}>
              <View style={styles.headerIconButton} />
              <Text style={styles.headerTitle}>Search</Text>
            </View>

            <View style={styles.curveCut} />
          </LinearGradient>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.searchField}>
              <Feather name="search" size={rs(18)} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search transactions"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
              />
            </View>

            <Text style={styles.resultsHeading}>{resultsLabel}</Text>

            {status === "loading" ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={colors.primaryDark} />
                <Text style={styles.stateText}>Searching transactions...</Text>
              </View>
            ) : null}

            {status === "failed" ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateText}>
                  {error ?? "Unable to search transactions."}
                </Text>
              </View>
            ) : null}

            {status === "succeeded" && transactions.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateText}>No matching transactions found.</Text>
              </View>
            ) : null}

            {transactions.map((transaction) => (
              <Pressable
                key={transaction.id}
                style={styles.resultCard}
                onPress={() => router.push(`/transaction/${transaction.id}`)}
              >
                <View style={styles.resultHeader}>
                  <View style={styles.resultMeta}>
                    <Text style={styles.resultTitle}>{transaction.title}</Text>
                    <Text style={styles.resultCategory}>{transaction.category}</Text>
                  </View>
                  <Text
                    style={[
                      styles.resultAmount,
                      transaction.type === "income"
                        ? styles.resultIncome
                        : styles.resultExpense,
                    ]}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount, currencyCode)}
                  </Text>
                </View>

                <Text style={styles.resultDate}>{formatDateLabel(transaction.date)}</Text>
                {transaction.notes ? (
                  <Text style={styles.resultNotes}>{transaction.notes}</Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  hero: {
    minHeight: hp(18),
    paddingHorizontal: spacing.lg,
    overflow: "hidden",
  },
  ring: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.pill,
  },
  ringOne: {
    top: -hp(10),
    left: wp(18),
    width: wp(44),
    height: wp(44),
  },
  ringTwo: {
    top: hp(1),
    left: -wp(6),
    width: wp(78),
    height: wp(78),
  },
  headerRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: rs(40),
  },
  headerIconButton: {
    width: rs(40),
    height: rs(40),
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    position: "absolute",
    left: rs(56),
    right: rs(56),
    fontSize: rs(20),
    lineHeight: rs(24),
    fontWeight: "800",
    color: colors.white,
    textAlign: "center",
  },
  curveCut: {
    position: "absolute",
    left: -wp(8),
    right: -wp(8),
    bottom: -hp(7.2),
    height: hp(13),
    borderTopLeftRadius: rs(220),
    borderTopRightRadius: rs(220),
    backgroundColor: colors.white,
  },
  body: {
    flex: 1,
    marginTop: -hp(0),
    backgroundColor: colors.white,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: hp(14),
  },
  searchField: {
    minHeight: rs(56),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    paddingVertical: spacing.sm,
  },
  resultsHeading: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    fontWeight: "700",
    color: colors.textMuted,
  },
  stateCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  stateText: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.textMuted,
    textAlign: "center",
  },
  resultCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xs,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  resultMeta: {
    flex: 1,
    gap: spacing.xxs,
  },
  resultTitle: {
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    fontWeight: "800",
    color: colors.text,
  },
  resultCategory: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.primaryDark,
  },
  resultAmount: {
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    fontWeight: "800",
  },
  resultIncome: {
    color: "#2FB36D",
  },
  resultExpense: {
    color: "#FF7A6E",
  },
  resultDate: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.textMuted,
  },
  resultNotes: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.text,
  },
});
