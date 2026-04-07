import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { HeroScreen } from "@/components/layout/hero-screen";
import { UserAvatar } from "@/components/branding/user-avatar";
import { colors, gradients, radius, spacing, typography } from "@/constants/theme";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { fetchDashboard } from "@/features/home/lib/fetch-dashboard";
import { formatCurrency, getUserCurrencyCode } from "@/lib/currency";
import { hp, rs, wp } from "@/lib/responsive";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  dashboardReceived,
  dashboardRequested,
  dashboardRequestFailed,
  selectExpensesError,
  selectExpensesStatus,
  selectExpenseTotal,
  selectIncomeTotal,
  selectTransactions,
} from "@/store/slices/expenses-slice";

type TransactionFilter = "all" | "income" | "expense";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning,";
  }

  if (hour < 18) {
    return "Good afternoon,";
  }

  return "Good evening,";
}

function formatTransactionDateLabel(dateValue: string) {
  const currentDate = new Date();
  const transactionDate = new Date(dateValue);

  if (Number.isNaN(transactionDate.getTime())) {
    return dateValue;
  }

  const today = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );
  const target = new Date(
    transactionDate.getFullYear(),
    transactionDate.getMonth(),
    transactionDate.getDate(),
  );
  const diffInDays = Math.round(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays === 0) {
    return "Today";
  }

  if (diffInDays === 1) {
    return "Yesterday";
  }

  return transactionDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTransactionBadgeColor(title: string) {
  const palette = ["#E8F7ED", "#EAF1FF", "#FFF0E8", "#F3ECFF", "#FFEFF2"];
  const sum = title.split("").reduce((acc, character) => acc + character.charCodeAt(0), 0);
  return palette[sum % palette.length];
}

function getTransactionInitial(title: string) {
  return title.trim().charAt(0).toUpperCase() || "T";
}

export function HomeScreenView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isDashboardRequestInFlight = useRef(false);
  const { user } = useAuthSession();
  const [transactionFilter, setTransactionFilter] =
    useState<TransactionFilter>("all");
  const transactions = useAppSelector(selectTransactions);
  const expenseTotal = useAppSelector(selectExpenseTotal);
  const incomeTotal = useAppSelector(selectIncomeTotal);
  const status = useAppSelector(selectExpensesStatus);
  const error = useAppSelector(selectExpensesError);
  const currencyCode = getUserCurrencyCode(user?.currency);
  const totalBalance = incomeTotal - expenseTotal;
  const greeting = getGreeting();
  const filteredTransactions = useMemo(() => {
    if (transactionFilter === "all") {
      return transactions;
    }

    return transactions.filter(
      (transaction) => transaction.type === transactionFilter,
    );
  }, [transactionFilter, transactions]);
  const visibleTransactions = filteredTransactions.slice(0, 4);

  const loadDashboard = useCallback(async () => {
    if (isDashboardRequestInFlight.current) {
      return;
    }

    isDashboardRequestInFlight.current = true;
    dispatch(dashboardRequested());

    try {
      const dashboard = await fetchDashboard();
      dispatch(dashboardReceived(dashboard));
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your dashboard.";

      dispatch(dashboardRequestFailed(message));
    } finally {
      isDashboardRequestInFlight.current = false;
    }
  }, [dispatch]);

  useEffect(() => {
    if (status === "idle") {
      isDashboardRequestInFlight.current = false;
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      if (status === "idle") {
        void loadDashboard();
      }
    }, [loadDashboard, status]),
  );

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
            <View style={styles.userRow}>
              <Pressable onPress={() => router.push("/(tabs)/profile")}>
                <UserAvatar
                  uri={user?.image}
                  name={user?.name}
                  size={rs(54)}
                  style={styles.headerAvatar}
                />
              </Pressable>

              <View style={styles.greetingBlock}>
                <Text style={styles.greeting}>{greeting}</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name ?? "Spendora User"}
                </Text>
              </View>
            </View>

            <Pressable style={styles.notificationButton}>
              <Feather name="bell" size={rs(18)} color={colors.white} />
              <View style={styles.notificationDot} />
            </Pressable>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceCardHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Feather name="more-horizontal" size={rs(18)} color={colors.white} />
            </View>

            <Text style={styles.balanceValue}>
              {formatCurrency(totalBalance, currencyCode)}
            </Text>

            <View style={styles.metricsRow}>
              <MetricBlock
                icon="arrow-down-left"
                label="Income"
                value={formatCurrency(incomeTotal, currencyCode)}
              />
              <MetricBlock
                icon="arrow-up-right"
                label="Expenses"
                value={formatCurrency(expenseTotal, currencyCode)}
              />
            </View>
          </View>
          </LinearGradient>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions History</Text>

            <View style={styles.filterGroup}>
              <TransactionFilterChip
                label="All"
                isActive={transactionFilter === "all"}
                onPress={() => setTransactionFilter("all")}
              />
              <TransactionFilterChip
                label="Income"
                isActive={transactionFilter === "income"}
                onPress={() => setTransactionFilter("income")}
              />
              <TransactionFilterChip
                label="Expenses"
                isActive={transactionFilter === "expense"}
                onPress={() => setTransactionFilter("expense")}
              />
            </View>
          </View>

          {status === "loading" ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={colors.primaryDark} />
              <Text style={styles.stateText}>Loading your dashboard...</Text>
            </View>
          ) : null}

          {status === "failed" ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Dashboard unavailable</Text>
              <Text style={styles.stateText}>
                {error ?? "Unable to load your transactions right now."}
              </Text>
              <Pressable onPress={() => void loadDashboard()}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {status === "succeeded" && visibleTransactions.length === 0 ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>
                {transactionFilter === "all"
                  ? "No transactions yet"
                  : `No ${transactionFilter} transactions`}
              </Text>
              <Text style={styles.stateText}>
                {transactionFilter === "all"
                  ? "Add your first transaction from the middle tab."
                  : `Try switching filters or add a new ${transactionFilter} transaction.`}
              </Text>
            </View>
          ) : null}

          {visibleTransactions.map((transaction) => (
            <Pressable
              key={transaction.id}
              style={styles.transactionRow}
              onPress={() => router.push(`/transaction/${transaction.id}`)}
            >
              <View
                style={[
                  styles.transactionBadge,
                  { backgroundColor: getTransactionBadgeColor(transaction.title) },
                ]}
              >
                <Text style={styles.transactionBadgeText}>
                  {getTransactionInitial(transaction.title)}
                </Text>
              </View>

              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
                <Text style={styles.transactionDate}>
                  {formatTransactionDateLabel(transaction.date)}
                </Text>
              </View>

              <Text
                style={[
                  styles.transactionAmount,
                  transaction.type === "income"
                    ? styles.transactionIncome
                    : styles.transactionExpense,
                ]}
              >
                {transaction.type === "income" ? "+" : "-"}{" "}
                {formatCurrency(transaction.amount, currencyCode)}
              </Text>
            </Pressable>
          ))}
          </ScrollView>
        </View>
      )}
    </HeroScreen>
  );
}

