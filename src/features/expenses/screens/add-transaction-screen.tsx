import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { HeroScreen } from "@/components/layout/hero-screen";
import { AppButton } from "@/components/ui/app-button";
import { supportedCurrencies } from "@/constants/currencies";
import { colors, gradients, radius, spacing, typography } from "@/constants/theme";
import { useAuthSession } from "@/features/auth/lib/use-auth-session";
import { appApiFetch } from "@/lib/app-api-client";
import { getUserCurrencyCode } from "@/lib/currency";
import { hp, rs, wp } from "@/lib/responsive";
import { useAppDispatch } from "@/store/hooks";
import { clearExpensesState } from "@/store/slices/expenses-slice";

type TransactionType = "expense" | "income";

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrencySymbol(currencyCode: string) {
  return (
    supportedCurrencies.find((currency) => currency.code === currencyCode)?.symbol ??
    currencyCode
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

type TypeChipProps = {
  isActive: boolean;
  label: string;
  onPress: () => void;
};

function TypeChip({ isActive, label, onPress }: TypeChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.typeChip, isActive ? styles.typeChipActive : null]}
    >
      <Text
        style={[
          styles.typeChipText,
          isActive ? styles.typeChipTextActive : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function AddTransactionScreenView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAuthSession();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(getTodayString());
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currencyCode = getUserCurrencyCode(
    (user as { currency?: string | null } | null)?.currency,
  );
  const currencySymbol = getCurrencySymbol(currencyCode);

  const amountPlaceholder = useMemo(
    () => (type === "expense" ? "85.50" : "2450.00"),
    [type],
  );

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const normalizedTitle = title.trim();
    const normalizedCategory = category.trim();
    const parsedAmount = Number(amount);

    if (!normalizedTitle) {
      setErrorMessage("Title is required.");
      return;
    }

    if (!normalizedCategory) {
      setErrorMessage("Category is required.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Amount must be greater than zero.");
      return;
    }

    if (Number.isNaN(new Date(date).getTime())) {
      setErrorMessage("Date must use the YYYY-MM-DD format.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await appApiFetch<{
        transaction: {
          id: string;
        };
      }>("/api/transactions", {
        method: "POST",
        body: {
          title: normalizedTitle,
          amount: parsedAmount,
          category: normalizedCategory,
          type,
          date,
          notes,
        },
      });

      dispatch(clearExpensesState());
      router.replace("/(tabs)/home");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save transaction right now.",
      );
      setIsSubmitting(false);
    }
  };

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
                onPress={() => router.replace("/(tabs)/home")}
                style={styles.headerIconButton}
              >
                <Feather name="chevron-left" size={rs(24)} color={colors.white} />
              </Pressable>

              <Text style={styles.headerTitle}>Add Transaction</Text>
            </View>

            <View style={styles.curveCut} />
          </LinearGradient>

          <KeyboardAvoidingView
            style={styles.body}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            <View style={styles.bodyContent}>
              <View style={styles.formCard}>
                <ScrollView
                  style={styles.formScroll}
                  contentContainerStyle={styles.formScrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.typeRow}>
                    <TypeChip
                      isActive={type === "expense"}
                      label="Expense"
                      onPress={() => setType("expense")}
                    />
                    <TypeChip
                      isActive={type === "income"}
                      label="Income"
                      onPress={() => setType("income")}
                    />
                  </View>

                  <FieldLabel label="Name" />
                  <View style={styles.fieldShell}>
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Groceries"
                      placeholderTextColor={colors.textMuted}
                      style={styles.primaryInput}
                    />
                  </View>

                  <FieldLabel label="Amount" />
                  <View style={[styles.fieldShell, styles.amountShell]}>
                    <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                    <TextInput
                      value={amount}
                      onChangeText={setAmount}
                      placeholder={amountPlaceholder}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      style={styles.amountInput}
                    />
                  </View>

                  <FieldLabel label="Date" />
                  <View style={styles.fieldShell}>
                    <TextInput
                      value={date}
                      onChangeText={setDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      style={styles.primaryInput}
                    />
                    <Feather name="calendar" size={rs(18)} color="#A9B4B7" />
                  </View>

                  <FieldLabel label="Category" />
                  <View style={styles.fieldShell}>
                    <TextInput
                      value={category}
                      onChangeText={setCategory}
                      placeholder={type === "expense" ? "Food" : "Salary"}
                      placeholderTextColor={colors.textMuted}
                      style={styles.primaryInput}
                    />
                  </View>

                  <FieldLabel label="Notes" />
                  <View style={[styles.fieldShell, styles.notesShell]}>
                    <TextInput
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Optional note"
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={4}
                      style={styles.notesInput}
                    />
                  </View>

                  {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

                  <AppButton
                    label={isSubmitting ? "Saving..." : "Save Transaction"}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    variant="hero"
                    pill
                    style={styles.submitButton}
                  />
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
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
    minHeight: hp(23),
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
    marginTop: -hp(10),
  },
  bodyContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: 0,
  },
  formCard: {
    flex: 1,
    borderRadius: rs(34),
    backgroundColor: colors.white,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 18,
    },
    elevation: 7,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  typeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeChip: {
    flex: 1,
    minHeight: rs(42),
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7F6",
    borderWidth: 1,
    borderColor: "#E7ECEB",
  },
  typeChipActive: {
    backgroundColor: "#EAF6F4",
    borderColor: "rgba(60, 138, 133, 0.5)",
  },
  typeChipText: {
    fontSize: rs(14),
    lineHeight: rs(18),
    fontWeight: "700",
    color: colors.textMuted,
  },
  typeChipTextActive: {
    color: colors.primaryDark,
  },
  fieldLabel: {
    marginBottom: spacing.sm,
    fontSize: rs(12),
    lineHeight: rs(16),
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(20, 36, 43, 0.76)",
    textTransform: "uppercase",
  },
  fieldShell: {
    minHeight: rs(60),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#E7ECEB",
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  amountShell: {
    borderColor: "#E7ECEB",
  },
  primaryInput: {
    flex: 1,
    fontSize: rs(15),
    lineHeight: rs(20),
    fontWeight: "500",
    color: colors.text,
  },
  currencyPrefix: {
    fontSize: rs(15),
    lineHeight: rs(20),
    fontWeight: "500",
    color: colors.text,
  },
  amountInput: {
    flex: 1,
    fontSize: rs(15),
    lineHeight: rs(20),
    fontWeight: "500",
    color: colors.text,
  },
  helperText: {
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
    paddingLeft: spacing.xxs,
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    fontWeight: "600",
    color: colors.textMuted,
  },
  notesShell: {
    minHeight: rs(116),
    borderRadius: radius.md,
    alignItems: "flex-start",
    paddingTop: spacing.md,
  },
  notesInput: {
    flex: 1,
    width: "100%",
    minHeight: rs(84),
    fontSize: rs(15),
    lineHeight: rs(20),
    fontWeight: "500",
    color: colors.text,
    textAlignVertical: "top",
  },
  error: {
    fontSize: typography.caption,
    lineHeight: typography.captionLineHeight,
    color: colors.danger,
    textAlign: "center",
  },
  submitButton: {
    marginTop: spacing.xl,
  },
});
