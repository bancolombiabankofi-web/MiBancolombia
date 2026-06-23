import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { formatBalance } from "@/constants/countries";

const { width: SCREEN_W } = Dimensions.get("window");
const YELLOW = "#FDDA24";
const CARD_W = Math.min(SCREEN_W - 48, 360);

/* ── Account type label ── */
function getAccountTypeLabel(type: string) {
  if (type === "savings") return "Ahorros";
  if (type === "checking") return "Corriente";
  if (type === "credit") return "Crédito";
  return type;
}

/* ── Transacciones principales ── */
const TX_ACTIONS = [
  { icon: "bar-chart-2", label: "Ver saldos y\nmovimientos", color: "#3B82F6", tab: 1 },
  { icon: "send",        label: "Transferir\nplata",         color: "#8B5CF6", tab: 2 },
  { icon: "credit-card", label: "Pagar tarjetas\ny créditos", color: "#6366F1", tab: 2 },
  { icon: "file-text",   label: "Pagar\nfacturas",           color: "#EF4444", tab: 2 },
  { icon: "repeat",      label: "A otro banco\nTransfiya",   color: "#10B981", tab: 2 },
  { icon: "download",    label: "Recibir\nplata",            color: "#06B6D4", tab: 2 },
  { icon: "smartphone",  label: "Recargar\ncelular",         color: "#F59E0B", tab: 2 },
  { icon: "trending-up", label: "Avances y\ndesembolsos",    color: "#10B981", tab: 2 },
];

/* ── Explorar categorías ── */
const CATEGORIES = [
  { icon: "target",       label: "Metas",      color: "#AF52DE", bg: "#AF52DE22", tab: 3 },
  { icon: "home",         label: "Vivienda",   color: "#FF6B35", bg: "#FF6B3522",
    info: "Tu360 Inmobiliario\n\nEncontramos la vivienda perfecta para ti. Préstamos hipotecarios, leasing y subsidios de vivienda disponibles." },
  { icon: "shield",       label: "Seguros",    color: "#34C759", bg: "#34C75922",
    info: "Seguros Bancolombia\n\nProtege lo que más importa. Seguros de vida, hogar, vehículo y salud con las mejores condiciones." },
  { icon: "trending-up",  label: "Inversiones",color: "#007AFF", bg: "#007AFF22",
    info: "Invierte con Bancolombia\n\nFDAs, CDTs y Fondos de inversión. Haz crecer tu dinero con nuestras opciones de inversión." },
  { icon: "dollar-sign",  label: "Créditos",   color: "#FDDA24", bg: "#FDDA2422",
    info: "Créditos de consumo\n\nLibranza, crédito personal, rotativo y microcrédito. Solicita el tuyo en minutos." },
  { icon: "more-horizontal", label: "Más",     color: "#8B5CF6", bg: "#8B5CF622", tab: 3 },
];

/* ── SVG Arc decoration (reference design) ── */
function ColorArc() {
  const ARC_H = 160;
  return (
    <View
      style={{ position: "absolute", top: 90, left: 0, right: 0, height: ARC_H, overflow: "hidden" }}
      pointerEvents="none"
    >
      <Svg width={SCREEN_W} height={ARC_H} viewBox={`0 0 ${SCREEN_W} ${ARC_H}`} fill="none">
        {/* Left tail accents */}
        <Path
          d={`M -10,105 Q 15,95 32,118`}
          stroke="#00f0ff"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <Path
          d={`M -15,112 Q 10,102 26,125`}
          stroke="#905cf5"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        {/* Right violet accent */}
        <Path
          d={`M ${SCREEN_W * 0.82},40 Q ${SCREEN_W * 0.9},48 ${SCREEN_W},85`}
          stroke="#905cf5"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Green arc */}
        <Path
          d={`M ${SCREEN_W * 0.42},65 A 120 120 0 0 1 ${SCREEN_W * 0.63},45`}
          stroke="#00EA90"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Yellow arc */}
        <Path
          d={`M ${SCREEN_W * 0.62},45 A 120 120 0 0 1 ${SCREEN_W * 0.79},55`}
          stroke="#FED201"
          strokeWidth="9.5"
          strokeLinecap="round"
        />
        {/* Orange thick arc */}
        <Path
          d={`M ${SCREEN_W * 0.78},52 A 100 100 0 0 1 ${SCREEN_W + 5},105`}
          stroke="#FF7A1A"
          strokeWidth="11.5"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

