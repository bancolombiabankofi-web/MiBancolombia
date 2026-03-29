import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { Card } from "@/context/AppContext";

const C = Colors.light;

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function CreditCard({ card, visible }: { card: Card; visible: boolean }) {
  const isYellow = card.color === "#FDDA24";

  const grad: [string, string] = isYellow
    ? ["#FDDA24", "#F5C500"]
    : ["#1C1C1E", "#0A0E27"];

  const textColor = isYellow ? "#1C1C1E" : "#FFFFFF";
  const subColor = isYellow ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";

  return (
    <LinearGradient
      colors={grad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.cardType, { color: subColor }]}>
            {card.type === "credit" ? "Tarjeta de Crédito" : "Tarjeta Débito"}
          </Text>
          <Text style={[styles.cardHolder, { color: textColor }]}>
            {card.holder}
          </Text>
        </View>
        <View style={styles.brandWrap}>
          {card.brand === "visa" ? (
            <Text style={[styles.brandVisa, { color: textColor }]}>VISA</Text>
          ) : (
            <View style={styles.mastercardWrap}>
              <View style={[styles.mcCircle, { backgroundColor: "#EB001B" }]} />
              <View style={[styles.mcCircle, styles.mcCircleRight, { backgroundColor: "#F79E1B" }]} />
            </View>
          )}
        </View>
      </View>

      <Text style={[styles.cardNumber, { color: textColor }]}>
        {card.number}
      </Text>

      <View style={styles.cardFooter}>
        <View>
          <Text style={[styles.cardLabel, { color: subColor }]}>Vence</Text>
          <Text style={[styles.cardValue, { color: textColor }]}>
            {card.expiry}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.cardLabel, { color: subColor }]}>
            {card.type === "credit" ? "Cupo disponible" : "Saldo"}
          </Text>
          <Text style={[styles.cardValue, { color: textColor }]}>
            {visible ? formatCOP(card.balance) : "•••••"}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function ProductRow({
  icon,
  title,
  subtitle,
  value,
  visible,
  color,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  value: string;
  visible: boolean;
  color: string;
}) {
  return (
    <TouchableOpacity style={styles.productRow} activeOpacity={0.7}>
      <View style={[styles.productIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productTitle}>{title}</Text>
        <Text style={styles.productSubtitle}>{subtitle}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.productValue}>
          {visible ? value : "•••••"}
        </Text>
        <Feather name="chevron-right" size={16} color={C.textLight} />
      </View>
    </TouchableOpacity>
  );
}

export default function CardsScreen() {
  const { cards, accounts, balanceVisible } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [selectedCard, setSelectedCard] = useState(0);

  const card = cards[selectedCard];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Productos</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Feather name="plus" size={20} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionText}>Tarjetas</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardScroll}
          pagingEnabled
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(
              e.nativeEvent.contentOffset.x / (320 + 16)
            );
            setSelectedCard(Math.min(idx, cards.length - 1));
          }}
        >
          {cards.map((c) => (
            <CreditCard key={c.id} card={c} visible={balanceVisible} />
          ))}
        </ScrollView>

        {cards.length > 1 && (
          <View style={styles.dots}>
            {cards.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, selectedCard === i && styles.dotActive]}
              />
            ))}
          </View>
        )}

        <View style={styles.quickActionsRow}>
          {[
            { icon: "lock" as const, label: "Bloquear" },
            { icon: "eye-off" as const, label: "Pin" },
            { icon: "refresh-cw" as const, label: "Reemplazar" },
            { icon: "settings" as const, label: "Gestionar" },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={styles.quickAction}>
              <View style={styles.quickActionIcon}>
                <Feather name={a.icon} size={18} color={C.text} />
              </View>
              <Text style={styles.quickActionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionLabel}>
          <Text style={styles.sectionText}>Cuentas</Text>
        </View>

        <View style={styles.productList}>
          {accounts.map((acc, i) => (
            <React.Fragment key={acc.id}>
              <ProductRow
                icon={acc.type === "savings" ? "archive" : "briefcase"}
                title={acc.name}
                subtitle={acc.number}
                value={formatCOP(acc.balance)}
                visible={balanceVisible}
                color={acc.type === "savings" ? "#3B82F6" : "#8B5CF6"}
              />
              {i < accounts.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.sectionLabel}>
          <Text style={styles.sectionText}>Créditos</Text>
        </View>

        <View style={styles.productList}>
          <ProductRow
            icon="bar-chart-2"
            title="CDT Bancolombia"
            subtitle="Vence 15/09/2026"
            value={formatCOP(5000000)}
            visible={balanceVisible}
            color="#10B981"
          />
          <View style={styles.rowDivider} />
          <ProductRow
            icon="home"
            title="Crédito de Vivienda"
            subtitle="Cuota mensual"
            value={formatCOP(780000)}
            visible={balanceVisible}
            color="#F59E0B"
          />
        </View>

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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    fontWeight: "600",
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  cardScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    width: 320,
    borderRadius: 20,
    padding: 22,
    marginRight: 0,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  cardType: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardHolder: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginTop: 3,
    letterSpacing: 0.5,
  },
  brandWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  brandVisa: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  mastercardWrap: {
    flexDirection: "row",
    width: 44,
    height: 28,
    alignItems: "center",
  },
  mcCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    opacity: 0.9,
  },
  mcCircleRight: {
    marginLeft: -14,
  },
  cardNumber: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    letterSpacing: 3,
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
  },
  dotActive: {
    backgroundColor: "#1C1C1E",
    width: 16,
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
  },
  quickAction: {
    alignItems: "center",
    gap: 6,
  },
  quickActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 11,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  productList: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: { flex: 1 },
  productTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  productSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },
  productValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginBottom: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F5F5F7",
    marginLeft: 74,
  },
});
