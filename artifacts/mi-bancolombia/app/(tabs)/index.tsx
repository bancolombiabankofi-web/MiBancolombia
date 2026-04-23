import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountCardCarousel } from "@/components/AccountCardCarousel";
import { useApp } from "@/context/AppContext";

const { width: SCREEN_W } = Dimensions.get("window");
const YELLOW = "#FDDA24";

const TX_ACTIONS = [
  { icon: "bar-chart-2", label: "Ver saldos y\nmovimientos", color: "#3B82F6", route: "/(tabs)/movements" },
  { icon: "send", label: "Transferir\nplata", color: "#8B5CF6", route: "/(tabs)/transfers" },
  { icon: "repeat", label: "A otro banco\ncon Transfiya", color: "#10B981", route: "/(tabs)/transfers" },
  { icon: "plus-circle", label: "Inscribir\nproductos", color: "#F59E0B", route: "/(tabs)/cards" },
  { icon: "download", label: "Recibir\nplata", color: "#06B6D4", route: "/(tabs)/transfers" },
  { icon: "file-text", label: "Pagar\nfacturas", color: "#EF4444", route: "/(tabs)/payments" },
  { icon: "credit-card", label: "Pagar tarjetas\ny créditos", color: "#6366F1", route: "/(tabs)/payments" },
  { icon: "smartphone", label: "Recargar", color: "#F59E0B", route: "/(tabs)/payments" },
  { icon: "trending-up", label: "Avances y\ndesembolsos", color: "#10B981", route: "/(tabs)/transfers" },
];

function ClaveTimer() {
  const [seconds, setSeconds] = useState(137849 % 60);
  const [code] = useState("137 849");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 29 : s - 1));
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  return (
    <View style={styles.clavePill}>
      <View style={styles.claveIconWrap}>
        <Feather name="shield" size={13} color="#1C1C1E" />
      </View>
      <View>
        <Text style={styles.claveLabel}>Clave Dinámica</Text>
        <Text style={styles.claveCode}>{code}</Text>
      </View>
      <View style={styles.claveTimer}>
        <Text style={styles.claveTimerText}>{String(seconds).padStart(2, "0")}s</Text>
      </View>
    </View>
  );
}

const ARC_COLORS = [
  "#FF3B30",
  "#FF6B35",
  "#FDDA24",
  "#34C759",
  "#00C7BE",
  "#007AFF",
  "#AF52DE",
];

function ColorArc() {
  const segCount = ARC_COLORS.length;
  const segW = SCREEN_W / segCount;
  const ARC_H = 260;
  const RADIUS = SCREEN_W * 0.72;

  return (
    <View style={[styles.arcContainer, { height: ARC_H }]} pointerEvents="none">
      {ARC_COLORS.map((color, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            bottom: 0,
            left: i * segW - 2,
            width: segW + 4,
            height: ARC_H,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: -(RADIUS - segW / 2),
              width: RADIUS * 2,
              height: RADIUS * 2,
              borderRadius: RADIUS,
              backgroundColor: color,
              opacity: 0.85,
            }}
          />
        </View>
      ))}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 12,
          right: 12,
          height: ARC_H - 24,
          borderTopLeftRadius: RADIUS,
          borderTopRightRadius: RADIUS,
          backgroundColor: "#FFFFFF",
        }}
      />
    </View>
  );
}

export default function HomeScreen() {
  const { userName, logout } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 60 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/bancolombia_icon.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Feather name="bell" size={20} color="#1C1C1E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Feather name="help-circle" size={20} color="#1C1C1E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Feather name="message-circle" size={20} color="#1C1C1E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={logout}>
            <Feather name="log-out" size={20} color="#1C1C1E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSection}>
          <ColorArc />
          <View style={styles.greetingRow}>
            <Text style={styles.greetingText}>Hola, {userName}</Text>
            <Feather name="chevron-right" size={22} color="#1C1C1E" />
          </View>
          <ClaveTimer />
        </View>

        <AccountCardCarousel />

        <View style={styles.txSection}>
          <Text style={styles.txSectionTitle}>Transacciones principales</Text>
          <View style={styles.txGrid}>
            {TX_ACTIONS.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.txItem}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.txIconWrap, { backgroundColor: action.color + "18" }]}>
                  <Feather name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={styles.txLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: Platform.OS === "web" ? 100 : 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerLogo: {
    width: 140,
    height: 32,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 4,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 24,
    marginBottom: 12,
  },
  arcContainer: {
    width: SCREEN_W,
    overflow: "hidden",
    marginBottom: -16,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 8,
    gap: 4,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  clavePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: YELLOW,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 24,
    marginTop: 14,
    gap: 8,
    alignSelf: "flex-start",
  },
  claveIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  claveLabel: {
    fontSize: 10,
    color: "#1C1C1E",
    fontFamily: "Inter_500Medium",
    opacity: 0.7,
  },
  claveCode: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  claveTimer: {
    backgroundColor: "rgba(0,0,0,0.12)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: "auto",
  },
  claveTimerText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1C1C1E",
    fontFamily: "Inter_600SemiBold",
  },
  txSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 0,
    paddingVertical: 20,
    borderRadius: 0,
  },
  txSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  txGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    rowGap: 16,
  },
  txItem: {
    width: "33.33%",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  txIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  txLabel: {
    fontSize: 11,
    color: "#1C1C1E",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 15,
  },
});
