import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { HeroScreen } from "@/components/layout/hero-screen";
import { colors, gradients, radius, spacing, typography } from "@/constants/theme";
import { listTransactions } from "@/features/expenses/lib/transactions-data";
import type { StatisticsPayload } from "@/features/expenses/types";
import { formatCurrency, getUserCurrencyCode } from "@/lib/currency";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { hp, rs } from "@/lib/responsive";

type LoadState = "idle" | "loading" | "succeeded" | "failed";

function buildStatisticsPayload(
  transactions: Awaited<ReturnType<typeof listTransactions>>,
): StatisticsPayload {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

    return {
      key,
      label: date.toLocaleDateString(undefined, { month: "short" }),
      income: 0,
      expense: 0,
    };
  });

  const monthMap = new Map(months.map((month) => [month.key, month]));

  for (const transaction of transactions) {
    const date = new Date(transaction.date);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const month = monthMap.get(key);

    if (!month) {
      continue;
    }

    if (transaction.type === "income") {
      month.income += transaction.amount;
    } else {
      month.expense += transaction.amount;
    }
  }

  return {
    months,
    incomeTotal: transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0),
    expenseTotal: transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0),
  };
}

export function StatisticsScreenView() {
  const { user } = useAuthSession();
  const currencyCode = getUserCurrencyCode(user?.currency);
  const [data, setData] = useState<StatisticsPayload | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const transactions = await listTransactions();
      setData(buildStatisticsPayload(transactions));
      setStatus("succeeded");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load statistics.",
      );
      setStatus("failed");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStatistics();
    }, [loadStatistics]),
  );

  const maxValue = useMemo(() => {
    const values = data?.months.flatMap((month) => [month.income, month.expense]) ?? [];
    return Math.max(...values, 1);
  }, [data]);

  return (
    <HeroScreen>
      {(topInset) => (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.splash}
          style={[styles.hero, { paddingTop: topInset + spacing.lg }]}
        >
          <Text style={styles.eyebrow}>Overview</Text>
          <Text style={styles.title}>Monthly Statistics</Text>
          <Text style={styles.subtitle}>
            Income and spending across the last 6 months.
          </Text>

          <View style={styles.summaryRow}>
            <SummaryPill
              label="Income"
              value={formatCurrency(data?.incomeTotal ?? 0, currencyCode)}
              tone="income"
            />
            <SummaryPill
              label="Spending"
              value={formatCurrency(data?.expenseTotal ?? 0, currencyCode)}
              tone="expense"
            />
          </View>
        </LinearGradient>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Graph</Text>
            <View style={styles.legendRow}>
              <LegendChip color="#58C79A" label="Income" />
              <LegendChip color="#FF8B7A" label="Spend" />
            </View>
          </View>

          {status === "loading" ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={colors.primaryDark} />
              <Text style={styles.stateText}>Loading statistics...</Text>
            </View>
          ) : null}

          {status === "failed" ? (
            <View style={styles.stateWrap}>
              <Text style={styles.stateText}>{error ?? "Unable to load statistics."}</Text>
            </View>
          ) : null}

          {status === "succeeded" && data ? (
            <View style={styles.chartWrap}>
              <View style={styles.chart}>
                {data.months.map((month) => {
                  const incomeHeight = Math.max(
                    6,
                    (month.income / maxValue) * hp(14),
                  );
                  const expenseHeight = Math.max(
                    6,
                    (month.expense / maxValue) * hp(14),
                  );

                  return (
                    <View key={month.key} style={styles.monthColumn}>
                      <View style={styles.barGroup}>
                        <View
                          style={[
                            styles.bar,
                            styles.incomeBar,
                            { height: incomeHeight },
                          ]}
                        />
                        <View
                          style={[
                            styles.bar,
                            styles.expenseBar,
                            { height: expenseHeight },
                          ]}
                        />
                      </View>
                      <Text style={styles.monthLabel}>{month.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
      )}
    </HeroScreen>
  );
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense";
}) {
  return (
    <View style={styles.summaryPill}>
      <View
        style={[
          styles.summaryDot,
          tone === "income" ? styles.incomeDot : styles.expenseDot,
        ]}
      />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendChip}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingBottom: hp(14),
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: "rgba(255,255,255,0.7)",
  },
  title: {
    fontSize: rs(30),
    lineHeight: rs(36),
    fontWeight: "800",
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    color: "rgba(255,255,255,0.8)",
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  summaryPill: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xxs,
  },
  summaryDot: {
    width: rs(10),
    height: rs(10),
    borderRadius: radius.pill,
  },
  incomeDot: {
    backgroundColor: "#58C79A",
  },
  expenseDot: {
    backgroundColor: "#FF8B7A",
  },
  summaryLabel: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: "rgba(255,255,255,0.72)",
  },
  summaryValue: {
    fontSize: rs(17),
    lineHeight: rs(22),
    fontWeight: "800",
    color: colors.white,
  },
  card: {
    marginTop: -spacing.lg,
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 4,
  },
  cardHeader: {
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.title,
    lineHeight: typography.titleLineHeight,
    fontWeight: "800",
    color: colors.text,
  },
  legendRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  legendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  legendDot: {
    width: rs(8),
    height: rs(8),
    borderRadius: radius.pill,
  },
  legendText: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.textMuted,
  },
  stateWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  stateText: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.textMuted,
    textAlign: "center",
  },
  chartWrap: {
    marginTop: spacing.xl,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    minHeight: hp(18),
  },
  monthColumn: {
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  barGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xxs,
    height: hp(15),
  },
  bar: {
    width: rs(10),
    borderRadius: radius.pill,
  },
  incomeBar: {
    backgroundColor: "#58C79A",
  },
  expenseBar: {
    backgroundColor: "#FF8B7A",
  },
  monthLabel: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.textMuted,
  },
});
