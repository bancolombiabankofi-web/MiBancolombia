import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import { useTheme } from "@/hooks/useTheme";

const { width: SCREEN_W } = Dimensions.get("window");
const YELLOW = "#FDDA24";
const COL_W = SCREEN_W / 4; // 4-column grid matching reference

/* ── Transacciones principales (4 visible, matching reference) ── */
const TX_ACTIONS = [
  { icon: "bar-chart-2", label: "Ver saldos y\nmovimientos", color: "#3B82F6", tab: 1 },
  { icon: "send",        label: "Transferir\nplata",         color: "#8B5CF6", tab: 2 },
  { icon: "credit-card", label: "Pagar tarjetas\ny créditos", color: "#6366F1", alert: "Selecciona la tarjeta a pagar." },
  { icon: "file-text",  label: "Pagar\nfacturas",            color: "#EF4444", tab: 3 },
  { icon: "repeat",      label: "A otro banco\nTransfiya",   color: "#10B981", tab: 2 },
  { icon: "download",    label: "Recibir\nplata",            color: "#06B6D4", tab: 2 },
  { icon: "smartphone",  label: "Recargar\ncelular",         color: "#F59E0B", tab: 3 },
  { icon: "trending-up", label: "Avances y\ndesembolsos",    color: "#10B981", alert: "Ve a Más > Mis créditos." },
];

/* ── Explorar nuestras categorías ── */
const CATEGORIES = [
  { icon: "target",       label: "Metas",      color: "#AF52DE", bg: "#AF52DE22" },
  { icon: "home",         label: "Vivienda",   color: "#FF6B35", bg: "#FF6B3522" },
  { icon: "shield",       label: "Seguros",    color: "#34C759", bg: "#34C75922" },
  { icon: "trending-up",  label: "Inversiones",color: "#007AFF", bg: "#007AFF22" },
  { icon: "dollar-sign",  label: "Créditos",   color: "#FDDA24", bg: "#FDDA2422" },
  { icon: "more-horizontal", label: "Más",     color: "#8B5CF6", bg: "#8B5CF622" },
];

