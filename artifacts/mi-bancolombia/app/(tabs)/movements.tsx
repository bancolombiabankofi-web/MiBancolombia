import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TransactionItem } from "@/components/TransactionItem";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const C = Colors.light;
const YELLOW = "#FDDA24";

const FILTERS = ["Todos", "Ingresos", "Egresos", "Transferencias"];

function groupByDate(transactions: ReturnType<typeof useApp>["transactions"]) {
  const groups: Record<string, typeof transactions> = {};
  transactions.forEach((tx) => {
    const key = tx.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });
  return groups;
}

function formatGroupDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export default function MovementsScreen() {
  const { transactions, balanceVisible, accounts } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? "");

  const account = accounts.find((a) => a.id === selectedAccount) ?? accounts[0];

  const filtered = transactions
    .filter((tx) => tx.accountId === selectedAccount)
    .filter((tx) => {
      if (activeFilter === "Todos") return true;
      if (activeFilter === "Ingresos") return tx.type === "credit";
      if (activeFilter === "Egresos") return tx.type === "debit" && tx.category !== "Transferencias";
      if (activeFilter === "Transferencias") return tx.category === "Transferencias";
      return true;
    });

  const totalCredits = filtered
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + t.amount, 0);
  const totalDebits = filtered
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const grouped = groupByDate(filtered);
  const sortedDates = Object.keys(grouped).sort((a, b) =>
    b.localeCompare(a)
  );

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Movimientos</Text>
        <TouchableOpacity style={styles.filterIconBtn}>
          <Feather name="sliders" size={20} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.accountScroll}
        contentContainerStyle={styles.accountScrollContent}
      >
        {accounts.map((acc) => (
          <TouchableOpacity
            key={acc.id}
            style={[
              styles.accountChip,
              selectedAccount === acc.id && styles.accountChipActive,
            ]}
            onPress={() => setSelectedAccount(acc.id)}
          >
            <Text
              style={[
                styles.accountChipText,
                selectedAccount === acc.id && styles.accountChipTextActive,
              ]}
            >
              {acc.name}
            </Text>
            <Text
              style={[
                styles.accountChipNum,
                selectedAccount === acc.id && styles.accountChipNumActive,
              ]}
            >
              {acc.number}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Ingresos</Text>
          <Text style={[styles.summaryValue, styles.summaryCredit]}>
            {balanceVisible ? `+${formatCOP(totalCredits)}` : "•••••"}
          </Text>
        </View>
        <View style={styles.summarySep} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Egresos</Text>
          <Text style={[styles.summaryValue, styles.summaryDebit]}>
            {balanceVisible ? `-${formatCOP(totalDebits)}` : "•••••"}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              activeFilter === f && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(f)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === f && styles.filterChipTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={C.textLight} />
            <Text style={styles.emptyText}>Sin movimientos</Text>
          </View>
        ) : (
          sortedDates.map((date) => (
            <View key={date}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>
                  {formatGroupDate(date)}
                </Text>
              </View>
              <View style={styles.txGroup}>
                {grouped[date].map((tx, i) => (
                  <React.Fragment key={tx.id}>
                    <TransactionItem
                      transaction={tx}
                      balanceVisible={balanceVisible}
                    />
                    {i < grouped[date].length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))
        )}
        <View style={{ height: Platform.OS === "web" ? 100 : 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  filterIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  accountScroll: { maxHeight: 72 },
  accountScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 8,
  },
  accountChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
    minWidth: 140,
  },
  accountChipActive: {
    borderColor: C.yellow,
    backgroundColor: C.yellow + "15",
  },
  accountChipText: {
    fontSize: 12,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  accountChipTextActive: {
    color: "#1C1C1E",
    fontFamily: "Inter_600SemiBold",
  },
  accountChipNum: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginTop: 2,
  },
  accountChipNumActive: {
    color: "#1C1C1E",
  },
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
    marginTop: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summarySep: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  summaryLabel: {
    fontSize: 11,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  summaryCredit: { color: "#10B981" },
  summaryDebit: { color: "#EF4444" },
  filterScroll: { maxHeight: 44 },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: {
    backgroundColor: "#1C1C1E",
    borderColor: "#1C1C1E",
  },
  filterChipText: {
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateHeaderText: {
    fontSize: 12,
    color: C.textSecondary,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
    letterSpacing: 0.3,
  },
  txGroup: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#F5F5F7",
    marginLeft: 70,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: C.textLight,
    fontFamily: "Inter_400Regular",
  },
});
