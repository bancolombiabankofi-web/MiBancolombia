import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
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
const CARD_W = Math.min(SCREEN_W - 40, 340);
const COL_W = SCREEN_W / 4;

function getAccountTypeLabel(type: string) {
  if (type === "savings") return "Ahorros";
  if (type === "checking") return "Corriente";
  if (type === "credit") return "Crédito";
  return type;
}

const TX_ACTIONS = [
  { icon: "bar-chart-2", label: "Saldos y\nmovimientos", color: "#3B82F6", tab: 1 },
  { icon: "send",        label: "Transferir\nplata",       color: "#8B5CF6", tab: 2 },
  { icon: "credit-card", label: "Pagar\ncréditos",         color: "#6366F1", tab: 2 },
  { icon: "file-text",   label: "Pagar\nfacturas",         color: "#EF4444", tab: 2 },
  { icon: "repeat",      label: "Transferiya\notro banco", color: "#10B981", tab: 2 },
  { icon: "download",    label: "Recibir\nplata",          color: "#06B6D4", tab: 2 },
  { icon: "smartphone",  label: "Recargar\ncelular",       color: "#F59E0B", tab: 2 },
  { icon: "trending-up", label: "Avances y\ndesembolsos",  color: "#10B981", tab: 2 },
];

const CATEGORIES = [
  { icon: "target",          label: "Metas",       color: "#AF52DE", bg: "#AF52DE22", tab: 3 },
  { icon: "home",            label: "Vivienda",    color: "#FF6B35", bg: "#FF6B3522",
    info: "Tu360 Inmobiliario\n\nEncontramos la vivienda perfecta para ti. Préstamos hipotecarios, leasing y subsidios de vivienda disponibles." },
  { icon: "shield",          label: "Seguros",     color: "#34C759", bg: "#34C75922",
    info: "Seguros Bancolombia\n\nProtege lo que más importa. Seguros de vida, hogar, vehículo y salud con las mejores condiciones." },
  { icon: "trending-up",     label: "Inversiones", color: "#007AFF", bg: "#007AFF22",
    info: "Invierte con Bancolombia\n\nFDAs, CDTs y Fondos de inversión. Haz crecer tu dinero con nuestras opciones de inversión." },
  { icon: "dollar-sign",     label: "Créditos",    color: "#FDDA24", bg: "#FDDA2422",
    info: "Créditos de consumo\n\nLibranza, crédito personal, rotativo y microcrédito. Solicita el tuyo en minutos." },
  { icon: "more-horizontal", label: "Más",         color: "#8B5CF6", bg: "#8B5CF622", tab: 3 },
];