/* ── Clave Dinámica pill with countdown ── */
function ClaveTimer() {
  const [seconds, setSeconds] = useState(28);
  const [codeVal] = useState(() => {
    const n = Math.floor(100000 + Math.random() * 899999);
    return `${String(n).slice(0, 3)} ${String(n).slice(3)}`;
  });
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s <= 0 ? 29 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <TouchableOpacity
      style={styles.clavePill}
      onPress={() =>
        Alert.alert(
          "Clave Dinámica",
          `Tu clave de un solo uso:\n\n${codeVal}\n\nCambia cada 30 segundos.`,
        )
      }
      activeOpacity={0.82}
    >
      <View style={styles.claveIconWrap}>
        <Feather name="shield" size={13} color="#1C1C1E" />
      </View>
      <View>
        <Text style={styles.claveLabel}>Clave Dinámica</Text>
        <Text style={styles.claveCode}>{codeVal}</Text>
      </View>
      <View style={styles.claveTimer}>
        <Text style={styles.claveTimerText}>{String(seconds).padStart(2, "0")}s</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ── Rainbow arc — concentric rings, center upper-left off-screen ── */
// Colors outermost → innermost matching the reference image
const ARC_BANDS = ["#FF3B30","#FF6B35","#FDDA24","#34C759","#00C7BE","#007AFF","#AF52DE"];

function ColorArc() {
  const ARC_H   = 172;
  const BAND_W  = 18;
  const GAP     = 5;
  const STEP    = BAND_W + GAP;
  // Center off-screen upper-left → right ) portion visible on right side
  const CX      = SCREEN_W * -0.12;
  const CY      = -SCREEN_W * 0.05;
  const BASE_R  = SCREEN_W * 1.08;

  return (
    <View
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: ARC_H,
        overflow: "hidden",
      }}
      pointerEvents="none"
    >
      {ARC_BANDS.map((color, i) => {
        const r = BASE_R - i * STEP;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: CX - r,
              top:  CY - r,
              width:  r * 2,
              height: r * 2,
              borderRadius: r,
              borderWidth: BAND_W,
              borderColor: color,
              backgroundColor: "transparent",
            }}
          />
        );
      })}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function HomeScreen() {
  const { userName, logout } = useApp();
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 60 : insets.top;

  const handleTxAction = (action: (typeof TX_ACTIONS)[0]) => {
    if (action.alert) {
      Alert.alert("Información", action.alert);
    } else if (action.tab !== undefined) {
      const routes = [
        "/(tabs)/index",
        "/(tabs)/movements",
        "/(tabs)/transfers",
        "/(tabs)/payments",
        "/(tabs)/cards",
      ];
      router.push(routes[action.tab] as any);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: C.background }]}>

      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: C.headerBg, borderBottomColor: C.border }]}>
        <View style={styles.headerLogoRow}>
          <Image
            source={require("../../assets/images/bancolombia_icon.png")}
            style={styles.headerLogoIcon}
            resizeMode="contain"
            tintColor={isDark ? "#FFFFFF" : "#1C1C1E"}
          />
          <Text style={[styles.headerLogoText, { color: isDark ? "#FFFFFF" : "#1C1C1E" }]}>
            Bancolombia
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}
            onPress={() => Alert.alert("Notificaciones", "No tienes notificaciones nuevas.")}>
            <Feather name="bell" size={19} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}
            onPress={() => Alert.alert("Ayuda", "Línea: 01 8000 912 345\nWhatsApp: 3132095988")}>
            <Feather name="help-circle" size={19} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}
            onPress={() => Alert.alert("Chat", "Conéctate al 3132095988 por WhatsApp.")}>
            <Feather name="message-circle" size={19} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={logout}>
            <Feather name="log-out" size={19} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── HERO: greeting + rainbow arc + clave ── */}
        <View style={[styles.heroSection, { backgroundColor: C.heroSection }]}>
          <ColorArc />
          <View style={styles.greetingRow}>
            <Text style={[styles.greetingText, { color: C.text }]}>
              Hola, {userName}
            </Text>
            <Feather name="chevron-right" size={22} color={isDark ? "rgba(255,255,255,0.5)" : "#9CA3AF"} />
          </View>
          <ClaveTimer />
        </View>

        {/* ── ACCOUNT CAROUSEL ── */}
        <AccountCardCarousel isDark={isDark} C={C} />

        {/* ── TRANSACCIONES PRINCIPALES ── */}
        <View style={[styles.section, { backgroundColor: C.background }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Transacciones principales</Text>
          <View style={styles.txGrid}>
            {TX_ACTIONS.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.txItem}
                onPress={() => handleTxAction(action)}
                activeOpacity={0.7}
              >
                <View style={[styles.txIconWrap, { backgroundColor: action.color + (isDark ? "28" : "1A") }]}>
                  <Feather name={action.icon as any} size={21} color={action.color} />
                </View>
                <Text style={[styles.txLabel, { color: C.text }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── EXPLORAR NUESTRAS CATEGORÍAS ── */}
        <View style={[styles.section, { backgroundColor: C.sectionBg, marginTop: 8 }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Explorar nuestras categorías</Text>
          <View style={styles.txGrid}>
            {CATEGORIES.map((cat, i) => (
              <TouchableOpacity
                key={i}
                style={styles.txItem}
                onPress={() => Alert.alert(cat.label, `Explora productos de ${cat.label}.`)}
                activeOpacity={0.7}
              >
                <View style={[styles.txIconWrap, { backgroundColor: isDark ? cat.color + "28" : cat.bg }]}>
                  <Feather name={cat.icon as any} size={21} color={cat.color} />
                </View>
                <Text style={[styles.txLabel, { color: C.text }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLogoRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerLogoIcon: { width: 24, height: 24 },
  headerLogoText: {
    fontSize: 17, fontWeight: "700",
    fontFamily: "Inter_700Bold", letterSpacing: -0.3,
  },
  headerIcons: { flexDirection: "row", gap: 0 },
  headerIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },

  /* Scroll */
  scrollContent: { paddingBottom: 24 },

  /* Hero */
  heroSection: {
    minHeight: 172,
    overflow: "hidden",
    paddingBottom: 22,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 4,
    zIndex: 2,
  },
  greetingText: {
    fontSize: 26, fontWeight: "700",
    fontFamily: "Inter_700Bold", letterSpacing: -0.5,
  },
  clavePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: YELLOW,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginTop: 14,
    gap: 8,
    alignSelf: "flex-start",
    zIndex: 2,
  },
  claveIconWrap: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.13)",
    alignItems: "center", justifyContent: "center",
  },
  claveLabel: {
    fontSize: 9, color: "#1C1C1E",
    fontFamily: "Inter_500Medium", opacity: 0.65,
  },
  claveCode: {
    fontSize: 15, fontWeight: "700", color: "#1C1C1E",
    fontFamily: "Inter_700Bold", letterSpacing: 1.5,
  },
  claveTimer: {
    backgroundColor: "rgba(0,0,0,0.13)",
    borderRadius: 10, paddingHorizontal: 8,
    paddingVertical: 3, marginLeft: "auto",
  },
  claveTimerText: {
    fontSize: 11, fontWeight: "600", color: "#1C1C1E",
    fontFamily: "Inter_600SemiBold",
  },

  /* Sections */
  section: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: "700",
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 16, marginBottom: 16,
  },

  /* 4-column grid */
  txGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  txItem: {
    width: COL_W,
    alignItems: "center",
    gap: 7,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  txIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  txLabel: {
    fontSize: 10, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 13,
  },
});