function MetricBlock({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricBlock}>
      <View style={styles.metricLabelRow}>
        <View style={styles.metricIconWrap}>
          <Feather name={icon} size={rs(13)} color={colors.white} />
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function TransactionFilterChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        isActive ? styles.filterChipActive : null,
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          isActive ? styles.filterChipTextActive : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  hero: {
    position: "relative",
    paddingHorizontal: spacing.lg,
    paddingBottom: hp(5),
    overflow: "hidden",
  },
  ring: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.pill,
  },
  ringOne: {
    top: -hp(8),
    left: wp(24),
    width: wp(48),
    height: wp(48),
  },
  ringTwo: {
    top: hp(1),
    left: wp(6),
    width: wp(84),
    height: wp(84),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerAvatar: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: colors.white,
  },
  greetingBlock: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  greeting: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: "rgba(255,255,255,0.72)",
  },
  userName: {
    marginTop: 2,
    fontSize: rs(24, 0.95, 1.04),
    lineHeight: rs(28, 0.95, 1.04),
    fontWeight: "800",
    color: colors.white,
  },
  notificationButton: {
    width: rs(42),
    height: rs(42),
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: rs(11),
    right: rs(11),
    width: rs(8),
    height: rs(8),
    borderRadius: radius.pill,
    backgroundColor: "#FFB45B",
  },
  balanceCard: {
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: "rgba(22, 110, 106, 0.42)",
    padding: spacing.lg,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 6,
  },
  balanceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceLabel: {
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    fontWeight: "600",
    color: "rgba(255,255,255,0.82)",
  },
  balanceValue: {
    marginTop: spacing.sm,
    fontSize: rs(34, 0.95, 1.06),
    lineHeight: rs(40, 0.95, 1.06),
    fontWeight: "900",
    color: colors.white,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  metricBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metricIconWrap: {
    width: rs(20),
    height: rs(20),
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: "rgba(255,255,255,0.76)",
  },
  metricValue: {
    fontSize: rs(20, 0.94, 1.04),
    lineHeight: rs(24, 0.94, 1.04),
    fontWeight: "800",
    color: colors.white,
  },
  body: {
    flex: 1,
    backgroundColor: colors.white,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: hp(14),
  },
  sectionHeader: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: rs(20),
    lineHeight: rs(24),
    fontWeight: "800",
    color: colors.text,
  },
  filterGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primarySoft,
  },
  filterChipText: {
    fontSize: rs(12),
    lineHeight: rs(16),
    fontWeight: "700",
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.primaryDark,
  },
  stateCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  stateTitle: {
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    fontWeight: "700",
    color: colors.text,
  },
  stateText: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.textMuted,
    textAlign: "center",
  },
  retryText: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(20, 36, 43, 0.06)",
  },
  transactionBadge: {
    width: rs(48),
    height: rs(48),
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  transactionBadgeText: {
    fontSize: rs(18),
    lineHeight: rs(22),
    fontWeight: "800",
    color: colors.primaryDark,
  },
  transactionInfo: {
    flex: 1,
    gap: 2,
  },
  transactionTitle: {
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    fontWeight: "700",
    color: colors.text,
  },
  transactionDate: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.textMuted,
  },
  transactionAmount: {
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    fontWeight: "800",
  },
  transactionIncome: {
    color: "#2FB36D",
  },
  transactionExpense: {
    color: "#FF7A6E",
  },
});
