import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
import type { RegisteredUser } from "@/context/AppContext";

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

const STATUS_COLOR: Record<string, string> = {
  active: GREEN,
  suspended: ORANGE,
  blocked: RED,
};
const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  suspended: "Suspendido",
  blocked: "Bloqueado",
};

export default function UsuariosScreen() {
  const { getAllUsers, updateUser, deleteUser, addAuditLog } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 60 : insets.top;

  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RegisteredUser | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState<Partial<RegisteredUser>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const u = await getAllUsers();
    setUsers(u.filter((x) => !x.isAdmin));
    setLoading(false);
  }, [getAllUsers]);

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.documentNumber.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const openEdit = (u: RegisteredUser) => {
    setEditData({
      firstName: u.firstName,
      secondName: u.secondName,
      lastName: u.lastName,
      secondLastName: u.secondLastName,
      email: u.email,
      phone: u.phone,
      pin: u.pin,
      status: u.status ?? "active",
      balance: u.balance ?? 0,
    });
    setSelected(u);
    setEditModal(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    await updateUser(selected.id, editData);
    await addAuditLog("EDIT_USER", `Editado usuario ${selected.documentNumber}: ${JSON.stringify(editData)}`, selected.id);
    setEditModal(false);
    load();
  };

  const handleDelete = (u: RegisteredUser) => {
    if (Platform.OS === "web") {
      const confirm = window.confirm(`¿Eliminar usuario ${u.firstName} ${u.lastName}? Esta acción no se puede deshacer.`);
      if (confirm) doDelete(u);
    } else {
      Alert.alert("Eliminar usuario", `¿Eliminar a ${u.firstName} ${u.lastName}?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => doDelete(u) },
      ]);
    }
  };

  const doDelete = async (u: RegisteredUser) => {
    await deleteUser(u.id);
    if (selected?.id === u.id) setSelected(null);
    load();
  };

  const toggleStatus = async (u: RegisteredUser, status: "active" | "suspended" | "blocked") => {
    await updateUser(u.id, { status });
    await addAuditLog("CHANGE_STATUS", `Estado de ${u.documentNumber} cambiado a ${status}`, u.id);
    load();
    if (selected?.id === u.id) setSelected((prev) => prev ? { ...prev, status } : prev);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Usuarios</Text>
        <Text style={styles.sub}>{users.length} usuarios registrados</Text>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={TEXTSEC} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, doc, email..."
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
          <Text style={styles.empty}>Cargando usuarios...</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Sin resultados</Text>
        ) : (
          filtered.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={[styles.userCard, selected?.id === u.id && styles.userCardActive]}
              onPress={() => setSelected(selected?.id === u.id ? null : u)}
            >
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {u.firstName[0]}{u.lastName[0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{u.firstName} {u.secondName} {u.lastName} {u.secondLastName}</Text>
                  <Text style={styles.userDoc}>{u.documentType} · {u.documentNumber}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[u.status ?? "active"] + "22" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[u.status ?? "active"] }]}>
                    {STATUS_LABEL[u.status ?? "active"]}
                  </Text>
                </View>
              </View>

              {selected?.id === u.id && (
                <View style={styles.detail}>
                  <Row label="Email" value={u.email} />
                  <Row label="Teléfono" value={u.phone} />
                  <Row label="F. Nacimiento" value={u.birthDate} />
                  <Row label="País residencia" value={u.countryResidence} />
                  <Row label="País nacimiento" value={u.countryBirth} />
                  <Row label="Moneda" value={`${u.currencyCode} (${u.currencySymbol})`} />
                  <Row label="Saldo" value={`${u.currencySymbol ?? "$"}${(u.balance ?? 0).toLocaleString("es-CO")}`} />
                  <Row label="PIN" value={u.pin} secret />
                  <Row label="Registrado" value={new Date(u.createdAt).toLocaleString("es-CO")} />
                  <Row label="ID" value={u.id} />

                  <View style={styles.statusRow}>
                    <Text style={styles.statusRowLabel}>Estado:</Text>
                    {(["active", "suspended", "blocked"] as const).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusBtn, { borderColor: STATUS_COLOR[s], backgroundColor: u.status === s ? STATUS_COLOR[s] + "33" : "transparent" }]}
                        onPress={() => toggleStatus(u, s)}
                      >
                        <Text style={[styles.statusBtnText, { color: STATUS_COLOR[s] }]}>{STATUS_LABEL[s]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(u)}>
                      <Feather name="edit-2" size={14} color={YELLOW} />
                      <Text style={styles.editBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(u)}>
                      <Feather name="trash-2" size={14} color={RED} />
                      <Text style={styles.deleteBtnText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
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
              <Text style={styles.modalTitle}>Editar Usuario</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Feather name="x" size={20} color={TEXTSEC} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <EditField label="Primer nombre" value={editData.firstName ?? ""} onChange={(v) => setEditData((p) => ({ ...p, firstName: v }))} />
              <EditField label="Segundo nombre" value={editData.secondName ?? ""} onChange={(v) => setEditData((p) => ({ ...p, secondName: v }))} />
              <EditField label="Primer apellido" value={editData.lastName ?? ""} onChange={(v) => setEditData((p) => ({ ...p, lastName: v }))} />
              <EditField label="Segundo apellido" value={editData.secondLastName ?? ""} onChange={(v) => setEditData((p) => ({ ...p, secondLastName: v }))} />
              <EditField label="Email" value={editData.email ?? ""} onChange={(v) => setEditData((p) => ({ ...p, email: v }))} />
              <EditField label="Teléfono" value={editData.phone ?? ""} onChange={(v) => setEditData((p) => ({ ...p, phone: v }))} keyboard="phone-pad" />
              <EditField label="PIN (4 dígitos)" value={editData.pin ?? ""} onChange={(v) => setEditData((p) => ({ ...p, pin: v }))} keyboard="numeric" maxLen={4} />
              <EditField label="Saldo ($)" value={String(editData.balance ?? 0)} onChange={(v) => setEditData((p) => ({ ...p, balance: Number(v) || 0 }))} keyboard="numeric" />

              <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                <Text style={styles.saveBtnText}>Guardar cambios</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <TouchableOpacity onPress={() => secret && setShow((s) => !s)}>
        <Text style={styles.rowValue}>{secret && !show ? "••••" : value}</Text>
      </TouchableOpacity>
    </View>
  );
}

function EditField({ label, value, onChange, keyboard, maxLen }: { label: string; value: string; onChange: (v: string) => void; keyboard?: any; maxLen?: number }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        style={styles.editInput}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard ?? "default"}
        maxLength={maxLen}
        placeholderTextColor={TEXTSEC}
      />
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
  userCard: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  userCardActive: { borderColor: YELLOW + "60" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: YELLOW + "22", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontFamily: "Inter_700Bold", color: YELLOW },
  userName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: TEXT },
  userDoc: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  detail: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: BORDER },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  rowLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC },
  rowValue: { fontSize: 12, fontFamily: "Inter_500Medium", color: TEXT },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, flexWrap: "wrap" },
  statusRowLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: TEXTSEC },
  statusBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusBtnText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  editBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: YELLOW + "15", borderRadius: 10, borderWidth: 1, borderColor: YELLOW + "40", paddingVertical: 10 },
  editBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: YELLOW },
  deleteBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: RED + "15", borderRadius: 10, borderWidth: 1, borderColor: RED + "40", paddingVertical: 10 },
  deleteBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: RED },
  empty: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXTSEC, textAlign: "center", paddingVertical: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#161B2E", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "85%", borderWidth: 1, borderColor: BORDER },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: TEXT },
  editLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: TEXTSEC, marginBottom: 6 },
  editInput: { backgroundColor: "#0F1320", borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT },
  saveBtn: { backgroundColor: YELLOW, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8, marginBottom: 16 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1C1C1E" },
});
