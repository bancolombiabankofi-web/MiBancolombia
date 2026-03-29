import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
import { useApp } from "@/context/AppContext";

const C = Colors.light;

type Contact = { name: string; account: string; bank: string; initial: string };

const CONTACTS: Contact[] = [
  { name: "Juan García", account: "****1234", bank: "Bancolombia", initial: "J" },
  { name: "María López", account: "****5678", bank: "Nequi", initial: "M" },
  { name: "Pedro Ramírez", account: "****9012", bank: "Davivienda", initial: "P" },
  { name: "Laura Torres", account: "****3456", bank: "Bancolombia", initial: "L" },
];

export default function TransfersScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { accounts, balanceVisible } = useApp();
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [note, setNote] = useState("");

  const formatInput = (v: string) => {
    const num = v.replace(/\D/g, "");
    return num;
  };

  const displayAmount = amount
    ? new Intl.NumberFormat("es-CO").format(parseInt(amount))
    : "";

  const handleTransfer = () => {
    if (!selected || !amount) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "¡Transferencia exitosa!",
      `Se enviaron $${displayAmount} COP a ${selected.name}`,
      [{ text: "OK", onPress: () => { setAmount(""); setSelected(null); setNote(""); } }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Transferir</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} bounces>
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>¿Cuánto deseas transferir?</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={displayAmount}
                onChangeText={(t) => setAmount(formatInput(t))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#C0C0C0"
              />
              <Text style={styles.cop}>COP</Text>
            </View>
            <Text style={styles.fromAccount}>
              Desde: {accounts[0].name} • {balanceVisible
                ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(accounts[0].balance)
                : "•••••"}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contactos frecuentes</Text>
            <View style={styles.contacts}>
              {CONTACTS.map((c) => (
                <TouchableOpacity
                  key={c.name}
                  style={[styles.contact, selected?.name === c.name && styles.contactSelected]}
                  onPress={() => setSelected(c)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatar, selected?.name === c.name && styles.avatarSelected]}>
                    <Text style={[styles.avatarText, selected?.name === c.name && styles.avatarTextSelected]}>
                      {c.initial}
                    </Text>
                  </View>
                  <Text style={styles.contactName} numberOfLines={1}>{c.name.split(" ")[0]}</Text>
                  {selected?.name === c.name && (
                    <Feather name="check-circle" size={14} color={C.yellow} style={styles.check} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {selected && (
            <View style={styles.selectedCard}>
              <View style={styles.selectedAvatar}>
                <Text style={styles.selectedAvatarText}>{selected.initial}</Text>
              </View>
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedName}>{selected.name}</Text>
                <Text style={styles.selectedMeta}>{selected.bank} • {selected.account}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Feather name="x" size={18} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Descripción (opcional)</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Ej: Pago deuda, regalo..."
              placeholderTextColor="#C0C0C0"
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, (!selected || !amount) && styles.btnDisabled]}
            onPress={handleTransfer}
            disabled={!selected || !amount}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Transferir ahora</Text>
            <Feather name="arrow-right" size={18} color="#1C1C1E" />
          </TouchableOpacity>

          <View style={{ height: Platform.OS === "web" ? 100 : 90 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  amountSection: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  amountLabel: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 16 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  currency: { fontSize: 28, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  amountInput: {
    fontSize: 40,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
    minWidth: 100,
    textAlign: "center",
  },
  cop: { fontSize: 16, color: C.textSecondary, fontFamily: "Inter_500Medium", alignSelf: "flex-end", marginBottom: 6 },
  fromAccount: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  contacts: { flexDirection: "row", gap: 12 },
  contact: { alignItems: "center", gap: 6, position: "relative" },
  contactSelected: {},
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarSelected: { borderColor: C.yellow, backgroundColor: C.yellow + "20" },
  avatarText: { fontSize: 20, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  avatarTextSelected: { color: "#1C1C1E" },
  contactName: { fontSize: 11, color: C.textSecondary, fontFamily: "Inter_400Regular" },
  check: { position: "absolute", bottom: 20, right: -2 },
  selectedCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  selectedAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedAvatarText: { fontSize: 18, fontWeight: "600", color: "#1C1C1E", fontFamily: "Inter_600SemiBold" },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 14, fontWeight: "600", color: C.text, fontFamily: "Inter_600SemiBold" },
  selectedMeta: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_400Regular", marginTop: 2 },
  noteSection: { paddingHorizontal: 16, marginBottom: 16 },
  noteLabel: { fontSize: 13, color: C.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 8 },
  noteInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
    fontFamily: "Inter_400Regular",
  },
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