/* ── Clave Dinámica — dark pill with circular SVG progress ── */
function ClaveTimer() {
  const [countdown, setCountdown] = useState(28);
  const [codeVal, setCodeVal] = useState(() => {
    const n = Math.floor(100000 + Math.random() * 899999);
    return `${String(n).slice(0, 3)} ${String(n).slice(3)}`;
  });

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const p1 = Math.floor(100 + Math.random() * 900);
          const p2 = Math.floor(100 + Math.random() * 900);
          setCodeVal(`${p1} ${p2}`);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const R = 14;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - countdown / 30);

  return (
    <TouchableOpacity
      style={styles.clavePill}
      onPress={() =>
        Alert.alert(
          "Clave Dinámica",
          `Tu clave de un solo uso:\n\n${codeVal}\n\nCambia automáticamente cada 30 segundos.\nÚsala cuando te la soliciten para confirmar operaciones.`,
          [{ text: "Entendido" }],
        )
      }
      activeOpacity={0.82}
    >
      {/* Circular progress with lock */}
      <View style={styles.claveCircleWrap}>
        <Svg width={36} height={36} style={{ transform: [{ rotate: "-90deg" }] }}>
          <Circle cx={18} cy={18} r={R} stroke="#1C1C1E" strokeWidth={3} fill="transparent" />
          <Circle
            cx={18}
            cy={18}
            r={R}
            stroke={YELLOW}
            strokeWidth={3}
            fill="transparent"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </Svg>
        {/* Lock icon centered */}
        <View style={styles.lockIconOverlay}>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />
            <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </Svg>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.claveLabel}>Clave Dinámica</Text>
        <Text style={styles.claveCode}>{codeVal}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ── Account Card Carousel ── */
