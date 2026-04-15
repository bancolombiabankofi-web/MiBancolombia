import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
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
import type { AuditLog } from "@/context/AppContext";

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
const PURPLE = "#8B5CF6";

const ACTION_COLORS: Record<string, string> = {
  LOGIN: BLUE,
  LOGOUT: TEXTSEC,
  UPDATE_USER: YELLOW,
  DELETE_USER: RED,
  CHANGE_STATUS: ORANGE,
  EDIT_ACCOUNT: GREEN,
  UPDATE_ACCOUNT: GREEN,
  EDIT_USER: YELLOW,
  ADD_TRANSACTION: PURPLE,
};

export default function AuditoriaScreen() {
  const { getAuditLogs, getAllUsers, logout } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 60 : insets.top;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("Todas");

  const actions = ["Todas", "LOGIN", "UPDATE_USER", "EDIT_USER", "DELETE_USER", "CHANGE_STATUS", "EDIT_ACCOUNT", "UPDATE_ACCOUNT"];

  const load = useCallback(async () => {
    const l = await getAuditLogs();
    setLogs(l);
    setLoading(false);
  }, [getAuditLogs]);

  useEffect(() => { load(); }, []);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.adminId.toLowerCase().includes(q);
    const matchAction = filterAction === "Todas" || l.action === filterAction;
    return matchSearch && matchAction;
  });

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("es-CO", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });
    } catch { return iso; }
  };

  const actionColor = (action: string) => ACTION_COLORS[action] ?? TEXTSEC;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Auditoría del Sistema</Text>
          <Text style={styles.sub}>{logs.length} eventos registrados</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={load}>
          <Feather name="refresh-cw" size={16} color={YELLOW} />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        {[
          { label: "Login", count: logs.filter((l) => l.action === "LOGIN").length, color: BLUE },
          { label: "Ediciones", count: logs.filter((l) => l.action.includes("UPDATE") || l.action.includes("EDIT")).length, color: YELLOW },
          { label: "Eliminados", count: logs.filter((l) => l.action === "DELETE_USER").length, color: RED },
          { label: "Estado", count: logs.filter((l) => l.action === "CHANGE_STATUS").length, color: ORANGE },
        ].map((s) => (
          <View key={s.label} style={[styles.statItem, { borderColor: s.color + "40" }]}>
            <Text style={[styles.statNum, { color: s.color }]}>{s.count}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={TEXTSEC} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar en logs..."
          placeholderTextColor={TEXTSEC}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={TEXTSEC} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.actionBtn, filterAction === a && styles.actionBtnActive, { borderColor: a !== "Todas" ? actionColor(a) + "60" : BORDER }]}
            onPress={() => setFilterAction(a)}
          >
            <Text style={[styles.actionText, { color: a !== "Todas" && filterAction === a ? actionColor(a) : filterAction === a ? YELLOW : TEXTSEC }]}>
              {a}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {loading ? (
          <Text style={styles.empty}>Cargando logs...</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Sin eventos registrados</Text>
        ) : (
          filtered.map((log) => (
            <TouchableOpacity
              key={log.id}
              style={styles.logCard}
              onPress={() => setExpanded(expanded === log.id ? null : log.id)}
            >
              <View style={styles.logRow}>
                <View style={[styles.logDot, { backgroundColor: actionColor(log.action) }]} />
                <View style={{ flex: 1 }}>
                  <View style={styles.logHeader}>
                    <View style={[styles.actionTag, { backgroundColor: actionColor(log.action) + "22", borderColor: actionColor(log.action) + "44" }]}>
                      <Text style={[styles.actionTagText, { color: actionColor(log.action) }]}>{log.action}</Text>
                    </View>
                    <Text style={styles.logTime}>{fmt(log.timestamp)}</Text>
                  </View>
                  <Text style={styles.logDetails} numberOfLines={expanded === log.id ? undefined : 1}>
                    {log.details}
                  </Text>
                  <Text style={styles.logAdmin}>Admin: {log.adminId}</Text>
                </View>
                <Feather
                  name={expanded === log.id ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={TEXTSEC}
                />
              </View>

              {expanded === log.id && (
                <View style={styles.logExpanded}>
                  <LogRow label="ID" value={log.id} />
                  <LogRow label="Acción" value={log.action} />
                  <LogRow label="Timestamp" value={log.timestamp} />
                  <LogRow label="Admin ID" value={log.adminId} />
                  {log.targetUserId && <LogRow label="Usuario objetivo" value={log.targetUserId} />}
                  <View style={styles.detailsBox}>
                    <Text style={styles.detailsLabel}>Detalles completos:</Text>
                    <Text style={styles.detailsText}>{log.details}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function LogRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.logDetailRow}>
      <Text style={styles.logDetailLabel}>{label}</Text>
      <Text style={styles.logDetailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: TEXT },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 2 },
  refreshBtn: { padding: 10, backgroundColor: "rgba(253,218,36,0.1)", borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  stats: { flexDirection: "row", gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  statItem: { flex: 1, backgroundColor: CARD, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center" },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: TEXTSEC, marginTop: 2 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    marginBottom: 8,
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: TEXT },
  actionScroll: { marginBottom: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  actionBtnActive: { backgroundColor: "rgba(253,218,36,0.1)" },
  actionText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  logCard: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  logRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  logDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  logHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  actionTag: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  actionTagText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  logTime: { fontSize: 10, fontFamily: "Inter_400Regular", color: TEXTSEC },
  logDetails: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXTSEC, marginBottom: 2 },
  logAdmin: { fontSize: 10, fontFamily: "Inter_400Regular", color: TEXTSEC + "88" },
  logExpanded: { marginTop: 10, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 10 },
  logDetailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  logDetailLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: TEXTSEC },
  logDetailValue: { fontSize: 10, fontFamily: "Inter_500Medium", color: TEXT, flex: 1, textAlign: "right", marginLeft: 8 },
  detailsBox: { backgroundColor: "#0A0E1A", borderRadius: 8, padding: 10, marginTop: 8 },
  detailsLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: TEXTSEC, marginBottom: 4 },
  detailsText: { fontSize: 11, fontFamily: "Inter_400Regular", color: TEXT, lineHeight: 16 },
  empty: { fontSize: 14, fontFamily: "Inter_400Regular", color: TEXTSEC, textAlign: "center", paddingVertical: 40 },
});
