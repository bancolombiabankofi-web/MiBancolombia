import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import type { Transaction } from "@/context/AppContext";

const C = Colors.light;

const CATEGORY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Compras: "shopping-bag",
  Ingresos: "trending-up",
  Entretenimiento: "tv",
  Transferencias: "send",
  Servicios: "zap",
  Alimentación: "coffee",
  Transporte: "truck",
};

const CATEGORY_COLORS: Record<string, string> = {
  Compras: "#8B5CF6",
  Ingresos: "#10B981",
  Entretenimiento: "#EF4444",
  Transferencias: "#3B82F6",
  Servicios: "#F59E0B",
  Alimentación: "#F97316",
  Transporte: "#6B7280",
};

function formatCOP(amount: number) {
  const abs = Math.abs(amount);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(abs);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

type Props = {
  transaction: Transaction;
  balanceVisible: boolean;
};

export function TransactionItem({ transaction, balanceVisible }: Props) {
  const icon =
    CATEGORY_ICONS[transaction.category] ?? "circle";
  const iconColor =
    CATEGORY_COLORS[transaction.category] ?? C.textSecondary;
  const isCredit = transaction.type === "credit";

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + "20" }]}>
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.desc} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.meta}>
          {transaction.category} • {formatDate(transaction.date)}
        </Text>
      </View>
      <Text style={[styles.amount, isCredit ? styles.credit : styles.debit]}>
        {balanceVisible
          ? `${isCredit ? "+" : "-"}${formatCOP(transaction.amount)}`
          : "•••••"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  desc: {
    fontSize: 14,
    color: C.text,
    fontFamily: "Inter_500Medium",
  },
  meta: {
    fontSize: 12,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  credit: {
    color: "#10B981",
  },
  debit: {
    color: C.text,
  },
});
