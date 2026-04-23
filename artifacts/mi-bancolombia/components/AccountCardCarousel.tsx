import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "@/context/AppContext";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W - 48;
const YELLOW = "#FDDA24";

function formatCOP(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getAccountTypeLabel(type: string) {
  if (type === "savings") return "Ahorros";
  if (type === "checking") return "Corriente";
  if (type === "credit") return "Crédito";
  return type;
}

export function AccountCardCarousel() {
  const { accounts, balanceVisible, toggleBalanceVisible } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_W);
    setActiveIdx(idx);
  };

  if (accounts.length === 0) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tus cuentas</Text>
          <TouchableOpacity onPress={toggleBalanceVisible} style={styles.hideBtn}>
            <Feather name={balanceVisible ? "eye" : "eye-off"} size={14} color="#6B7280" />
            <Text style={styles.hideText}>{balanceVisible ? "Ocultar saldos" : "Mostrar saldos"}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { width: CARD_W }]}>
          <Text style={styles.cardAccountType}>Sin cuenta activa</Text>
          <Text style={styles.cardLabel}>Saldo disponible</Text>
          <Text style={styles.cardBalance}>$ 0</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tus cuentas</Text>
        <TouchableOpacity onPress={toggleBalanceVisible} style={styles.hideBtn}>
          <Feather name={balanceVisible ? "eye" : "eye-off"} size={14} color="#6B7280" />
          <Text style={styles.hideText}>{balanceVisible ? "Ocultar saldos" : "Mostrar saldos"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_W + 12}
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {accounts.map((acc, i) => (
          <View key={acc.id} style={[styles.card, { width: CARD_W }]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardAccountName} numberOfLines={1}>
                  {acc.name}
                </Text>
                <Text style={styles.cardAccountType}>
                  {getAccountTypeLabel(acc.type)} · {acc.number}
                </Text>
              </View>
              <TouchableOpacity style={styles.arrowBtn}>
                <Feather name="chevron-right" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.cardBalanceSection}>
              <Text style={styles.cardLabel}>Saldo disponible</Text>
              {balanceVisible ? (
                <Text style={styles.cardBalance}>{formatCOP(acc.balance)}</Text>
              ) : (
                <Text style={styles.cardBalance}>$ ••••••</Text>
              )}
            </View>
            <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85}>
              <Text style={styles.ctaBtnText}>Conoce más de tu cuenta</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {accounts.length > 1 && (
        <View style={styles.dots}>
          {accounts.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dotItem,
                i === activeIdx ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
  },
  hideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hideText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardAccountName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    fontFamily: "Inter_600SemiBold",
  },
  cardAccountType: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  arrowBtn: { padding: 2 },
  cardBalanceSection: {
    marginBottom: 18,
  },
  cardLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  cardBalance: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  ctaBtn: {
    backgroundColor: YELLOW,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  dotItem: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: "#1C1C1E",
  },
  dotInactive: {
    width: 6,
    backgroundColor: "#D1D5DB",
  },
});