function AccountsSection({ isDark, C }: { isDark: boolean; C: any }) {
  const { accounts, balanceVisible, toggleBalanceVisible } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
    setActiveIdx(idx);
  };

  const cardBg = isDark ? "#212224" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";

  return (
    <View style={{ marginTop: 4, paddingBottom: 4 }}>
      {/* Header */}
      <View style={styles.accountsHeader}>
        <Text style={[styles.accountsTitle, { color: C.text }]}>Tus cuentas</Text>
        <TouchableOpacity
          onPress={toggleBalanceVisible}
          style={[styles.hideBtn, { backgroundColor: isDark ? "#1A1A1C" : "#F5F5F7" }]}
        >
          <Feather name={balanceVisible ? "eye-off" : "eye"} size={14} color={C.textSecondary} />
          <Text style={[styles.hideText, { color: C.textSecondary }]}>
            {balanceVisible ? "Ocultar saldos" : "Mostrar saldos"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_W + 12}
        snapToAlignment="start"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
      >
        {accounts.map((acc) => {
          const typeLabel = getAccountTypeLabel(acc.type);
          const balanceStr = formatBalance(acc.balance, acc.currencyCode, acc.currencySymbol, false);
          return (
            <View
              key={acc.id}
              style={[
                styles.card,
                {
                  width: CARD_W,
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  shadowColor: "#000",
                  shadowOpacity: isDark ? 0.4 : 0.06,
                },
              ]}
            >
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.cardName, { color: C.text }]} numberOfLines={1}>
                    {acc.name}
                  </Text>
                  <Text style={[styles.cardSub, { color: C.textSecondary }]}>
                    {typeLabel} · {acc.number}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.arrowBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F5F5F7" }]}
                  onPress={() =>
                    Alert.alert(
                      acc.name,
                      `Número: ${acc.number}\nTipo: ${typeLabel}\nMoneda: ${acc.currency}\nEstado: Activa`,
                    )
                  }
                >
                  <Feather name="chevron-right" size={16} color={C.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Balance */}
              <View style={{ marginBottom: 18 }}>
                <Text style={[styles.cardLabel, { color: C.textSecondary }]}>Saldo disponible</Text>
                <Text
                  style={[styles.cardBalance, { color: C.balanceText ?? C.text }]}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {balanceVisible ? balanceStr : `${acc.currencySymbol} ••••••`}
                </Text>
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={styles.ctaBtn}
                activeOpacity={0.85}
                onPress={() =>
                  Alert.alert(
                    "Detalles de cuenta",
                    `Cuenta: ${acc.number}\nTipo: ${typeLabel}\nMoneda: ${acc.currency}\nSaldo: ${balanceStr}`,
                    [{ text: "Cerrar" }],
                  )
                }
              >
                <Text style={styles.ctaBtnText}>Conoce más de tu cuenta</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Dots */}
      {accounts.length > 1 && (
        <View style={styles.dots}>
          {accounts.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dotItem,
                i === activeIdx
                  ? styles.dotActive
                  : [styles.dotInactive, { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "#D1D5DB" }],
              ]}
            />
          ))}
        </View>
      )}
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

  const COL_W = SCREEN_W / 4;

  const routes = [
    "/(tabs)/index",
    "/(tabs)/movements",
    "/(tabs)/transfers",
    "/(tabs)/payments",
    "/(tabs)/cards",
  ];

  const handleTxAction = (action: (typeof TX_ACTIONS)[0]) => {
    if (action.tab !== undefined) router.push(routes[action.tab] as any);
  };

  const handleCategory = (cat: (typeof CATEGORIES)[0]) => {
    if (cat.tab !== undefined) {
      router.push(routes[cat.tab] as any);
    } else if (cat.info) {
      Alert.alert(cat.label, cat.info, [
        { text: "Saber más", onPress: () => Linking.openURL("https://www.grupobancolombia.com").catch(() => {}) },
        { text: "Cerrar", style: "cancel" },
      ]);
    }
  };

  const handleNotifications = () => {
    Alert.alert(
      "Notificaciones",
      "No tienes notificaciones nuevas.\n\nActiva las alertas en Ajustes > Notificaciones para recibir avisos de tus transacciones.",
      [
        { text: "Ir a ajustes", onPress: () => router.push("/(tabs)/cards" as any) },
        { text: "Cerrar", style: "cancel" },
      ],
    );
  };

  const handleHelp = () => {
    Alert.alert(
      "Centro de ayuda",
      "¿Cómo podemos ayudarte?",
      [
        { text: "Llamar ahora", onPress: () => Linking.openURL("tel:018000912345").catch(() => {}) },
        { text: "WhatsApp", onPress: () => Linking.openURL("https://wa.me/573132095988").catch(() => {}) },
        { text: "Cerrar", style: "cancel" },
      ],
    );
  };

  const handleChat = () => {
    Alert.alert(
      "Chat con Bancolombia",
      "Conéctate con un asesor de Bancolombia para resolver tus dudas.",
      [
        { text: "Abrir WhatsApp", onPress: () => Linking.openURL("https://wa.me/573132095988?text=Hola,%20necesito%20ayuda").catch(() => {}) },
        { text: "Cancelar", style: "cancel" },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: C.background }]}>
      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: C.headerBg, borderBottomColor: C.border }]}>
        {/* Logo: wavy SVG lines + "Bancolombia" */}
        <View style={styles.headerLogoRow}>
          <Svg width={24} height={16} viewBox="0 0 24 16" fill="none">
            <Path d="M2.5,3 C8.5,1.2 15.5,5.2 21.5,3" stroke={isDark ? "white" : "#1C1C1E"} strokeWidth="2.8" strokeLinecap="round" />
            <Path d="M2.5,8 C8.5,6.2 15.5,10.2 21.5,8" stroke={YELLOW} strokeWidth="2.8" strokeLinecap="round" />
            <Path d="M2.5,13 C8.5,11.2 15.5,15.2 21.5,13" stroke={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"} strokeWidth="1.6" strokeLinecap="round" />
          </Svg>
          <Text style={[styles.headerLogoText, { color: C.text }]}>Bancolombia</Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon} onPress={handleNotifications}>
            <Feather name="bell" size={19} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={handleHelp}>
            <Feather name="help-circle" size={19} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={handleChat}>
            <Feather name="message-circle" size={19} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() =>
              Alert.alert("Cerrar sesión", "¿Estás seguro de que deseas salir?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Salir", style: "destructive", onPress: logout },
              ])
            }
          >
            <Feather name="log-out" size={19} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces contentContainerStyle={styles.scrollContent}>
        {/* ── HERO ── */}
        <View style={[styles.heroSection, { backgroundColor: C.heroSection }]}>
          <ColorArc />

          {/* Greeting */}
          <TouchableOpacity
            style={styles.greetingRow}
            activeOpacity={0.75}
            onPress={() => router.push("/(tabs)/cards" as any)}
          >
            <Text style={[styles.greetingText, { color: C.text }]}>Hola, {userName}</Text>
            <Feather name="chevron-right" size={22} color={isDark ? "rgba(255,255,255,0.5)" : "#9CA3AF"} />
          </TouchableOpacity>

          {/* Clave Dinámica */}
          <ClaveTimer />
        </View>

        {/* ── ACCOUNT CAROUSEL ── */}
        <AccountsSection isDark={isDark} C={C} />

        {/* ── TRANSACCIONES PRINCIPALES ── */}
        <View style={[styles.section, { backgroundColor: C.background }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Transacciones principales</Text>
          <View style={styles.txGrid}>
            {TX_ACTIONS.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.txItem, { width: SCREEN_W / 4 }]}
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
                style={[styles.txItem, { width: SCREEN_W / 4 }]}
                onPress={() => handleCategory(cat)}
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

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLogoRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerLogoText: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  headerIcons: { flexDirection: "row", gap: 0 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  /* Scroll */
  scrollContent: { paddingBottom: 24 },

  /* Hero */
  heroSection: { minHeight: 172, overflow: "hidden", paddingBottom: 22 },
  greetingRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 16, gap: 4, zIndex: 2,
  },
  greetingText: { fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: -0.5 },

  /* Clave Dinámica — dark pill */
  clavePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#212123",
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 10,
    paddingRight: 16,
    marginHorizontal: 20,
    marginTop: 14,
    gap: 10,
    alignSelf: "flex-start",
    zIndex: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  claveCircleWrap: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  lockIconOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  claveLabel: { fontSize: 9, color: "#A1A1AA", fontFamily: "Inter_500Medium" },
  claveCode: { fontSize: 14, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", letterSpacing: 1.5 },

  /* Account section */
  accountsHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 24, marginBottom: 12, marginTop: 16,
  },
  accountsTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  hideBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  hideText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  /* Card */
  card: {
    borderRadius: 20, padding: 20,
    borderWidth: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 18 },
  cardName: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  arrowBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  cardLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  cardBalance: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  ctaBtn: { backgroundColor: YELLOW, borderRadius: 30, paddingVertical: 13, alignItems: "center" },
  ctaBtnText: { fontSize: 14, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 14 },
  dotItem: { height: 6, borderRadius: 3 },
  dotActive: { width: 20, backgroundColor: YELLOW },
  dotInactive: { width: 6 },

  /* Sections */
  section: { paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", paddingHorizontal: 16, marginBottom: 16 },
  txGrid: { flexDirection: "row", flexWrap: "wrap" },
  txItem: { alignItems: "center", gap: 7, paddingBottom: 16, paddingHorizontal: 4 },
  txIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  txLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 13 },
});
