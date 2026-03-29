import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const C = Colors.light;

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BalanceCard() {
  const { accounts, balanceVisible, toggleBalanceVisible } = useApp();
  const main = accounts[0];
  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Saldo total disponible</Text>
          <Text style={styles.accountNum}>{main.number}</Text>
        </View>
        <TouchableOpacity onPress={toggleBalanceVisible} style={styles.eyeBtn}>
          <Feather
            name={balanceVisible ? "eye" : "eye-off"}
            size={20}
            color="#1C1C1E"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.balanceRow}>
        {balanceVisible ? (
          <Text style={styles.balance}>{formatCOP(total)}</Text>
        ) : (
          <Text style={styles.balance}>$ •••••••</Text>
        )}
      </View>
      <View style={styles.accounts}>
        {accounts.map((acc) => (
          <View key={acc.id} style={styles.accountItem}>
            <Text style={styles.accountName}>{acc.name}</Text>
            {balanceVisible ? (
              <Text style={styles.accountBalance}>{formatCOP(acc.balance)}</Text>
            ) : (
              <Text style={styles.accountBalance}>$ •••••</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.yellow,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: "rgba(0,0,0,0.6)",
    fontFamily: "Inter_400Regular",
  },
  accountNum: {
    fontSize: 13,
    color: "#1C1C1E",
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  eyeBtn: {
    padding: 4,
  },
  balanceRow: {
    marginBottom: 16,
  },
  balance: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
  },
  accounts: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.12)",
    paddingTop: 12,
    gap: 6,
  },
  accountItem: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  accountName: {
    fontSize: 13,
    color: "rgba(0,0,0,0.7)",
    fontFamily: "Inter_400Regular",
  },
  accountBalance: {
    fontSize: 13,
    color: "#1C1C1E",
    fontFamily: "Inter_600SemiBold",
  },
});
