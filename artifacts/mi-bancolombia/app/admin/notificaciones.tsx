import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { apiUrl } from "@/utils/api";
import type { RegisteredUser } from "@/context/AppContext";

const BG      = "#0A0E27";
const CARD    = "#111827";
const CARD2   = "#0D1123";
const BORDER  = "rgba(253,218,36,0.18)";
const TEXT    = "#FFFFFF";
const TEXTSEC = "rgba(255,255,255,0.45)";
const YELLOW  = "#FDDA24";
const GREEN   = "#10B981";
const RED     = "#EF4444";
const BLUE    = "#3B82F6";
const ORANGE  = "#F59E0B";
const PURPLE  = "#A78BFA";

/* ─── Shared types ─── */
const TEMPLATES = [
  { id: "transfer_received", icon: "arrow-down-circle" as const, color: GREEN,  label: "Transferencia recibida", title: "💰 Transferencia recibida",     body: "Has recibido $500,000 COP. Tu saldo disponible se ha actualizado. Revisa tu estado de cuenta." },
  { id: "verification_ok",   icon: "check-circle"     as const, color: GREEN,  label: "Verificación exitosa",   title: "✅ Verificación aprobada",         body: "Tu identidad ha sido verificada. Ya tienes acceso completo a todos los servicios." },
  { id: "suspended",         icon: "alert-circle"     as const, color: RED,    label: "Cuenta suspendida",      title: "⚠️ Cuenta suspendida",              body: "Tu cuenta ha sido suspendida. Ingresa a la app y sigue los pasos indicados." },
  { id: "radicado",          icon: "file-text"        as const, color: BLUE,   label: "Radicado asignado",      title: "📋 Radicado asignado",              body: "Se te ha asignado un radicado para verificación de documentos. Ábrelo en Desbloqueo." },
  { id: "pin_approved",      icon: "lock"             as const, color: YELLOW, label: "PIN aprobado",           title: "🔐 Cambio de PIN aprobado",         body: "Tu solicitud de cambio de PIN ha sido aprobada. Ya puedes usar tu nuevo PIN." },
  { id: "security",          icon: "shield"           as const, color: ORANGE, label: "Alerta de seguridad",    title: "🛡️ Alerta de seguridad",            body: "Detectamos un inicio de sesión desde un nuevo dispositivo. Si no fuiste tú, contacta soporte." },
];

const COLORS = [
  { hex: GREEN }, { hex: RED }, { hex: BLUE }, { hex: YELLOW },
  { hex: ORANGE }, { hex: PURPLE }, { hex: "#06B6D4" }, { hex: "#EC4899" },
];

const CHANNELS = [
  { id: "default", label: "General" }, { id: "banking", label: "Bancario" },
  { id: "security", label: "Seguridad" }, { id: "account", label: "Cuenta" },
  { id: "documents", label: "Documentos" },
];

type PushToken = {
  id: string; userId: string; token: string;
  platform: string; deviceInfo: string; createdAt: string; updatedAt: string;
};

type SendResult = { ok: boolean; sentCount: number; tokensFound: number; logId?: string; count?: number };
type NotifLog = { id: string; title: string; body: string; color: string; targetType: string; sentCount: number; createdAt: string };

