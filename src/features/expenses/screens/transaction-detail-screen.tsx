import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { HeroScreen } from "@/components/layout/hero-screen";
import { colors, gradients, radius, spacing, typography } from "@/constants/theme";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import type {
  ExpenseTransaction,
  TransactionDetailPayload,
} from "@/features/expenses/types";
import { appApiFetch } from "@/lib/app-api-client";
import { formatCurrency, getUserCurrencyCode } from "@/lib/currency";
import { hp, rs, wp } from "@/lib/responsive";

type LoadState = "idle" | "loading" | "succeeded" | "failed";

function formatTransactionDateLabel(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
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

export function TransactionDetailScreenView() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const transactionId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuthSession();
  const currencyCode = getUserCurrencyCode(
    (user as { currency?: string | null } | null)?.currency,
  );
  const [transaction, setTransaction] = useState<ExpenseTransaction | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setStatus("failed");
      setError("Transaction not found.");
      return;
    }

    let isCancelled = false;

    const loadTransaction = async () => {
      setStatus("loading");
      setError(null);

      try {
        const payload = await appApiFetch<TransactionDetailPayload>(
          `/api/transactions?id=${encodeURIComponent(transactionId)}`,
        );

        if (!isCancelled) {
          setTransaction(payload.transaction);
          setStatus("succeeded");
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load transaction details.",
          );
          setStatus("failed");
        }
      }
    };

    void loadTransaction();

    return () => {
      isCancelled = true;
    };
  }, [transactionId]);

  const signedAmount = useMemo(() => {
    if (!transaction) {
      return "";
    }

    return `${transaction.type === "income" ? "+" : "-"} ${formatCurrency(
      transaction.amount,
      currencyCode,
    )}`;
  }, [currencyCode, transaction]);

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
              <Pressable
                onPress={() => router.back()}
                style={styles.headerIconButton}
              >
                <Feather name="chevron-left" size={rs(24)} color={colors.white} />
              </Pressable>
              <Text style={styles.headerTitle}>Transaction</Text>
              <View style={styles.headerIconButton} />
            </View>

            <View style={styles.curveCut} />
          </LinearGradient>

          <View style={styles.body}>
            <View style={styles.bodyContent}>
            {status === "loading" ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={colors.primaryDark} />
                <Text style={styles.stateText}>Loading transaction...</Text>
              </View>
            ) : null}

            {status === "failed" ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Details unavailable</Text>
                <Text style={styles.stateText}>
                  {error ?? "Unable to load this transaction."}
                </Text>
              </View>
            ) : null}

            {status === "succeeded" && transaction ? (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: getTransactionBadgeColor(transaction.title) },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {getTransactionInitial(transaction.title)}
                    </Text>
                  </View>

                  <Text style={styles.transactionTitle}>{transaction.title}</Text>

                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>{transaction.category}</Text>
                  </View>

                  <Text
                    style={[
                      styles.amount,
                      transaction.type === "income"
                        ? styles.amountIncome
                        : styles.amountExpense,
                    ]}
                  >
                    {signedAmount}
                  </Text>
                </View>

                <View style={styles.divider} />

                <DetailRow
                  icon="repeat"
                  label="Type"
                  value={transaction.type === "income" ? "Income" : "Expense"}
                />
                <DetailRow
                  icon="calendar"
                  label="Date"
                  value={formatTransactionDateLabel(transaction.date)}
                />
                <DetailRow
                  icon="tag"
                  label="Category"
                  value={transaction.category}
                />
                <DetailRow
                  icon="file-text"
                  label="Notes"
                  value={transaction.notes?.trim() || "No notes added"}
                  multiline
                />
              </View>
            ) : null}
            </View>
          </View>
        </View>
      )}
    </HeroScreen>
  );
}

function DetailRow({
  icon,
  label,
  value,
  multiline = false,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={[styles.detailRow, multiline ? styles.detailRowTop : null]}>
      <View style={styles.detailIconWrap}>
        <Feather name={icon} size={rs(16)} color={colors.primaryDark} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text
          style={[styles.detailValue, multiline ? styles.detailValueMultiline : null]}
          numberOfLines={multiline ? 4 : 1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
      </View>
    </View>
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
    backgroundColor: colors.white,
  },
  bodyContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  stateCard: {
    flex: 1,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 3,
  },
  stateTitle: {
    fontSize: typography.title,
    lineHeight: typography.titleLineHeight,
    fontWeight: "800",
    color: colors.text,
  },
  stateText: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.textMuted,
    textAlign: "center",
  },
  card: {
    flex: 1,
    marginTop: spacing.lg,
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
  cardTop: {
    alignItems: "center",
    gap: spacing.sm,
  },
  badge: {
    width: rs(64),
    height: rs(64),
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: rs(28),
    lineHeight: rs(32),
    fontWeight: "800",
    color: colors.primaryDark,
  },
  transactionTitle: {
    fontSize: rs(24),
    lineHeight: rs(30),
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "#EEF8F7",
  },
  categoryPillText: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  amount: {
    fontSize: rs(30),
    lineHeight: rs(36),
    fontWeight: "900",
  },
  amountIncome: {
    color: colors.success,
  },
  amountExpense: {
    color: colors.danger,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailRowTop: {
    alignItems: "flex-start",
  },
  detailIconWrap: {
    width: rs(40),
    height: rs(40),
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF8F6",
  },
  detailCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  detailLabel: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
    fontWeight: "700",
    color: colors.text,
  },
  detailValueMultiline: {
    lineHeight: typography.bodyLineHeight,
  },
});
