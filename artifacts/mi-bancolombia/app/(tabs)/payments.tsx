import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

const C = Colors.light;

type Service = {
  id: string;
  name: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  category: string;
};

const SERVICES: Service[] = [
  { id: "epm", name: "EPM", icon: "zap", color: "#F59E0B", category: "Servicios" },
  { id: "enel", name: "Enel", icon: "zap", color: "#3B82F6", category: "Servicios" },
  { id: "gas", name: "Gas Natural", icon: "thermometer", color: "#EF4444", category: "Servicios" },
  { id: "claro", name: "Claro", icon: "smartphone", color: "#EF4444", category: "Telefonía" },
  { id: "movistar", name: "Movistar", icon: "smartphone", color: "#3B82F6", category: "Telefonía" },
  { id: "tigo", name: "Tigo", icon: "smartphone", color: "#8B5CF6", category: "Telefonía" },
  { id: "netflix", name: "Netflix", icon: "tv", color: "#EF4444", category: "Streaming" },
  { id: "spotify", name: "Spotify", icon: "music", color: "#10B981", category: "Streaming" },
  { id: "dian", name: "DIAN", icon: "file-text", color: "#6B7280", category: "Gobierno" },
  { id: "beca", name: "ICFES", icon: "book", color: "#F97316", category: "Gobierno" },
];

const RECHARGE_OPS = [
  { label: "$2.000", value: "2000" },
  { label: "$5.000", value: "5000" },
  { label: "$10.000", value: "10000" },
  { label: "$20.000", value: "20000" },
  { label: "$30.000", value: "30000" },
  { label: "$50.000", value: "50000" },
];

type Tab = "services" | "recharge";

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [tab, setTab] = useState<Tab>("services");
  const [phone, setPhone] = useState("");
  const [selectedRecharge, setSelectedRecharge] = useState("");
  const [search, setSearch] = useState("");

  const filtered = SERVICES.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePay = (s: Service) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Pagar servicio", `¿Confirmar pago a ${s.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("✓ Pago exitoso", `Pago a ${s.name} realizado correctamente`);
        },
      },
    ]);
  };

  const handleRecharge = () => {
    if (!phone || !selectedRecharge) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "✓ Recarga exitosa",
      `Recarga de $${new Intl.NumberFormat("es-CO").format(parseInt(selectedRecharge))} al ${phone}`,
      [{ text: "OK", onPress: () => { setPhone(""); setSelectedRecharge(""); } }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Pagos y Recargas</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "services" && styles.tabActive]}
          onPress={() => setTab("services")}
        >
          <Text style={[styles.tabText, tab === "services" && styles.tabTextActive]}>
            Pagar servicios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "recharge" && styles.tabActive]}
          onPress={() => setTab("recharge")}
        >
          <Text style={[styles.tabText, tab === "recharge" && styles.tabTextActive]}>
            Recargar celular
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "services" ? (
        <ScrollView showsVerticalScrollIndicator={false} bounces>
          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color={C.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar empresa..."
              placeholderTextColor="#C0C0C0"
            />
          </View>
          <View style={styles.grid}>
            {filtered.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.serviceCard}
                onPress={() => handlePay(s)}
                activeOpacity={0.7}
              >
                <View style={[styles.serviceIcon, { backgroundColor: s.color + "20" }]}>
                  <Feather name={s.icon} size={20} color={s.color} />
                </View>
                <Text style={styles.serviceName}>{s.name}</Text>
                <Text style={styles.serviceCategory}>{s.category}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: Platform.OS === "web" ? 100 : 90 }} />
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} bounces>
          <View style={styles.rechargeCard}>
            <Text style={styles.rechargeLabel}>Número de celular</Text>
            <View style={styles.phoneRow}>
              <View style={styles.flag}>
                <Text style={styles.flagText}>🇨🇴 +57</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="3XX XXX XXXX"
                placeholderTextColor="#C0C0C0"
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Valor de recarga</Text>
            <View style={styles.rechargeGrid}>
              {RECHARGE_OPS.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  style={[
                    styles.rechargeOption,
                    selectedRecharge === o.value && styles.rechargeSelected,
                  ]}
                  onPress={() => setSelectedRecharge(o.value)}
                >
                  <Text
                    style={[
                      styles.rechargeAmount,
                      selectedRecharge === o.value && styles.rechargeAmountSelected,
                    ]}
                  >
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, (!phone || !selectedRecharge) && styles.btnDisabled]}
            onPress={handleRecharge}
            disabled={!phone || !selectedRecharge}
          >
            <Feather name="smartphone" size={18} color="#1C1C1E" />
            <Text style={styles.btnText}>Recargar ahora</Text>
          </TouchableOpacity>

          <View style={{ height: Platform.OS === "web" ? 100 : 90 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#EBEBEB",
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, color: C.textSecondary, fontFamily: "Inter_500Medium" },
  tabTextActive: { color: C.text, fontFamily: "Inter_600SemiBold" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: C.text, fontFamily: "Inter_400Regular" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    width: "30%",
    alignItems: "center",
    gap: 6,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: { fontSize: 12, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  serviceCategory: { fontSize: 10, color: C.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" },
  rechargeCard: { backgroundColor: "#FFFFFF", marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 16 },
  rechargeLabel: { fontSize: 13, color: C.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 10 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  flag: { backgroundColor: "#F5F5F7", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 12 },
  flagText: { fontSize: 13, color: C.text, fontFamily: "Inter_500Medium" },
  phoneInput: { flex: 1, fontSize: 20, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  rechargeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rechargeOption: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  rechargeSelected: { borderColor: C.yellow, backgroundColor: C.yellow + "15" },
  rechargeAmount: { fontSize: 14, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  rechargeAmountSelected: { color: "#1C1C1E" },
  btn: {
    backgroundColor: C.yellow,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 16, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
});
