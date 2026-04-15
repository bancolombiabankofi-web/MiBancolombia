import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import type { Account, RegisteredUser } from "@/context/AppContext";

const BG = "#0F1320";
const CARD = "#161B2E";
const BORDER = "rgba(253,218,36,0.18)";
const TEXT = "#FFFFFF";
const TEXTSEC = "rgba(255,255,255,0.55)";
const YELLOW = "#FDDA24";
const GREEN = "#10B981";
const RED = "#EF4444";
const BLUE = "#3B82F6";
const ORANGE = "#F59E0B";

const TYPE_LABEL: Record<string, string> = { savings: "Ahorros", checking: "Corriente", credit: "Crédito" };
const TYPE_COLOR: Record<string, string> = { savings: GREEN, checking: BLUE, credit: ORANGE };
const STATUS_COLOR: Record<string, string> = { active: GREEN, suspended: ORANGE, blocked: RED };
const STATUS_LABEL: Record<string, string> = { active: "Activa", suspended: "Suspendida", blocked: "Bloqueada" };

type AccountWithUser = Account & { userName: string; userDoc: string; userId: string };

export default function CuentasScreen() {
  const { getAllAccounts, getAllUsers, updateAccount, addAuditLog } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 60 : insets.top;

  const [accounts, setAccounts] = useState<AccountWithUser[]>([]);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AccountWithUser | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editBalance, setEditBalance] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "suspended" | "blocked">("active");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [u, a] = await Promise.all([getAllUsers(), getAllAccounts()]);
    const regularUsers = u.filter((x) => !x.isAdmin);
    setUsers(regularUsers);
    const withUser: AccountWithUser[] = a.map((acc) => {
      const owner = regularUsers.find((usr) => acc.userId === usr.id || acc.id.includes(usr.id));
      return {
        ...acc,
        userName: owner ? `${owner.firstName} ${owner.lastName}` : "Demo",
        userDoc: owner?.documentNumber ?? "---",
        userId: owner?.id ?? acc.userId ?? "",
      };
    });
    setAccounts(withUser);
    setLoading(false);
  }, [getAllAccounts, getAllUsers]);

  useEffect(() => { load(); }, []);

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.userName.toLowerCase().includes(q) ||
      a.userDoc.toLowerCase().includes(q) ||
      a.number.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q)
    );
  });

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const openEdit = (a: AccountWithUser) => {
    setSelected(a);
    setEditBalance(String(a.balance));
    setEditStatus((a.status as any) ?? "active");
    setEditModal(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    const newBalance = Number(editBalance) || 0;
    await updateAccount(selected.userId, selected.id, { balance: newBalance, status: editStatus });
    await addAuditLog("EDIT_ACCOUNT", `Cuenta ${selected.number} actualizada: saldo=${newBalance}, estado=${editStatus}`, selected.userId);
    setEditModal(false);
    load();
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Cuentas</Text>
        <Text style={styles.sub}>{accounts.length} cuentas · Total: {fmt(totalBalance)}</Text>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={TEXTSEC} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por usuario, número..."
          placeholderTextColor={TEXTSEC}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={TEXTSEC} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {loading ? (
          <Text style={styles.empty}>Cargando cuentas...</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Sin resultados</Text>
        ) : (
          filtered.map((a) => (
            <TouchableOpacity
              key={`${a.userId}_${a.id}`}
              style={styles.card}
              onPress={() => setSelected(selected?.id === a.id && selected?.userId === a.userId ? null : a)}
            >
              <View style={styles.cardTop}>
                <View style={[styles.typeTag, { backgroundColor: TYPE_COLOR[a.type] + "22", borderColor: TYPE_COLOR[a.type] + "44" }]}>
                  <Text style={[styles.typeText, { color: TYPE_COLOR[a.type] }]}>{TYPE_LABEL[a.type]}</Text>
                </View>
                <View style={[styles.statusTag, { backgroundColor: STATUS_COLOR[a.status ?? "active"] + "22" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[a.status ?? "active"] }]}>
                    {STATUS_LABEL[a.status ?? "active"]}
                  </Text>
                </View>
              </View>

              <Text style={styles.accountNumber}>{a.number}</Text>
              <Text style={styles.accountName}>{a.name}</Text>
              <Text style={styles.accountBalance}>{a.currencySymbol ?? "$"} {a.balance.toLocaleString("es-CO")}</Text>
              <Text style={styles.accountOwner}>
                <Feather name="user" size={11} color={TEXTSEC} /> {a.userName} · {a.userDoc}
              </Text>

              {selected?.id === a.id && selected?.userId === a.userId && (
                <View style={styles.detail}>
                  <DetailRow label="ID cuenta" value={a.id} />
                  <DetailRow label="Tipo" value={TYPE_LABEL[a.type]} />
                  <DetailRow label="Moneda" value={`${a.currency} (${a.currencyCode})`} />
                  <DetailRow label="Estado" value={STATUS_LABEL[a.status ?? "active"]} />
                  <DetailRow label="Titular" value={a.userName} />
                  <DetailRow label="Documento" value={a.userDoc} />
                  <DetailRow label="ID usuario" value={a.userId} />

                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(a)}>
                    <Feather name="edit-2" size={14} color={YELLOW} />
                    <Text style={styles.editBtnText}>Editar cuenta</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Cuenta</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Feather name="x" size={20} color={TEXTSEC} />
              </TouchableOpacity>
            </View>

            <Text style={styles.editLabel}>Saldo (COP)</Text>
            <TextInput
              style={styles.editInput}
              value={editBalance}
              onChangeText={setEditBalance}
              keyboardType="numeric"
              placeholderTextColor={TEXTSEC}
            />

            <Text style={[styles.editLabel, { marginTop: 16 }]}>Estado</Text>
            <View style={styles.statusOptions}>
              {(["active", "suspended", "blocked"] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusOpt, { borderColor: STATUS_COLOR[s], backgroundColor: editStatus === s ? STATUS_COLOR[s] + "33" : "transparent" }]}
                  onPress={() => setEditStatus(s)}
                >
                  <Text style={[styles.statusOptText, { color: STATUS_COLOR[s] }]}>{STATUS_LABEL[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
              <Text style={styles.saveBtnText}>Guardar cambios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dRow}>
      <Text style={styles.dLabel}>{label}</Text>
      <Text style={styles.dValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: TEXT },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 2 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT },
  card: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  cardTop: { flexDirection: "row", gap: 8, marginBottom: 8 },
  typeTag: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  typeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  statusTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  accountNumber: { fontSize: 18, fontFamily: "Inter_700Bold", color: TEXT, letterSpacing: 1, marginBottom: 2 },
  accountName: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC, marginBottom: 6 },
  accountBalance: { fontSize: 20, fontFamily: "Inter_700Bold", color: YELLOW, marginBottom: 4 },
  accountOwner: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXTSEC },
  detail: { marginTop: 12, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12 },
  dRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  dLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXTSEC },
  dValue: { fontSize: 11, fontFamily: "Inter_500Medium", color: TEXT },
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: YELLOW + "15", borderRadius: 10, borderWidth: 1, borderColor: YELLOW + "40", paddingVertical: 10, marginTop: 12 },
  editBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: YELLOW },
  empty: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXTSEC, textAlign: "center", paddingVertical: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#161B2E", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: BORDER },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: TEXT },
  editLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: TEXTSEC, marginBottom: 6 },
  editInput: { backgroundColor: "#0F1320", borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT },
  statusOptions: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statusOpt: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  statusOptText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  saveBtn: { backgroundColor: YELLOW, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1C1C1E" },
});