/* ══════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════ */
export default function NotificacionesScreen() {
  const { currentUser, getAllUsers } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [mainTab, setMainTab] = useState<"inapp" | "apk">("inapp");
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [pushTokens, setPushTokens] = useState<PushToken[]>([]);

  const loadUsers = useCallback(async () => {
    const all = await getAllUsers();
    setUsers(all.filter((u: RegisteredUser) => !u.isAdmin));
  }, [getAllUsers]);

  const loadTokens = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/push-tokens"));
      const data = await res.json();
      setPushTokens(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    void loadUsers();
    void loadTokens();
  }, [loadUsers, loadTokens]);

  const adminId = currentUser?.id ?? "admin";

  /* Map userId → hasToken */
  const tokenMap = new Map<string, PushToken>();
  pushTokens.forEach((t) => tokenMap.set(t.userId, t));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Centro de notificaciones</Text>
          <Text style={styles.headerSub}>
            {mainTab === "inapp" ? "Alertas en tiempo real — web, PWA y APK" : "Push al sistema Android — APK cerrado"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => { void loadUsers(); void loadTokens(); }} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={18} color={YELLOW} />
        </TouchableOpacity>
      </View>

      {/* Main tabs */}
      <View style={styles.mainTabRow}>
        <TouchableOpacity
          style={[styles.mainTabBtn, mainTab === "inapp" && { backgroundColor: BLUE + "22", borderColor: BLUE }]}
          onPress={() => setMainTab("inapp")}
        >
          <Feather name="monitor" size={14} color={mainTab === "inapp" ? BLUE : TEXTSEC} />
          <Text style={[styles.mainTabText, mainTab === "inapp" && { color: BLUE }]}>En App</Text>
          <View style={[styles.typePill, { backgroundColor: BLUE + "22" }]}>
            <Text style={[styles.typePillText, { color: BLUE }]}>Web · PWA · APK abierto</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTabBtn, mainTab === "apk" && { backgroundColor: GREEN + "22", borderColor: GREEN }]}
          onPress={() => setMainTab("apk")}
        >
          <Feather name="smartphone" size={14} color={mainTab === "apk" ? GREEN : TEXTSEC} />
          <Text style={[styles.mainTabText, mainTab === "apk" && { color: GREEN }]}>APK Push</Text>
          <View style={[styles.typePill, { backgroundColor: GREEN + "22" }]}>
            <Text style={[styles.typePillText, { color: GREEN }]}>
              {pushTokens.length > 0 ? `${pushTokens.length} APK registrado${pushTokens.length > 1 ? "s" : ""}` : "Sin APKs registrados"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Explanation banner */}
      <View style={[styles.infoBanner, { borderLeftColor: mainTab === "inapp" ? BLUE : GREEN }]}>
        {mainTab === "inapp" ? (
          <Text style={styles.infoText}>
            <Text style={{ color: BLUE, fontFamily: "Inter_700Bold" }}>Notificación en app — </Text>
            aparece como un banner animado en la parte superior de la pantalla <Text style={{ color: BLUE }}>mientras el usuario tiene la app abierta</Text>. Funciona en web, PWA e instalación APK activa. El usuario debe estar conectado.
          </Text>
        ) : (
          <Text style={styles.infoText}>
            <Text style={{ color: GREEN, fontFamily: "Inter_700Bold" }}>Notificación APK push — </Text>
            llega a la <Text style={{ color: GREEN }}>barra de notificaciones del Android</Text>, incluso con la app completamente cerrada. Solo funciona en dispositivos con el APK instalado y el token registrado. Requiere conexión a internet en el dispositivo.
          </Text>
        )}
      </View>

      {mainTab === "inapp" ? (
        <InAppTab adminId={adminId} users={users} tokenMap={tokenMap} />
      ) : (
        <ApkPushTab adminId={adminId} users={users} tokenMap={tokenMap} pushTokens={pushTokens} onRefresh={loadTokens} />
      )}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 1: EN APP
   Sends to DB → shown as banner while user is in the app