/* ── SVG Arc decoration ── */
function ColorArc() {
  return (
    <View
      style={{ position: "absolute", top: 70, left: 0, right: 0, height: 120, overflow: "hidden" }}
      pointerEvents="none"
    >
      <Svg width={SCREEN_W} height={120} viewBox={`0 0 ${SCREEN_W} 120`} fill="none">
        <Path d={`M -10,95 Q 15,85 30,108`} stroke="#00f0ff" strokeWidth="3" strokeLinecap="round" />
        <Path d={`M -14,102 Q 10,92 24,115`} stroke="#905cf5" strokeWidth="3.5" strokeLinecap="round" />
        <Path d={`M ${SCREEN_W * 0.82},35 Q ${SCREEN_W * 0.9},43 ${SCREEN_W + 2},78`} stroke="#905cf5" strokeWidth="4" strokeLinecap="round" />
        <Path d={`M ${SCREEN_W * 0.42},58 A 110 110 0 0 1 ${SCREEN_W * 0.63},38`} stroke="#00EA90" strokeWidth="5" strokeLinecap="round" />
        <Path d={`M ${SCREEN_W * 0.62},38 A 110 110 0 0 1 ${SCREEN_W * 0.79},48`} stroke="#FED201" strokeWidth="9" strokeLinecap="round" />
        <Path d={`M ${SCREEN_W * 0.78},45 A 95 95 0 0 1 ${SCREEN_W + 4},98`} stroke="#FF7A1A" strokeWidth="11" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/* ── Clave Dinámica ── */
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

  const R = 13;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - countdown / 30);

  return (
    <TouchableOpacity
      style={styles.clavePill}
      onPress={() =>
        Alert.alert(
          "Clave Dinámica",
          `Tu clave activa:\n\n${codeVal}\n\nCambia cada 30 segundos. Úsala para confirmar operaciones.`,
          [{ text: "Entendido" }],
        )
      }
      activeOpacity={0.82}
    >
      <View style={styles.claveCircleWrap}>
        <Svg width={32} height={32} style={{ transform: [{ rotate: "-90deg" }] }}>
          <Circle cx={16} cy={16} r={R} stroke="#2A2A2A" strokeWidth={2.5} fill="transparent" />
          <Circle
            cx={16} cy={16} r={R}
            stroke={YELLOW} strokeWidth={2.5} fill="transparent"
            strokeDasharray={CIRC} strokeDashoffset={dashOffset} strokeLinecap="round"
          />
        </Svg>
        <View style={styles.lockOverlay}>
          <Feather name="lock" size={10} color="#FFFFFF" />
        </View>
      </View>
      <View>
        <Text style={styles.claveLabel}>Clave Dinámica</Text>
        <Text style={styles.claveCode}>{codeVal}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ── Account Cards ── */
function AccountsSection({ isDark, C }: { isDark: boolean; C: any }) {
  const { accounts, balanceVisible, toggleBalanceVisible } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
    setActiveIdx(Math.max(0, Math.min(idx, accounts.length - 1)));
  };

  const cardBg = isDark ? "#212224" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(255,255,255,0.09)" : "#E5E7EB";

  return (
    <View style={{ marginTop: 4 }}>
      <View style={styles.accountsHeader}>
        <Text style={[styles.accountsTitle, { color: C.text }]}>Tus cuentas</Text>
        <TouchableOpacity
          onPress={toggleBalanceVisible}
          style={[styles.hideBtn, { backgroundColor: isDark ? "#1A1A1C" : "#F0F0F3" }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name={balanceVisible ? "eye-off" : "eye"} size={13} color={C.textSecondary} />
          <Text style={[styles.hideText, { color: C.textSecondary }]}>
            {balanceVisible ? "Ocultar" : "Mostrar"}
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
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        {accounts.map((acc) => {
          const typeLabel = getAccountTypeLabel(acc.type);
          const balanceStr = formatBalance(acc.balance, acc.currencyCode, acc.currencySymbol, false);
          return (
            <View
              key={acc.id}
              style={[styles.card, { width: CARD_W, backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.cardName, { color: C.text }]} numberOfLines={1}>{acc.name}</Text>
                  <Text style={[styles.cardSub, { color: C.textSecondary }]} numberOfLines={1}>
                    {typeLabel} · {acc.number}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.arrowBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F5F5F7" }]}
                  onPress={() => Alert.alert(acc.name, `Número: ${acc.number}\nTipo: ${typeLabel}\nMoneda: ${acc.currency}\nEstado: Activa`)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="chevron-right" size={15} color={C.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text style={[styles.cardLabel, { color: C.textSecondary }]}>Saldo disponible</Text>
                <Text style={[styles.cardBalance, { color: C.balanceText ?? C.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {balanceVisible ? balanceStr : `${acc.currencySymbol} ••••••`}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.ctaBtn}
                activeOpacity={0.85}
                onPress={() => Alert.alert(
                  "Detalles de cuenta",
                  `Cuenta: ${acc.number}\nTipo: ${typeLabel}\nMoneda: ${acc.currency}\nSaldo: ${balanceStr}`,
                  [{ text: "Cerrar" }],
                )}
              >
                <Text style={styles.ctaBtnText}>Conoce más de tu cuenta</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {accounts.length > 1 && (
        <View style={styles.dots}>
          {accounts.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dotItem,
                i === activeIdx
                  ? styles.dotActive
                  : [styles.dotInactive, { backgroundColor: isDark ? "rgba(255,255,255,0.18)" : "#D1D5DB" }],
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
  const topPad = insets.top || (Platform.OS === "web" ? 20 : 0);

  const routes = [
    "/(tabs)/index",
    "/(tabs)/movements",
    "/(tabs)/transfers",
    "/(tabs)/payments",
    "/(tabs)/cards",
  ];

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que deseas salir de Mi Bancolombia?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/login");
          },
        },
      ],
    );
  };

  const handleTxAction = (action: (typeof TX_ACTIONS)[0]) => {
    router.push(routes[action.tab] as any);
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

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: C.background }]}>
      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: C.headerBg, borderBottomColor: C.border }]}>
        <View style={styles.headerLogoRow}>
          <Image
            source={require("../../assets/images/pwa-icon.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={[styles.headerLogoText, { color: C.text }]}>Mi Bancolombia</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.headerIcon}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            onPress={() =>
              Alert.alert(
                "Notificaciones",
                "No tienes notificaciones nuevas.",
                [
                  { text: "Ir a Ajustes", onPress: () => router.push("/(tabs)/cards" as any) },
                  { text: "Cerrar", style: "cancel" },
                ],
              )
            }
          >
            <Feather name="bell" size={18} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            onPress={() =>
              Alert.alert(
                "Centro de ayuda",
                "¿Cómo podemos ayudarte?",
                [
                  { text: "Llamar 01 8000 912345", onPress: () => Linking.openURL("tel:018000912345").catch(() => {}) },
                  { text: "WhatsApp", onPress: () => Linking.openURL("https://wa.me/573132095988").catch(() => {}) },
                  { text: "Cerrar", style: "cancel" },
                ],
              )
            }
          >
            <Feather name="help-circle" size={18} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            onPress={() =>
              Alert.alert(
                "Chat Bancolombia",
                "Conéctate con un asesor.",
                [
                  { text: "Abrir WhatsApp", onPress: () => Linking.openURL("https://wa.me/573132095988?text=Hola,%20necesito%20ayuda").catch(() => {}) },
                  { text: "Cancelar", style: "cancel" },
                ],
              )
            }
          >
            <Feather name="message-circle" size={18} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={18} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* ── HERO ── */}
        <View style={[styles.heroSection, { backgroundColor: C.heroSection }]}>
          <ColorArc />
          <TouchableOpacity
            style={styles.greetingRow}
            activeOpacity={0.75}
            onPress={() => router.push("/(tabs)/cards" as any)}
          >
            <Text style={[styles.greetingText, { color: C.text }]}>Hola, {userName}</Text>
            <Feather name="chevron-right" size={20} color={isDark ? "rgba(255,255,255,0.5)" : "#9CA3AF"} />
          </TouchableOpacity>
          <ClaveTimer />
        </View>

        {/* ── CUENTAS ── */}
        <AccountsSection isDark={isDark} C={C} />

        {/* ── TRANSACCIONES PRINCIPALES ── */}
        <View style={[styles.section, { backgroundColor: C.background }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Transacciones principales</Text>
          <View style={styles.txGrid}>
            {TX_ACTIONS.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.txItem, { width: COL_W }]}
                onPress={() => handleTxAction(action)}
                activeOpacity={0.7}
              >
                <View style={[styles.txIconWrap, { backgroundColor: action.color + (isDark ? "28" : "18") }]}>
                  <Feather name={action.icon as any} size={19} color={action.color} />
                </View>
                <Text style={[styles.txLabel, { color: C.text }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── EXPLORAR ── */}
        <View style={[styles.section, { backgroundColor: C.sectionBg, marginTop: 6 }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Explorar categorías</Text>
          <View style={styles.txGrid}>
            {CATEGORIES.map((cat, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.txItem, { width: COL_W }]}
                onPress={() => handleCategory(cat)}
                activeOpacity={0.7}
              >
                <View style={[styles.txIconWrap, { backgroundColor: isDark ? cat.color + "28" : cat.bg }]}>
                  <Feather name={cat.icon as any} size={19} color={cat.color} />
                </View>
                <Text style={[styles.txLabel, { color: C.text }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLogoRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0 },
  headerLogo: { width: 30, height: 30, borderRadius: 8 },
  headerLogoText: {
    fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold",
    letterSpacing: -0.2, flexShrink: 1,
  },
  headerIcons: { flexDirection: "row" },
  headerIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },

  /* Hero */
  heroSection: { height: 150, overflow: "hidden", paddingBottom: 16 },
  greetingRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 18, paddingTop: 14, gap: 4, zIndex: 2,
  },
  greetingText: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: -0.4 },

  /* Clave Dinámica */
  clavePill: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#212123", borderRadius: 30,
    paddingVertical: 6, paddingHorizontal: 10, paddingRight: 14,
    marginHorizontal: 18, marginTop: 10,
    gap: 8, alignSelf: "flex-start", zIndex: 2,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  claveCircleWrap: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  lockOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  claveLabel: { fontSize: 9, color: "#A1A1AA", fontFamily: "Inter_500Medium" },
  claveCode: { fontSize: 13, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", letterSpacing: 1.5 },

  /* Accounts */
  accountsHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, marginBottom: 10, marginTop: 14,
  },
  accountsTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  hideBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16,
  },
  hideText: { fontSize: 11, fontFamily: "Inter_400Regular" },

  /* Card */
  card: {
    borderRadius: 18, padding: 16, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.08,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  cardName: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  arrowBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  cardBalance: { fontSize: 24, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  ctaBtn: { backgroundColor: YELLOW, borderRadius: 24, paddingVertical: 11, alignItems: "center" },
  ctaBtnText: { fontSize: 13, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 10 },
  dotItem: { height: 5, borderRadius: 3 },
  dotActive: { width: 18, backgroundColor: YELLOW },
  dotInactive: { width: 5 },

  /* Sections */
  section: { paddingTop: 16, paddingBottom: 6 },
  sectionTitle: {
    fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold",
    paddingHorizontal: 16, marginBottom: 12,
  },
  txGrid: { flexDirection: "row", flexWrap: "wrap" },
  txItem: { alignItems: "center", gap: 6, paddingBottom: 14, paddingHorizontal: 2 },
  txIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  txLabel: {
    fontSize: 9.5, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 12, paddingHorizontal: 2,
  },
});
