import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BalanceCard } from "@/components/BalanceCard";
import { TransactionItem } from "@/components/TransactionItem";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";

type QuickAction = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route: string;
  color: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { icon: "send", label: "Transferir", route: "/(tabs)/transfers", color: "#3B82F6" },
  { icon: "file-text", label: "Pagar", route: "/(tabs)/payments", color: "#10B981" },
  { icon: "smartphone", label: "Recargar", route: "/(tabs)/payments", color: "#F59E0B" },
  { icon: "credit-card", label: "Productos", route: "/(tabs)/cards", color: "#8B5CF6" },
  { icon: "bar-chart-2", label: "Movimientos", route: "/(tabs)/movements", color: "#EF4444" },
  { icon: "grid", label: "Más servicios", route: "/(tabs)/payments", color: "#6B7280" },
];

export default function HomeScreen() {
  const { transactions, balanceVisible, logout, userName } = useApp();
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const recent = transactions.slice(0, 5);

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: C.background }]}>
      <View style={[styles.header, { backgroundColor: C.background }]}>
        <View style={styles.headerLeft}>
          <Image
            source={
              isDark
                ? require("../../assets/images/mi_bancolombia_icon.png")
                : require("../../assets/images/bancolombia_icon.png")
            }
            style={[styles.headerLogo, isDark && styles.headerLogoDark]}
            resizeMode="contain"
          />
          <View>
            <Text style={[styles.greeting, { color: C.text }]}>Hola, {userName}</Text>
            <Text style={[styles.date, { color: C.textSecondary }]}>
              {new Date().toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: C.surface }]}>
            <Feather name="bell" size={20} color={C.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: C.surface }]} onPress={logout}>
            <Feather name="log-out" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <BalanceCard />

        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickItem}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: isDark ? action.color + "25" : action.color + "18" }]}>
                <Feather name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.quickLabel, { color: C.textSecondary }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Últimos movimientos</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/movements" as any)}>
            <Text style={[styles.seeAll, { color: C.yellow }]}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.txList, { backgroundColor: C.surface }]}>
          {recent.length === 0 ? (
            <View style={styles.emptyTx}>
              <Feather name="inbox" size={28} color={C.textLight} />
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                Aún no tienes movimientos
              </Text>
            </View>
          ) : (
            recent.map((tx, i) => (
              <React.Fragment key={tx.id}>
                <TransactionItem transaction={tx} balanceVisible={balanceVisible} />
                {i < recent.length - 1 && <View style={[styles.divider, { backgroundColor: C.divider }]} />}
              </React.Fragment>
            ))
          )}
        </View>

        <View style={styles.bannerWrap}>
          <View style={[styles.banner, { backgroundColor: isDark ? "#2C2C2E" : "#1C1C1E" }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>¡Conoce nuestros CDTs!</Text>
              <Text style={styles.bannerSub}>Rentabilidad hasta 12% E.A.</Text>
              <TouchableOpacity style={[styles.bannerBtn, { backgroundColor: C.yellow }]}>
                <Text style={styles.bannerBtnText}>Ver más</Text>
              </TouchableOpacity>
            </View>
            <Feather name="trending-up" size={48} color={C.yellow} />
          </View>
        </View>

        <View style={{ height: Platform.OS === "web" ? 100 : 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLogo: {
    width: 38,
    height: 38,
  },
  headerLogoDark: {
    borderRadius: 10,
  },
  greeting: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
    textTransform: "capitalize",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  quickItem: {
    width: "30%",
    alignItems: "center",
    gap: 6,
  },
  quickIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  txList: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  emptyTx: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    marginLeft: 70,
  },
  bannerWrap: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  banner: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  bannerBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  bannerBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
  },
});
