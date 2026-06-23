import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { SuspensionStep, SubmissionType } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";

const GREEN  = "#22C55E";
const RED    = "#EF4444";
const YELLOW = "#FDDA24";
const BLUE   = "#3B82F6";
const PURPLE = "#A78BFA";
const ORANGE = "#F59E0B";

/* ─── Helpers ─── */
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function StepTypeIcon({ type }: { type?: string }) {
  if (type === "identity_document")    return <Feather name="credit-card" size={16} color={BLUE} />;
  if (type === "tax_certificate")      return <Feather name="file-text"   size={16} color={PURPLE} />;
  if (type === "document")             return <Feather name="file-text"   size={16} color={BLUE} />;
  if (type === "identity_verification") return <Feather name="user-check" size={16} color={PURPLE} />;
  return <Feather name="check-square" size={16} color="#94A3B8" />;
}

function StepTypeLabel({ type }: { type?: string }) {
  if (type === "identity_document")     return "Documento de identidad";
  if (type === "tax_certificate")       return "Comprobante tributario";
  if (type === "document")              return "Presentar documento";
  if (type === "identity_verification") return "Verificación de identidad";
  return "Paso requerido";
}

/* ══════════════════════════════════════════════════════════════
   PANEL UNIVERSAL — siempre muestra las 3 opciones sin importar
   el tipo de paso: foto · escanear QR · radicado manual
══════════════════════════════════════════════════════════════ */
function UniversalStepPanel({
  step,
  onSubmit,
  onClose,
  isDark,
  currentUser,
}: {
  step: SuspensionStep;
  onSubmit: (t: SubmissionType, v?: string) => Promise<void>;
  onClose: () => void;
  isDark: boolean;
  currentUser: any;
}) {
  type TabKey = "photo" | "qr" | "manual";
  const [activeTab,  setActiveTab]  = useState<TabKey>("photo");
  const [scanning,   setScanning]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  /* manual form fields */
  const [docNumber, setDocNumber] = useState("");
  const [fullName,  setFullName]  = useState("");
  const [radicado,  setRadicado]  = useState(step.radicadoNumber ?? "");

  const text    = isDark ? "#FFFFFF" : "#111827";
  const textSec = isDark ? "rgba(255,255,255,0.55)" : "#6B7280";
  const inputBg = isDark ? "#2C2C2E" : "#F3F4F6";
  const border  = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";

  const isIdentity = step.type === "identity_document" || step.type === "identity_verification";

  const doSubmit = async (type: SubmissionType, value?: string) => {
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(type, value);
      onClose();
    } catch {
      setError("Ocurrió un error. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Foto / cámara ── */
  const handlePhoto = () => {
    if (isIdentity) {
      Alert.alert(
        "Fotografiar documento",
        "Ajusta el documento frente a la cámara. Se capturarán ambas caras automáticamente.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Capturar",
            onPress: () => {
              setScanning(true);
              setError("");
              setTimeout(() => {
                setScanning(false);
                setDocNumber(currentUser?.documentNumber ?? "");
                setFullName(`${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim());
                setActiveTab("manual");
              }, 2200);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Subir imagen del documento",
        "Adjunta la imagen completa del documento. Asegúrate de que el código de barras y el número de radicado sean legibles.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Adjuntar",
            onPress: () => {
              setScanning(true);
              setError("");
              setTimeout(() => {
                setScanning(false);
                const generatedRad = step.radicadoNumber ?? `2024-${Math.floor(1000000 + Math.random() * 9000000)}`;
                setRadicado(generatedRad);
                setActiveTab("manual");
              }, 1800);
            },
          },
        ]
      );
    }
  };

  /* ── Escanear QR / código de barras ── */
  const handleQR = () => {
    setScanning(true);
    setError("");
    setTimeout(() => {
      setScanning(false);
      if (isIdentity) {
        setDocNumber(currentUser?.documentNumber ?? "");
        setFullName(`${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim());
        setActiveTab("manual");
      } else {
        const generatedRad = step.radicadoNumber ?? `2024-${Math.floor(1000000 + Math.random() * 9000000)}`;
        setRadicado(generatedRad);
        setActiveTab("manual");
      }
    }, 2000);
  };

  /* ── Validación y envío manual (identidad) ── */
  const validateIdentity = (): boolean => {
    const registeredDoc  = normalize(currentUser?.documentNumber ?? "");
    const registeredName = normalize(`${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`);
    const inputDoc  = normalize(docNumber);
    const inputName = normalize(fullName);
    if (!inputDoc && !inputName) { setError("Ingresa el número de documento y el nombre."); return false; }
    if (!inputDoc)  { setError("Ingresa el número de documento."); return false; }
    if (!inputName) { setError("Ingresa el nombre completo tal como aparece en el documento."); return false; }
    if (inputDoc !== registeredDoc) {
      setError("El número de documento no coincide con el registrado en la cuenta.");
      return false;
    }
    const nameParts = inputName.split(" ");
    const regParts  = registeredName.split(" ");
    const match = nameParts.some((p) => regParts.includes(p)) && regParts.some((p) => nameParts.includes(p));
    if (!match) {
      setError("El nombre no corresponde al titular de la cuenta.");
      return false;
    }
    return true;
  };

  /* ── Validación y envío manual (radicado) ── */
  const validateRadicado = (): boolean => {
    const clean = radicado.trim();
    if (!clean) { setError("Ingresa el número de radicado."); return false; }
    if (clean.length < 4) { setError("El número de radicado es demasiado corto."); return false; }
    if (step.radicadoNumber && normalize(clean) !== normalize(step.radicadoNumber)) {
      setError("El número de radicado no coincide con el asignado. Revísalo e inténtalo de nuevo.");
      return false;
    }
    return true;
  };

  const handleManualConfirm = async () => {
    if (isIdentity) {
      if (!validateIdentity()) return;
      await doSubmit("photo", `dni_${docNumber}_${fullName}`);
    } else {
      if (!validateRadicado()) return;
      await doSubmit("radicado", radicado.trim());
    }
  };

  const TABS: { key: TabKey; icon: string; label: string; color: string }[] = [
    { key: "photo",  icon: "camera", label: "Tomar foto",    color: BLUE   },
    { key: "qr",     icon: "grid",   label: "Escanear QR",   color: GREEN  },
    { key: "manual", icon: "edit-2", label: "Datos manuales", color: ORANGE },
  ];

  return (
    <View style={{ gap: 12 }}>
      {/* Tab selector — siempre las 3 opciones */}
      <View style={{ flexDirection: "row", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: isDark ? "#2C2C2E" : "#E5E7EB" }}>
        {TABS.map((t, idx) => (
          <TouchableOpacity
            key={t.key}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: "center",
              gap: 3,
              backgroundColor: activeTab === t.key ? t.color + "22" : "transparent",
              borderRightWidth: idx < TABS.length - 1 ? 1 : 0,
              borderColor: isDark ? "#2C2C2E" : "#E5E7EB",
            }}
            onPress={() => { setActiveTab(t.key); setError(""); setScanning(false); }}
          >
            <Feather name={t.icon as any} size={16} color={activeTab === t.key ? t.color : textSec} />
            <Text style={{ fontSize: 9.5, fontFamily: "Inter_600SemiBold", color: activeTab === t.key ? t.color : textSec, textAlign: "center" }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Pestaña: Tomar foto ── */}
      {activeTab === "photo" && (
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: isDark ? "#1A2A3A" : "#EFF6FF", borderColor: BLUE }]}
          onPress={handlePhoto}
          disabled={scanning || submitting}
        >
          <View style={[s.actionIcon, { backgroundColor: BLUE + "22" }]}>
            {scanning
              ? <ActivityIndicator color={BLUE} size="small" />
              : <Feather name="camera" size={22} color={BLUE} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: BLUE, fontFamily: "Inter_600SemiBold" }}>
              {scanning ? "Procesando imagen..." : isIdentity ? "Fotografiar documento de identidad" : "Subir imagen del documento"}
            </Text>
            <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 15 }}>
              {isIdentity
                ? "Captura ambas caras de tu documento. Los datos se llenan automáticamente."
                : "Adjunta la imagen completa. Asegúrate que el código y radicado sean legibles."}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Pestaña: Escanear QR / código de barras ── */}
      {activeTab === "qr" && (
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: isDark ? "#1A2D2A" : "#F0FDF4", borderColor: GREEN }]}
          onPress={handleQR}
          disabled={scanning || submitting}
        >
          <View style={[s.actionIcon, { backgroundColor: GREEN + "22" }]}>
            {scanning
              ? <ActivityIndicator color={GREEN} size="small" />
              : <Feather name="grid" size={22} color={GREEN} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: GREEN, fontFamily: "Inter_600SemiBold" }}>
              {scanning ? "Leyendo código..." : "Escanear código QR / barras"}
            </Text>
            <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 15 }}>
              {isIdentity
                ? "Apunta la cámara al código de barras del reverso de tu cédula."
                : "Apunta la cámara al código de barras o QR del documento."}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Pestaña: Datos manuales ── */}
      {activeTab === "manual" && (
        <View style={{ gap: 10 }}>
          {isIdentity ? (
            <>
              <View>
                <Text style={[s.fieldLabel, { color: textSec }]}>Número de documento</Text>
                <TextInput
                  style={[s.input, { backgroundColor: inputBg, color: text, borderColor: error ? RED : border }]}
                  value={docNumber}
                  onChangeText={(v) => { setDocNumber(v); setError(""); }}
                  placeholder="Número del documento de identidad"
                  placeholderTextColor={textSec}
                  keyboardType="default"
                />
              </View>
              <View>
                <Text style={[s.fieldLabel, { color: textSec }]}>Nombre completo (como aparece en el documento)</Text>
                <TextInput
                  style={[s.input, { backgroundColor: inputBg, color: text, borderColor: error ? RED : border }]}
                  value={fullName}
                  onChangeText={(v) => { setFullName(v); setError(""); }}
                  placeholder="Nombre y apellido"
                  placeholderTextColor={textSec}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={[s.fieldLabel, { color: textSec }]}>
                Número de radicado{step.radicadoNumber ? " (asignado por Bancolombia)" : ""}
              </Text>
              {step.radicadoNumber && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 8, backgroundColor: PURPLE + "15" }}>
                  <Feather name="info" size={12} color={PURPLE} />
                  <Text style={{ fontSize: 11, color: PURPLE, fontFamily: "Inter_400Regular", flex: 1 }}>
                    Tu número de radicado ha sido asignado. Encuéntralo bajo el código de barras del comprobante.
                  </Text>
                </View>
              )}
              <TextInput
                style={[s.input, { backgroundColor: inputBg, color: text, borderColor: error ? RED : border, letterSpacing: 1 }]}
                value={radicado}
                onChangeText={(v) => { setRadicado(v); setError(""); }}
                placeholder="Ej: 2024-1234567"
                placeholderTextColor={textSec}
                keyboardType="default"
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleManualConfirm}
              />
            </>
          )}
        </View>
      )}

      {/* Error */}
      {error ? (
        <View style={s.errorBox}>
          <Feather name="x-circle" size={15} color={RED} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Confirm button (photo & manual tabs) */}
      {(activeTab === "photo" || activeTab === "manual") && (
        <TouchableOpacity
          style={[s.confirmBtn, { opacity: submitting ? 0.6 : 1 }]}
          onPress={activeTab === "photo" ? handlePhoto : handleManualConfirm}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#1C1C1E" size="small" />
            : <Feather name="check" size={16} color="#1C1C1E" />}
          <Text style={s.confirmBtnText}>
            {activeTab === "photo"
              ? (isIdentity ? "Abrir cámara" : "Seleccionar imagen")
              : "Confirmar información"}
          </Text>
        </TouchableOpacity>
      )}
      {activeTab === "qr" && (
        <TouchableOpacity
          style={[s.confirmBtn, { backgroundColor: GREEN, opacity: submitting ? 0.6 : 1 }]}
          onPress={handleQR}
          disabled={submitting || scanning}
        >
          {scanning
            ? <ActivityIndicator color="#1C1C1E" size="small" />
            : <Feather name="grid" size={16} color="#1C1C1E" />}
          <Text style={s.confirmBtnText}>
            {scanning ? "Escaneando..." : "Iniciar escaneo"}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
        <Text style={{ fontSize: 13, color: textSec }}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN MODAL
══════════════════════════════════════════════════════ */
type Props = { visible: boolean; onClose: () => void; isDark: boolean };

export function UnblockProcessModal({ visible, onClose, isDark }: Props) {
  const { currentUser, submitUnblockStep, supportPhone } = useApp();
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const bg      = isDark ? "#0F0F11" : "#F8F9FB";
  const cardBg  = isDark ? "#1C1C1E" : "#FFFFFF";
  const text    = isDark ? "#FFFFFF" : "#111827";
  const textSec = isDark ? "rgba(255,255,255,0.55)" : "#6B7280";
  const border  = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";

  const isBlocked      = currentUser?.status === "blocked";
  const accentColor    = isBlocked ? RED : ORANGE;
  const steps          = currentUser?.unblockSteps ?? [];
  const docs           = currentUser?.requiredDocuments ?? [];
  const completedCount = steps.filter((s) => s.completed).length;
  const allDone        = steps.length > 0 && completedCount === steps.length;

  const handleSubmitStep = async (stepId: string, submissionType: SubmissionType, value?: string) => {
    await submitUnblockStep(stepId, submissionType, value);
    setActiveStepId(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "94%", minHeight: "55%" }}>
          {/* Handle */}
          <View style={{ width: 36, height: 4, backgroundColor: isDark ? "#3A3A3C" : "#D1D5DB", borderRadius: 2, alignSelf: "center", marginTop: 10 }} />

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: accentColor + "22", alignItems: "center", justifyContent: "center" }}>
                <Feather name={isBlocked ? "lock" : "alert-triangle"} size={17} color={accentColor} />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: text, fontFamily: "Inter_700Bold" }}>Proceso de desbloqueo</Text>
                {steps.length > 0 && (
                  <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular" }}>
                    {completedCount} de {steps.length} pasos completados
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="x" size={20} color={textSec} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
            {/* Status banner */}
            <View style={{ marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: accentColor + "12", borderWidth: 1, borderColor: accentColor + "30" }}>
              {currentUser?.suspensionReason && (
                <Text style={{ fontSize: 13, color: accentColor, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 4 }}>
                  Motivo: {currentUser.suspensionReason}
                </Text>
              )}
              <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", lineHeight: 18 }}>
                {isBlocked
                  ? "Tu cuenta está bloqueada. Completa los pasos para que el equipo de Bancolombia revise tu caso."
                  : "Tu cuenta está en revisión. Completa los pasos a continuación para acelerar el proceso de habilitación."}
              </Text>
            </View>

            {/* Required docs (no steps) */}
            {docs.length > 0 && steps.length === 0 && (
              <View style={{ marginHorizontal: 20, marginTop: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Feather name="file-text" size={14} color={BLUE} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: text, fontFamily: "Inter_700Bold" }}>Documentos requeridos</Text>
                </View>
                {docs.map((doc: string, i: number) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: border }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: BLUE + "22", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: BLUE }}>{i + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 13, color: text, fontFamily: "Inter_400Regular", lineHeight: 18 }}>{doc}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Timeline */}
            {steps.length > 0 && (
              <View style={{ marginHorizontal: 20, marginTop: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Feather name="list" size={14} color={text} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: text, fontFamily: "Inter_700Bold" }}>Pasos del proceso</Text>
                </View>

                {steps.map((step: SuspensionStep, i: number) => {
                  const isLast   = i === steps.length - 1;
                  const isDone   = step.completed;
                  const isNext   = !isDone && steps.slice(0, i).every((ss) => ss.completed);
                  const isActive = activeStepId === step.id;

                  return (
                    <View key={step.id} style={{ flexDirection: "row", gap: 12 }}>
                      {/* Timeline dot + line */}
                      <View style={{ alignItems: "center", width: 32 }}>
                        <View style={[s.dot, {
                          backgroundColor: isDone ? GREEN : isNext ? accentColor : (isDark ? "#2C2C2E" : "#E5E7EB"),
                          borderColor: isDone ? GREEN : isNext ? accentColor : (isDark ? "#3A3A3C" : "#D1D5DB"),
                          borderWidth: isDone ? 0 : 2,
                        }]}>
                          {isDone
                            ? <Feather name="check" size={12} color="#FFF" />
                            : <Text style={{ fontSize: 10, fontWeight: "700", color: isNext ? accentColor : textSec }}>{i + 1}</Text>
                          }
                        </View>
                        {!isLast && (
                          <View style={{ width: 2, flex: 1, minHeight: 20, backgroundColor: isDone ? GREEN + "60" : (isDark ? "#2C2C2E" : "#E5E7EB"), marginTop: 4 }} />
                        )}
                      </View>

                      {/* Step card */}
                      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
                        <View style={[s.stepCard, { backgroundColor: cardBg, borderColor: isDone ? GREEN + "40" : isNext ? accentColor + "35" : border }]}>
                          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
                            <StepTypeIcon type={step.type} />
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: "700", color: isDone ? GREEN : text, fontFamily: "Inter_700Bold" }}>{step.label}</Text>
                              <Text style={{ fontSize: 10, color: textSec, fontFamily: "Inter_400Regular", marginTop: 1 }}>
                                <StepTypeLabel type={step.type} />
                              </Text>
                            </View>
                            {isDone && (
                              <View style={{ backgroundColor: GREEN + "22", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                                <Text style={{ fontSize: 10, color: GREEN, fontWeight: "700", fontFamily: "Inter_700Bold" }}>✓ Enviado</Text>
                              </View>
                            )}
                          </View>

                          {step.description ? (
                            <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", marginBottom: 8, lineHeight: 17 }}>{step.description}</Text>
                          ) : null}

                          {isDone && step.completedAt && (
                            <Text style={{ fontSize: 11, color: GREEN + "AA", fontFamily: "Inter_400Regular" }}>
                              Enviado el {new Date(step.completedAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                            </Text>
                          )}

                          {!isDone && isNext && !isActive && (
                            <TouchableOpacity
                              style={[s.advanceBtn, { borderColor: GREEN, backgroundColor: GREEN + "12" }]}
                              onPress={() => setActiveStepId(step.id)}
                            >
                              <Feather name="upload" size={13} color={GREEN} />
                              <Text style={{ fontSize: 12, fontWeight: "700", color: GREEN, fontFamily: "Inter_700Bold" }}>Enviar documentación</Text>
                            </TouchableOpacity>
                          )}

                          {!isDone && !isNext && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                              <Feather name="lock" size={11} color={textSec} />
                              <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular" }}>Completa el paso anterior primero</Text>
                            </View>
                          )}

                          {/* Panel universal inline */}
                          {isActive && (
                            <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: border }}>
                              <UniversalStepPanel
                                step={step}
                                onSubmit={(t, v) => handleSubmitStep(step.id, t, v)}
                                onClose={() => setActiveStepId(null)}
                                isDark={isDark}
                                currentUser={currentUser}
                              />
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}

                {allDone && (
                  <View style={{ marginTop: 16, padding: 20, borderRadius: 14, backgroundColor: GREEN + "15", borderWidth: 1, borderColor: GREEN + "40", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: GREEN + "22", alignItems: "center", justifyContent: "center" }}>
                      <Feather name="check-circle" size={28} color={GREEN} />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: GREEN, fontFamily: "Inter_700Bold", textAlign: "center" }}>
                      ¡Documentación enviada!
                    </Text>
                    <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 }}>
                      Tu solicitud está en revisión. El equipo de Bancolombia verificará la información y te notificará el resultado en los próximos días hábiles.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {steps.length === 0 && docs.length === 0 && (
              <View style={{ margin: 20, padding: 20, borderRadius: 12, backgroundColor: isDark ? "#1C1C1E" : "#F3F4F6", alignItems: "center", gap: 8 }}>
                <Feather name="clock" size={24} color={textSec} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: text, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>Proceso en configuración</Text>
                <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 }}>
                  El equipo de Bancolombia está preparando los pasos de tu proceso. Recibirás una notificación pronto.
                </Text>
              </View>
            )}

            {/* Botón WhatsApp asesor */}
            <View style={{ marginHorizontal: 20, marginTop: 20, gap: 10 }}>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, backgroundColor: "#25D36622", borderWidth: 1.5, borderColor: "#25D36660" }}
                onPress={() => Linking.openURL(`https://wa.me/${supportPhone}?text=Hola,%20necesito%20ayuda%20con%20el%20desbloqueo%20de%20mi%20cuenta`).catch(() => {})}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#25D36622", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="message-circle" size={20} color="#25D366" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#25D366", fontFamily: "Inter_700Bold" }}>Hablar con un asesor</Text>
                  <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular", marginTop: 1 }}>
                    Chat directo por WhatsApp con soporte Bancolombia
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color="#25D366" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  dot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  stepCard: {
    borderRadius: 14, padding: 14, borderWidth: 1,
  },
  advanceBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    borderWidth: 1.5, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    alignSelf: "flex-start", marginTop: 10,
  },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 14,
  },
  actionIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  fieldLabel: {
    fontSize: 11, fontFamily: "Inter_500Medium",
    textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6,
  },
  input: {
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 14, fontFamily: "Inter_400Regular", borderWidth: 1,
  },
  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: RED + "15", borderRadius: 10, borderWidth: 1,
    borderColor: RED + "40", padding: 12,
  },
  errorText: {
    flex: 1, fontSize: 12, color: RED, fontFamily: "Inter_500Medium", lineHeight: 17,
  },
  confirmBtn: {
    backgroundColor: YELLOW, borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center",
    gap: 8, justifyContent: "center",
  },
  confirmBtnText: {
    fontSize: 14, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold",
  },
  cancelBtn: {
    alignItems: "center", paddingVertical: 10,
  },
});