══════════════════════════════════════════════════════════ */
function InAppTab({ adminId, users, tokenMap }: {
  adminId: string;
  users: RegisteredUser[];
  tokenMap: Map<string, PushToken>;
}) {
  const [tpl, setTpl]             = useState(TEMPLATES[0]);
  const [title, setTitle]         = useState(TEMPLATES[0].title);
  const [body, setBody]           = useState(TEMPLATES[0].body);
  const [color, setColor]         = useState(TEMPLATES[0].color);
  const [customColor, setCustomColor] = useState("");
  const [targetType, setTargetType] = useState<"all" | "users">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState<SendResult | null>(null);
  const [history, setHistory]     = useState<{ id: string; title: string; body: string; color: string; createdAt: string; userId: string | null }[]>([]);
  const [histExpanded, setHistExpanded] = useState(false);

  const effectiveColor = customColor.startsWith("#") && customColor.length >= 4 ? customColor : color;

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/app-notifications"));
      const data = await res.json();
      setHistory(Array.isArray(data) ? data.slice(0, 30) : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  const applyTpl = (t: typeof TEMPLATES[0]) => {
    setTpl(t); setTitle(t.title); setBody(t.body); setColor(t.color); setCustomColor("");
  };
  const toggleUser = (id: string) =>
    setSelectedUsers((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) || u.documentNumber.includes(q);
  });

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { Alert.alert("Campos requeridos", "Título y cuerpo son obligatorios."); return; }
    if (targetType === "users" && !selectedUsers.length) { Alert.alert("Destinatarios", "Selecciona al menos un usuario."); return; }
    setSending(true); setResult(null);
    try {
      const res = await fetch(apiUrl("/api/app-notifications/send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, title: title.trim(), body: body.trim(), color: effectiveColor, targetType, targetUserIds: targetType === "users" ? selectedUsers : [] }),
      });
      const data = await res.json() as SendResult;
      setResult(data);
      void loadHistory();
    } catch { Alert.alert("Error", "No se pudo enviar."); }
    finally { setSending(false); }
  };

  const selectedNames = users.filter((u) => selectedUsers.includes(u.id)).map((u) => `${u.firstName} ${u.lastName}`).join(", ");

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 18 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Who will see it */}
        <View style={styles.seeWho}>
          <Feather name="info" size={13} color={BLUE} />
          <Text style={styles.seeWhoText}>
            Esta notificación se mostrará como un banner animado en la parte superior de la pantalla para los usuarios seleccionados, durante un máximo de 6 segundos o hasta que lo descarten.
          </Text>
        </View>

        {/* Templates */}
        <Section label="PLANTILLAS">
          <View style={styles.templateGrid}>
            {TEMPLATES.map((t) => {
              const active = tpl.id === t.id;
              return (
                <TouchableOpacity key={t.id} style={[styles.tplCard, { borderColor: active ? t.color : BORDER }, active && { backgroundColor: t.color + "18" }]} onPress={() => applyTpl(t)}>
                  <View style={[styles.tplIcon, { backgroundColor: t.color + "22" }]}>
                    <Feather name={t.icon} size={18} color={t.color} />
                  </View>
                  <Text style={[styles.tplLabel, active && { color: t.color }]} numberOfLines={2}>{t.label}</Text>
                  {active && <View style={[styles.tplCheck, { backgroundColor: t.color }]}><Feather name="check" size={10} color="#fff" /></View>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Content */}
        <Section label="CONTENIDO">
          <InputField label="Título" value={title} onChange={setTitle} max={80} color={effectiveColor} />
          <InputField label="Cuerpo" value={body} onChange={setBody} max={300} color={effectiveColor} multiline />
        </Section>

        {/* Color */}
        <Section label="COLOR DEL BANNER">
          <View style={styles.colorGrid}>
            {COLORS.map((c) => (
              <TouchableOpacity key={c.hex} style={[styles.colorSwatch, { backgroundColor: c.hex }, color === c.hex && !customColor && styles.colorSwatchActive]} onPress={() => { setColor(c.hex); setCustomColor(""); }}>
                {color === c.hex && !customColor && <Feather name="check" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
            <View style={[styles.customColorPreview, { backgroundColor: effectiveColor }]} />
            <TextInput style={[styles.input, { flex: 1 }]} value={customColor} onChangeText={setCustomColor} placeholder="#FDDA24" placeholderTextColor={TEXTSEC} maxLength={7} autoCapitalize="characters" returnKeyType="done" />
          </View>
        </Section>

        {/* Preview */}
        <Section label="VISTA PREVIA — Banner que verá el usuario">
          <View style={[styles.bannerPreview, { borderLeftColor: effectiveColor }]}>
            <View style={[styles.bannerIcon, { backgroundColor: effectiveColor + "22" }]}>
              <Feather name="bell" size={16} color={effectiveColor} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.bannerTitle, { color: effectiveColor }]} numberOfLines={1}>{title || "Título"}</Text>
              <Text style={styles.bannerBody} numberOfLines={2}>{body || "Cuerpo del mensaje..."}</Text>
            </View>
            <Feather name="x" size={14} color={TEXTSEC} />
          </View>
        </Section>

        {/* Recipients */}
        <Section label="DESTINATARIOS">
          <View style={styles.recipientRow}>
            <RecipientBtn icon="radio" label="Todos" active={targetType === "all"} color={effectiveColor} onPress={() => setTargetType("all")} />
            <RecipientBtn icon="user-check" label="Específico" active={targetType === "users"} color={effectiveColor} onPress={() => { setTargetType("users"); setShowPicker(true); }} />
          </View>
          {targetType === "users" && (
            <TouchableOpacity style={[styles.userPickerBtn, { borderColor: effectiveColor + "40" }]} onPress={() => setShowPicker(true)}>
              <Feather name="users" size={15} color={effectiveColor} />
              <Text style={[styles.userPickerText, { color: selectedUsers.length ? TEXT : TEXTSEC }]} numberOfLines={2}>
                {selectedUsers.length === 0 ? "Toca para seleccionar usuarios" : `${selectedUsers.length} usuario${selectedUsers.length > 1 ? "s" : ""}: ${selectedNames}`}
              </Text>
              <Feather name="chevron-right" size={15} color={TEXTSEC} />
            </TouchableOpacity>
          )}
        </Section>

        {/* Send */}
        <SendButton color={effectiveColor} sending={sending} onPress={handleSend} label="Enviar notificación en app" />

        {/* Result */}
        {result && (
          <ResultCard
            ok={result.count != null && result.count > 0}
            title={result.count != null && result.count > 0 ? `✓ Creada para ${result.count} usuario${result.count > 1 ? "s" : ""}` : "Enviada — sin usuarios activos aún"}
            sub={`Tipo: en-app · Aparecerá en próxima sesión`}
          />
        )}

        {/* History */}
        {history.length > 0 && (
          <Section label={`HISTORIAL — Últimas ${history.length} en-app`} extra={
            <TouchableOpacity onPress={() => setHistExpanded(!histExpanded)}>
              <Feather name={histExpanded ? "chevron-up" : "chevron-down"} size={14} color={TEXTSEC} />
            </TouchableOpacity>
          }>
            {histExpanded && history.map((n) => (
              <View key={n.id} style={[styles.histCard, { borderLeftColor: n.color || YELLOW }]}>
                <View style={[styles.histDot, { backgroundColor: n.color || YELLOW }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.histTitle} numberOfLines={1}>{n.title}</Text>
                  <Text style={styles.histSub} numberOfLines={1}>{n.body}</Text>
                  <Text style={styles.histMeta}>{n.userId ? "Usuario específico" : "Todos"} · {fmtDate(n.createdAt)}</Text>
                </View>
              </View>
            ))}
          </Section>
        )}
      </ScrollView>

      <UserPickerModal visible={showPicker} users={filteredUsers} selected={selectedUsers} search={userSearch} onSearch={setUserSearch} onToggle={toggleUser} tokenMap={tokenMap} onClose={() => setShowPicker(false)} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 2: APK PUSH
   Sends via Expo Push API → Android notification bar
══════════════════════════════════════════════════════════ */
function ApkPushTab({ adminId, users, tokenMap, pushTokens, onRefresh }: {
  adminId: string;
  users: RegisteredUser[];
  tokenMap: Map<string, PushToken>;
  pushTokens: PushToken[];
  onRefresh: () => void;
}) {
  const [tpl, setTpl]             = useState(TEMPLATES[0]);
  const [title, setTitle]         = useState(TEMPLATES[0].title);
  const [body, setBody]           = useState(TEMPLATES[0].body);
  const [color, setColor]         = useState(TEMPLATES[0].color);
  const [customColor, setCustomColor] = useState("");
  const [channelId, setChannelId] = useState("default");
  const [targetType, setTargetType] = useState<"all" | "users">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState<SendResult | null>(null);
  const [history, setHistory]     = useState<NotifLog[]>([]);
  const [histExpanded, setHistExpanded] = useState(false);
  const [docsOpen, setDocsOpen]   = useState(false);
  const [apkListOpen, setApkListOpen] = useState(true);

  const effectiveColor = customColor.startsWith("#") && customColor.length >= 4 ? customColor : color;

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/notifications/log"));
      const data = await res.json();
      setHistory(Array.isArray(data) ? data.slice(0, 20) : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  const applyTpl = (t: typeof TEMPLATES[0]) => {
    setTpl(t); setTitle(t.title); setBody(t.body); setColor(t.color); setCustomColor("");
    setChannelId((t as { channelId?: string }).channelId ?? "default");
  };
  const toggleUser = (id: string) =>
    setSelectedUsers((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) || u.documentNumber.includes(q);
  });

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { Alert.alert("Campos requeridos", "Título y cuerpo son obligatorios."); return; }
    if (targetType === "users" && !selectedUsers.length) { Alert.alert("Destinatarios", "Selecciona al menos un usuario."); return; }
    if (pushTokens.length === 0) { Alert.alert("Sin APKs registrados", "Ningún usuario ha instalado el APK con notificaciones configuradas."); return; }
    setSending(true); setResult(null);
    try {
      const res = await fetch(apiUrl("/api/notifications/send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, title: title.trim(), body: body.trim(), color: effectiveColor, channelId, targetType, targetUserIds: targetType === "users" ? selectedUsers : [] }),
      });
      const data = await res.json() as SendResult;
      setResult(data);
      void loadHistory();
    } catch { Alert.alert("Error", "No se pudo enviar."); }
    finally { setSending(false); }
  };

  const selectedNames = users.filter((u) => selectedUsers.includes(u.id)).map((u) => `${u.firstName} ${u.lastName}`).join(", ");

  const apkUsers = users.filter((u) => tokenMap.has(u.id));
  const noApkUsers = users.filter((u) => !tokenMap.has(u.id));

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 18 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* APK Status List */}
        <TouchableOpacity style={styles.collapsibleHeader} onPress={() => setApkListOpen(!apkListOpen)}>
          <View style={styles.apkCountRow}>
            <View style={[styles.apkCountBadge, { backgroundColor: GREEN + "22", borderColor: GREEN + "40" }]}>
              <Feather name="smartphone" size={12} color={GREEN} />
              <Text style={[styles.apkCountText, { color: GREEN }]}>{apkUsers.length} con APK</Text>
            </View>
            <View style={[styles.apkCountBadge, { backgroundColor: TEXTSEC + "20", borderColor: TEXTSEC + "30" }]}>
              <Feather name="x-circle" size={12} color={TEXTSEC} />
              <Text style={[styles.apkCountText, { color: TEXTSEC }]}>{noApkUsers.length} sin APK</Text>
            </View>
          </View>
          <Feather name={apkListOpen ? "chevron-up" : "chevron-down"} size={14} color={TEXTSEC} />
        </TouchableOpacity>

        {apkListOpen && (
          <View style={{ gap: 6 }}>
            {users.length === 0 && <Text style={styles.emptyText}>Sin usuarios registrados</Text>}
            {users.map((u) => {
              const token = tokenMap.get(u.id);
              return (
                <View key={u.id} style={[styles.apkUserCard, { borderColor: token ? GREEN + "40" : BORDER }]}>
                  <View style={[styles.apkStatusDot, { backgroundColor: token ? GREEN : "rgba(255,255,255,0.1)" }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.apkUserName}>{u.firstName} {u.lastName}</Text>
                    <Text style={styles.apkUserDoc}>{u.documentType} {u.documentNumber}</Text>
                    {token && (
                      <Text style={[styles.apkUserMeta, { color: GREEN }]}>
                        APK registrado · {token.platform} · {fmtDate(token.updatedAt || token.createdAt)}
                      </Text>
                    )}
                    {!token && <Text style={[styles.apkUserMeta, { color: TEXTSEC }]}>Sin APK instalado</Text>}
                  </View>
                  <View style={[styles.apkPill, { backgroundColor: token ? GREEN + "20" : "rgba(255,255,255,0.05)" }]}>
                    <Feather name={token ? "check-circle" : "minus-circle"} size={14} color={token ? GREEN : TEXTSEC} />
                    <Text style={[styles.apkPillText, { color: token ? GREEN : TEXTSEC }]}>
                      {token ? "APK ✓" : "Sin APK"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Templates */}
        <Section label="PLANTILLAS">
          <View style={styles.templateGrid}>
            {TEMPLATES.map((t) => {
              const active = tpl.id === t.id;
              return (
                <TouchableOpacity key={t.id} style={[styles.tplCard, { borderColor: active ? t.color : BORDER }, active && { backgroundColor: t.color + "18" }]} onPress={() => applyTpl(t)}>
                  <View style={[styles.tplIcon, { backgroundColor: t.color + "22" }]}>
                    <Feather name={t.icon} size={18} color={t.color} />
                  </View>
                  <Text style={[styles.tplLabel, active && { color: t.color }]} numberOfLines={2}>{t.label}</Text>
                  {active && <View style={[styles.tplCheck, { backgroundColor: t.color }]}><Feather name="check" size={10} color="#fff" /></View>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Content */}
        <Section label="CONTENIDO">
          <InputField label="Título" value={title} onChange={setTitle} max={80} color={effectiveColor} />
          <InputField label="Cuerpo" value={body} onChange={setBody} max={300} color={effectiveColor} multiline />
        </Section>

        {/* Color */}
        <Section label="COLOR">
          <View style={styles.colorGrid}>
            {COLORS.map((c) => (
              <TouchableOpacity key={c.hex} style={[styles.colorSwatch, { backgroundColor: c.hex }, color === c.hex && !customColor && styles.colorSwatchActive]} onPress={() => { setColor(c.hex); setCustomColor(""); }}>
                {color === c.hex && !customColor && <Feather name="check" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
            <View style={[styles.customColorPreview, { backgroundColor: effectiveColor }]} />
            <TextInput style={[styles.input, { flex: 1 }]} value={customColor} onChangeText={setCustomColor} placeholder="#FDDA24" placeholderTextColor={TEXTSEC} maxLength={7} autoCapitalize="characters" returnKeyType="done" />
          </View>
        </Section>

        {/* Channel */}
        <Section label="CANAL ANDROID">
          <View style={styles.channelRow}>
            {CHANNELS.map((ch) => (
              <TouchableOpacity key={ch.id} style={[styles.channelChip, channelId === ch.id && { backgroundColor: effectiveColor + "22", borderColor: effectiveColor }]} onPress={() => setChannelId(ch.id)}>
                <Text style={[styles.channelText, channelId === ch.id && { color: effectiveColor }]}>{ch.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helpText}>El canal controla cómo Android agrupa y prioriza la notificación.</Text>
        </Section>

        {/* Preview */}
        <Section label="VISTA PREVIA — Barra de notificaciones Android">
          <View style={[styles.androidPreview, { borderColor: effectiveColor + "40" }]}>
            <View style={[styles.previewStripe, { backgroundColor: effectiveColor }]} />
            <View style={{ flex: 1, paddingLeft: 12, paddingVertical: 10, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={[styles.previewAppIcon, { backgroundColor: effectiveColor }]}><Text style={styles.previewIconText}>B</Text></View>
                <Text style={styles.previewAppName}>Mi Bancolombia</Text>
                <Text style={styles.previewTime}>ahora</Text>
              </View>
              <Text style={styles.previewTitle} numberOfLines={1}>{title || "Título"}</Text>
              <Text style={styles.previewBody} numberOfLines={2}>{body || "Cuerpo..."}</Text>
            </View>
          </View>
        </Section>

        {/* Recipients */}
        <Section label="DESTINATARIOS APK">
          <View style={styles.recipientRow}>
            <RecipientBtn icon="radio" label={`Todos APK (${apkUsers.length})`} active={targetType === "all"} color={effectiveColor} onPress={() => setTargetType("all")} />
            <RecipientBtn icon="user-check" label="Específico" active={targetType === "users"} color={effectiveColor} onPress={() => { setTargetType("users"); setShowPicker(true); }} />
          </View>
          {targetType === "users" && (
            <TouchableOpacity style={[styles.userPickerBtn, { borderColor: effectiveColor + "40" }]} onPress={() => setShowPicker(true)}>
              <Feather name="users" size={15} color={effectiveColor} />
              <Text style={[styles.userPickerText, { color: selectedUsers.length ? TEXT : TEXTSEC }]} numberOfLines={2}>
                {selectedUsers.length === 0 ? "Toca para seleccionar usuarios" : `${selectedUsers.length} usuario${selectedUsers.length > 1 ? "s" : ""}: ${selectedNames}`}
              </Text>
              <Feather name="chevron-right" size={15} color={TEXTSEC} />
            </TouchableOpacity>
          )}
        </Section>

        {pushTokens.length === 0 && (
          <View style={[styles.noApkWarning]}>
            <Feather name="alert-triangle" size={18} color={ORANGE} />
            <View style={{ flex: 1 }}>
              <Text style={styles.noApkTitle}>Sin APKs registrados aún</Text>
              <Text style={styles.noApkSub}>Instala el APK en un dispositivo Android. Al iniciar sesión, el token se registrará automáticamente.</Text>
            </View>
          </View>
        )}

        {/* Send */}
        <SendButton color={effectiveColor} sending={sending} onPress={handleSend} label="Enviar push al APK" icon="send" />

        {/* Result */}
        {result && (
          <ResultCard
            ok={(result.sentCount ?? 0) > 0}
            title={(result.sentCount ?? 0) > 0 ? `✓ Enviada a ${result.sentCount} APK${(result.sentCount ?? 0) > 1 ? "s" : ""}` : "Sin dispositivos con token"}
            sub={`APKs con token: ${result.tokensFound ?? 0} · ID: ${result.logId?.slice(0, 8) ?? "—"}...`}
          />
        )}

        {/* History */}
        {history.length > 0 && (
          <Section label={`HISTORIAL APK — Últimas ${history.length}`} extra={
            <TouchableOpacity onPress={() => setHistExpanded(!histExpanded)}>
              <Feather name={histExpanded ? "chevron-up" : "chevron-down"} size={14} color={TEXTSEC} />
            </TouchableOpacity>
          }>
            {histExpanded && history.map((n) => (
              <View key={n.id} style={[styles.histCard, { borderLeftColor: n.color || YELLOW }]}>
                <View style={[styles.histDot, { backgroundColor: n.color || YELLOW }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.histTitle} numberOfLines={1}>{n.title}</Text>
                  <Text style={styles.histSub} numberOfLines={1}>{n.body}</Text>
                  <Text style={styles.histMeta}>{n.targetType === "all" ? "Todos" : "Específico"} · {n.sentCount} enviadas · {fmtDate(n.createdAt)}</Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* API Docs */}
        <TouchableOpacity style={styles.docsToggle} onPress={() => setDocsOpen(!docsOpen)}>
          <Feather name="code" size={14} color={BLUE} />
          <Text style={styles.docsToggleText}>API y configuración para el APK</Text>
          <Feather name={docsOpen ? "chevron-up" : "chevron-down"} size={14} color={BLUE} />
        </TouchableOpacity>
        {docsOpen && <ApiDocs />}
      </ScrollView>

      <UserPickerModal visible={showPicker} users={filteredUsers} selected={selectedUsers} search={userSearch} onSearch={setUserSearch} onToggle={toggleUser} tokenMap={tokenMap} showApkStatus onClose={() => setShowPicker(false)} />
    </>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Shared sub-components                                    */
/* ──────────────────────────────────────────────────────── */

function Section({ label, children, extra }: { label: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {extra}
      </View>
      {children}
    </View>
  );
}

function InputField({ label, value, onChange, max, color, multiline }: { label: string; value: string; onChange: (v: string) => void; max: number; color: string; multiline?: boolean }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti, { borderColor: color + "60" }]}
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor={TEXTSEC}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        maxLength={max}
        textAlignVertical={multiline ? "top" : "center"}
        returnKeyType={multiline ? "default" : "next"}
      />
      <Text style={styles.charCount}>{value.length}/{max}</Text>
    </View>
  );
}

function RecipientBtn({ icon, label, active, color, onPress }: { icon: string; label: string; active: boolean; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.recipientBtn, active && { backgroundColor: color + "22", borderColor: color }]} onPress={onPress}>
      <Feather name={icon as "radio"} size={16} color={active ? color : TEXTSEC} />
      <Text style={[styles.recipientBtnText, active && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SendButton({ color, sending, onPress, label, icon = "send" }: { color: string; sending: boolean; onPress: () => void; label: string; icon?: string }) {
  const isYellow = color === YELLOW;
  return (
    <TouchableOpacity style={[styles.sendBtn, { backgroundColor: color }, sending && { opacity: 0.7 }]} onPress={onPress} disabled={sending} activeOpacity={0.85}>
      {sending ? <ActivityIndicator color={isYellow ? "#1C1C1E" : "#fff"} /> : (
        <>
          <Feather name={icon as "send"} size={18} color={isYellow ? "#1C1C1E" : "#fff"} />
          <Text style={[styles.sendBtnText, { color: isYellow ? "#1C1C1E" : "#fff" }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function ResultCard({ ok, title, sub }: { ok: boolean; title: string; sub: string }) {
  return (
    <View style={[styles.resultCard, { borderColor: ok ? GREEN + "50" : ORANGE + "50", backgroundColor: ok ? GREEN + "10" : ORANGE + "10" }]}>
      <Feather name={ok ? "check-circle" : "alert-triangle"} size={20} color={ok ? GREEN : ORANGE} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.resultTitle, { color: ok ? GREEN : ORANGE }]}>{title}</Text>
        <Text style={styles.resultSub}>{sub}</Text>
      </View>
    </View>
  );
}

function UserPickerModal({ visible, users, selected, search, onSearch, onToggle, tokenMap, onClose, showApkStatus }: {
  visible: boolean; users: RegisteredUser[]; selected: string[]; search: string;
  onSearch: (s: string) => void; onToggle: (id: string) => void;
  tokenMap: Map<string, PushToken>; onClose: () => void; showApkStatus?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.pickerModal, { paddingTop: insets.top + 8 }]}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Seleccionar usuarios</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={TEXT} /></TouchableOpacity>
        </View>
        <View style={styles.searchRow}>
          <Feather name="search" size={15} color={TEXTSEC} />
          <TextInput style={styles.searchInput} value={search} onChangeText={onSearch} placeholder="Buscar por nombre o documento" placeholderTextColor={TEXTSEC} />
        </View>
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          renderItem={({ item }) => {
            const sel = selected.includes(item.id);
            const hasToken = tokenMap.has(item.id);
            return (
              <TouchableOpacity style={[styles.pickerItem, sel && { backgroundColor: BLUE + "20", borderColor: BLUE }]} onPress={() => onToggle(item.id)}>
                <View style={[styles.pickerCheck, sel && { backgroundColor: BLUE, borderColor: BLUE }]}>
                  {sel && <Feather name="check" size={12} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerName}>{item.firstName} {item.lastName}</Text>
                  <Text style={styles.pickerDoc}>{item.documentType} {item.documentNumber}</Text>
                </View>
                {showApkStatus && (
                  <View style={[styles.apkPill, { backgroundColor: hasToken ? GREEN + "20" : "rgba(255,255,255,0.05)" }]}>
                    <Feather name={hasToken ? "check-circle" : "minus-circle"} size={12} color={hasToken ? GREEN : TEXTSEC} />
                    <Text style={[styles.apkPillText, { color: hasToken ? GREEN : TEXTSEC, fontSize: 9 }]}>
                      {hasToken ? "APK" : "Sin APK"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
        <View style={styles.pickerFooter}>
          <TouchableOpacity style={styles.pickerDoneBtn} onPress={onClose}>
            <Text style={styles.pickerDoneText}>Confirmar ({selected.length} seleccionado{selected.length !== 1 ? "s" : ""})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ApiDocs() {
  return (
    <View style={styles.docsCard}>
      <DocTitle>Variable requerida en el APK</DocTitle>
      <CodeBlock>{"EXPO_PUBLIC_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}</CodeBlock>
      <DocNote>Obtén el Project ID en expo.dev → tu proyecto → Settings. Añádelo como secreto en GitHub Actions.</DocNote>

      <DocTitle mt>GitHub Actions — secrets requeridos</DocTitle>
      <CodeBlock>{"secrets.EXPO_PROJECT_ID\nsecrets.GOOGLE_SERVICES_JSON"}</CodeBlock>

      <DocTitle mt>Endpoint — Registrar token APK</DocTitle>
      <CodeBlock>{"POST /api/push-tokens\n{\n  \"userId\": \"uuid\",\n  \"token\": \"ExponentPushToken[xxx]\",\n  \"platform\": \"android\",\n  \"deviceInfo\": \"Android 14\"\n}"}</CodeBlock>

      <DocTitle mt>Endpoint — Enviar push APK (admin)</DocTitle>
      <CodeBlock>{"POST /api/notifications/send\n{\n  \"adminId\": \"uuid\",\n  \"title\": \"Título\",\n  \"body\": \"Mensaje\",\n  \"color\": \"#10B981\",\n  \"channelId\": \"banking\",\n  \"targetType\": \"all\",\n  \"targetUserIds\": []\n}"}</CodeBlock>

      <DocTitle mt>Endpoint — Historial push APK (admin)</DocTitle>
      <CodeBlock>{"GET /api/notifications/log\n→ array de últimas 200 push enviadas"}</CodeBlock>
    </View>
  );
}

function DocTitle({ children, mt }: { children: React.ReactNode; mt?: boolean }) {
  return <Text style={[styles.docsTitle, mt && { marginTop: 14 }]}>{children}</Text>;
}
function DocNote({ children }: { children: React.ReactNode }) {
  return <Text style={styles.docsNote}>{children as string}</Text>;
}
function CodeBlock({ children }: { children: string }) {
  return (
    <View style={styles.codeBlock}>
      <Text style={styles.codeText}>{children}</Text>
    </View>
  );
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BG },
  header:       { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, paddingTop: 8, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn:      { padding: 4 },
  headerTitle:  { fontSize: 18, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  headerSub:    { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular", marginTop: 1 },
  refreshBtn:   { padding: 6 },

  mainTabRow:   { flexDirection: "row", gap: 10, padding: 14, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  mainTabBtn:   { flex: 1, alignItems: "center", gap: 6, backgroundColor: CARD2, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: BORDER },
  mainTabText:  { fontSize: 14, fontWeight: "700", color: TEXTSEC, fontFamily: "Inter_700Bold" },
  typePill:     { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  typePillText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },

  infoBanner:   { marginHorizontal: 14, marginTop: 12, backgroundColor: CARD2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 3 },
  infoText:     { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular", lineHeight: 17 },

  seeWho:       { flexDirection: "row", gap: 8, backgroundColor: BLUE + "10", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: BLUE + "30" },
  seeWhoText:   { flex: 1, fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular", lineHeight: 16 },

  sectionLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, fontFamily: "Inter_700Bold" },
  inputLabel:   { fontSize: 10, color: TEXTSEC, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  input:        { backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: TEXT, fontFamily: "Inter_400Regular" },
  inputMulti:   { minHeight: 90, paddingTop: 12 },
  charCount:    { fontSize: 10, color: TEXTSEC, fontFamily: "Inter_400Regular", textAlign: "right" },

  templateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tplCard:      { width: "30%", flexGrow: 1, backgroundColor: CARD, borderRadius: 14, padding: 12, borderWidth: 1, gap: 8, alignItems: "center", position: "relative" },
  tplIcon:      { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tplLabel:     { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_500Medium", textAlign: "center" },
  tplCheck:     { position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },

  colorGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorSwatch:      { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  colorSwatchActive:{ borderColor: "#fff", transform: [{ scale: 1.15 }] },
  customColorPreview: { width: 40, height: 40, borderRadius: 10, borderWidth: 2, borderColor: BORDER },

  channelRow:   { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  channelChip:  { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD },
  channelText:  { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_500Medium" },
  helpText:     { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular", lineHeight: 16 },

  bannerPreview: { backgroundColor: "#1A1F36", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderLeftWidth: 4, flexDirection: "row", alignItems: "center", gap: 12 },
  bannerIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bannerTitle:   { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  bannerBody:    { fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular", lineHeight: 17 },

  androidPreview:  { backgroundColor: "#1C2035", borderRadius: 14, borderWidth: 1, overflow: "hidden", flexDirection: "row" },
  previewStripe:   { width: 4 },
  previewAppIcon:  { width: 16, height: 16, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  previewIconText: { fontSize: 10, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  previewAppName:  { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_500Medium", flex: 1 },
  previewTime:     { fontSize: 10, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  previewTitle:    { fontSize: 14, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  previewBody:     { fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", lineHeight: 18 },

  recipientRow:   { flexDirection: "row", gap: 10 },
  recipientBtn:   { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: CARD, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: BORDER },
  recipientBtnText:{ fontSize: 13, color: TEXTSEC, fontFamily: "Inter_500Medium" },
  userPickerBtn:  { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: CARD, borderRadius: 12, padding: 12, borderWidth: 1 },
  userPickerText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },

  collapsibleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: CARD, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: BORDER },
  apkCountRow:  { flexDirection: "row", gap: 8 },
  apkCountBadge:{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  apkCountText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  apkUserCard:  { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: CARD2, borderRadius: 10, padding: 10, borderWidth: 1 },
  apkStatusDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  apkUserName:  { fontSize: 13, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  apkUserDoc:   { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  apkUserMeta:  { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  apkPill:      { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  apkPillText:  { fontSize: 10, fontFamily: "Inter_600SemiBold" },

  noApkWarning: { flexDirection: "row", gap: 10, backgroundColor: ORANGE + "15", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: ORANGE + "30" },
  noApkTitle:   { fontSize: 13, fontWeight: "700", color: ORANGE, fontFamily: "Inter_700Bold", marginBottom: 3 },
  noApkSub:     { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular", lineHeight: 16 },
  emptyText:    { fontSize: 13, color: TEXTSEC, textAlign: "center", paddingVertical: 20, fontFamily: "Inter_400Regular" },

  sendBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 16 },
  sendBtnText:  { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },

  resultCard:   { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 14, padding: 14, borderWidth: 1 },
  resultTitle:  { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  resultSub:    { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular" },

  histCard:     { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: CARD2, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 3 },
  histDot:      { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  histTitle:    { fontSize: 13, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  histSub:      { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  histMeta:     { fontSize: 10, color: TEXTSEC, fontFamily: "Inter_400Regular", marginTop: 2 },

  docsToggle:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: BLUE + "15", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: BLUE + "30" },
  docsToggleText: { flex: 1, fontSize: 13, color: BLUE, fontFamily: "Inter_500Medium" },
  docsCard:     { backgroundColor: CARD2, borderRadius: 14, padding: 16, gap: 6, borderWidth: 1, borderColor: BORDER },
  docsTitle:    { fontSize: 11, fontWeight: "700", color: TEXTSEC, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  docsNote:     { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular", lineHeight: 16 },
  codeBlock:    { backgroundColor: "#060B18", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  codeText:     { fontSize: 11, color: "#7DD3FC", fontFamily: "Inter_400Regular", lineHeight: 17 },

  pickerModal:  { flex: 1, backgroundColor: BG },
  pickerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4, borderBottomWidth: 1, borderBottomColor: BORDER },
  pickerTitle:  { fontSize: 18, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  searchRow:    { flexDirection: "row", alignItems: "center", gap: 10, margin: 12, backgroundColor: CARD, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: BORDER },
  searchInput:  { flex: 1, fontSize: 14, color: TEXT, fontFamily: "Inter_400Regular" },
  pickerItem:   { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: CARD, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: BORDER },
  pickerCheck:  { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
  pickerName:   { fontSize: 14, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  pickerDoc:    { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  pickerFooter: { padding: 16, borderTopWidth: 1, borderTopColor: BORDER },
  pickerDoneBtn:{ backgroundColor: YELLOW, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  pickerDoneText:{ fontSize: 15, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
});
