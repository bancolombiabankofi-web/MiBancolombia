import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import type { Card } from "@/context/AppContext";

const C = Colors.light;

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

type Props = { card: Card; balanceVisible: boolean };

export function CardView({ card, balanceVisible }: Props) {
  const isDark = card.color === "#1C1C1E";
  const textColor = isDark ? "#FFFFFF" : "#1C1C1E";
  const subTextColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)";

  return (
    <View style={[styles.card, { backgroundColor: card.color }]}>
      <View style={styles.top}>
        <View>
          <Text style={[styles.cardType, { color: subTextColor }]}>
            {card.type === "debit" ? "Tarjeta Débito" : "Tarjeta Crédito"}
          </Text>
          <Text style={[styles.cardBrand, { color: textColor }]}>
            {card.brand === "visa" ? "VISA" : "Mastercard"}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: card.active ? "#10B981" : "#EF4444" },
            ]}
          />
          <Text style={[styles.statusText, { color: subTextColor }]}>
            {card.active ? "Activa" : "Inactiva"}
          </Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        <View style={styles.chip} />
        <Feather name="wifi" size={18} color={textColor} style={{ transform: [{ rotate: "90deg" }] }} />
      </View>

      <Text style={[styles.cardNumber, { color: textColor }]}>{card.number}</Text>

      <View style={styles.bottom}>
        <View>
          <Text style={[styles.bottomLabel, { color: subTextColor }]}>TITULAR</Text>
          <Text style={[styles.bottomValue, { color: textColor }]}>{card.holder}</Text>
        </View>
        <View>
          <Text style={[styles.bottomLabel, { color: subTextColor }]}>VENCE</Text>
          <Text style={[styles.bottomValue, { color: textColor }]}>{card.expiry}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.bottomLabel, { color: subTextColor }]}>
            {card.type === "credit" ? "DISPONIBLE" : "SALDO"}
          </Text>
          <Text style={[styles.bottomValue, { color: textColor }]}>
            {balanceVisible ? formatCOP(card.balance) : "•••••"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    width: 320,
    height: 190,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardType: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  cardBrand: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chip: {
    width: 34,
    height: 26,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  cardNumber: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    letterSpacing: 2,
  },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bottomLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },
  bottomValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
});
