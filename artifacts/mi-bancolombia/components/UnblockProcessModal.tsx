import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
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
import type { SuspensionStep, SubmissionType } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";

const GREEN = "#22C55E";
const GREEN_LIGHT = "#16A34A";
const YELLOW = "#FDDA24";

function StepTypeIcon({ type }: { type?: string }) {
  if (type === "document") return <Feather name="file-text" size={16} color="#60A5FA" />;
  if (type === "identity_verification") return <Feather name="user-check" size={16} color="#A78BFA" />;
  return <Feather name="check-square" size={16} color="#94A3B8" />;
}

function StepTypeLabel({ type }: { type?: string }) {
  if (type === "document") return "Presentar documento";
  if (type === "identity_verification") return "Verificación de identidad";
  return "Paso requerido";
}

type StepActionPanelProps = {
  step: SuspensionStep;
  onSubmit: (submissionType: SubmissionType, value?: string) => Promise<void>;
  onClose: () => void;
  isDark: boolean;
};

function StepActionPanel({ step, onSubmit, onClose, isDark }: StepActionPanelProps) {
  const [radicado, setRadicado] = useState(step.radicadoNumber ?? "");
  const [submitting, setSubmitting] = useState(false);

  const bg = isDark ? "#1C1C1E" : "#FFFFFF";
  const text = isDark ? "#FFFFFF" : "#111827";
  const textSec = isDark ? "rgba(255,255,255,0.55)" : "#6B7280";
  const inputBg = isDark ? "#2C2C2E" : "#F3F4F6";
  const border = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";

  const doSubmit = async (type: SubmissionType, value?: string) => {
    setSubmitting(true);
    try {
      await onSubmit(type, value);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoto = () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Subir fotografía",
        "Se ha registrado la solicitud de subir una fotografía del documento. En la versión móvil podrás tomar la foto directamente.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Confirmar envío", onPress: () => doSubmit("photo", "foto_simulada_" + Date.now()) },
        ]
      );
    } else {
      Alert.alert(
        "Subir fotografía",
        "Se abrirá la cámara para capturar el documento.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Continuar", onPress: () => doSubmit("photo", "foto_" + Date.now()) },
        ]
      );
    }
  };

  const handleQR = () => {
    Alert.alert(
      "Escanear código QR / código de barras",
      "Apunta la cámara al código QR o código de barras del documento.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Escanear", onPress: () => doSubmit("qr", "qr_scan_" + Date.now()) },
      ]
    );
  };

  const handleRadicado = () => {
    if (!radicado.trim()) {
      Alert.alert("Campo requerido", "Ingresa el número de radicado del documento.");
      return;
    }
    if (step.radicadoNumber && radicado.trim() !== step.radicadoNumber.trim()) {
      Alert.alert("Número incorrecto", "El número de radicado no coincide con el documento asignado. Verifica e intenta de nuevo.");
      return;
    }
    doSubmit("radicado", radicado.trim());
  };

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16, paddingTop: 4 }}>
        <StepTypeIcon type={step.type} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: text, fontFamily: "Inter_700Bold" }}>{step.label}</Text>
          {step.description ? (
            <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", marginTop: 2 }}>{step.description}</Text>
          ) : null}
        </View>
      </View>

      <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_500Medium", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Elige cómo enviar
      </Text>

      <TouchableOpacity
        style={[s.actionBtn, { backgroundColor: isDark ? "#1A2A3A" : "#EFF6FF", borderColor: "#3B82F6" }]}
        onPress={handlePhoto}
        disabled={submitting}
      >
        <View style={[s.actionIcon, { backgroundColor: "#3B82F622" }]}>
          <Feather name="camera" size={20} color="#3B82F6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#3B82F6", fontFamily: "Inter_600SemiBold" }}>Subir fotografía</Text>
          <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular", marginTop: 1 }}>Captura o sube una foto del documento</Text>
        </View>
        <Feather name="chevron-right" size={16} color="#3B82F6" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.actionBtn, { backgroundColor: isDark ? "#1A2D1A" : "#F0FDF4", borderColor: "#22C55E" }]}
        onPress={handleQR}
        disabled={submitting}
      >
        <View style={[s.actionIcon, { backgroundColor: "#22C55E22" }]}>
          <Feather name="grid" size={20} color="#22C55E" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#22C55E", fontFamily: "Inter_600SemiBold" }}>Escanear QR / Código de barras</Text>
          <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular", marginTop: 1 }}>Apunta la cámara al código del documento</Text>
        </View>
        <Feather name="chevron-right" size={16} color="#22C55E" />
      </TouchableOpacity>

      <View style={[s.actionBtn, { backgroundColor: isDark ? "#2A1F2D" : "#FDF4FF", borderColor: "#A78BFA", flexDirection: "column", alignItems: "flex-start", gap: 10 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={[s.actionIcon, { backgroundColor: "#A78BFA22" }]}>
            <Feather name="hash" size={20} color="#A78BFA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#A78BFA", fontFamily: "Inter_600SemiBold" }}>Número de radicado</Text>
            <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular", marginTop: 1 }}>
              {step.radicadoNumber ? "Número asignado por el banco" : "Ingresa el número de radicado del documento"}
            </Text>
          </View>
        </View>
        <TextInput
          style={[s.radicadoInput, { backgroundColor: inputBg, color: text, borderColor: border }]}
          value={radicado}
          onChangeText={setRadicado}
          placeholder={step.radicadoNumber ? step.radicadoNumber : "Ej: 2024-0012345"}
          placeholderTextColor={textSec}
          keyboardType="default"
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[s.radicadoBtn, { opacity: submitting ? 0.5 : 1 }]}
          onPress={handleRadicado}
          disabled={submitting}
        >
          <Feather name="check" size={15} color="#1C1C1E" />
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1C1E", fontFamily: "Inter_700Bold" }}>Confirmar radicado</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
        <Text style={{ fontSize: 14, color: textSec, fontFamily: "Inter_400Regular" }}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
};

export function UnblockProcessModal({ visible, onClose, isDark }: Props) {
  const { currentUser, submitUnblockStep } = useApp();
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const bg = isDark ? "#0F0F11" : "#F8F9FB";
  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const text = isDark ? "#FFFFFF" : "#111827";
  const textSec = isDark ? "rgba(255,255,255,0.55)" : "#6B7280";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";

  const isBlocked = currentUser?.status === "blocked";
  const accentColor = isBlocked ? "#EF4444" : "#F59E0B";
  const steps = currentUser?.unblockSteps ?? [];
  const docs = currentUser?.requiredDocuments ?? [];
  const completedCount = steps.filter((s) => s.completed).length;
  const allDone = steps.length > 0 && completedCount === steps.length;

  const handleSubmitStep = async (stepId: string, submissionType: SubmissionType, value?: string) => {
    await submitUnblockStep(stepId, submissionType, value);
    setActiveStepId(null);
  };

  const activeStep = steps.find((s) => s.id === activeStepId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%", minHeight: "60%" }}>
          {/* Handle */}
          <View style={{ width: 36, height: 4, backgroundColor: isDark ? "#3A3A3C" : "#D1D5DB", borderRadius: 2, alignSelf: "center", marginTop: 10 }} />

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: accentColor + "22", alignItems: "center", justifyContent: "center" }}>
                <Feather name={isBlocked ? "lock" : "alert-triangle"} size={17} color={accentColor} />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: text, fontFamily: "Inter_700Bold" }}>
                  Proceso de desbloqueo
                </Text>
                {steps.length > 0 && (
                  <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular" }}>
                    {completedCount} de {steps.length} pasos completados
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color={textSec} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Status summary */}
            <View style={{ marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: accentColor + "12", borderWidth: 1, borderColor: accentColor + "30" }}>
              {currentUser?.suspensionReason ? (
                <Text style={{ fontSize: 13, color: accentColor, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 4 }}>
                  Motivo: {currentUser.suspensionReason}
                </Text>
              ) : null}
              <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", lineHeight: 18 }}>
                {isBlocked
                  ? "Tu cuenta está bloqueada. Completa los pasos a continuación para solicitar la revisión de tu caso."
                  : "Tu cuenta está en revisión. Completa los pasos a continuación para acelerar el proceso de habilitación."}
              </Text>
            </View>

            {/* Required documents (without steps) */}
            {docs.length > 0 && steps.length === 0 && (
              <View style={{ marginHorizontal: 20, marginTop: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Feather name="file-text" size={14} color="#60A5FA" />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: text, fontFamily: "Inter_700Bold" }}>Documentos requeridos</Text>
                </View>
                {docs.map((doc, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: border }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#60A5FA22", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#60A5FA" }}>{i + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 13, color: text, fontFamily: "Inter_400Regular", lineHeight: 18 }}>{doc}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Steps timeline */}
            {steps.length > 0 && (
              <View style={{ marginHorizontal: 20, marginTop: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Feather name="list" size={14} color={text} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: text, fontFamily: "Inter_700Bold" }}>Línea de proceso</Text>
                </View>

                {steps.map((step, i) => {
                  const isLast = i === steps.length - 1;
                  const isDone = step.completed;
                  const isNext = !isDone && steps.slice(0, i).every((s) => s.completed);

                  return (
                    <View key={step.id} style={{ flexDirection: "row", gap: 12 }}>
                      {/* Timeline line + dot */}
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

                      {/* Step content */}
                      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
                        <View style={[s.stepCard, { backgroundColor: cardBg, borderColor: isDone ? GREEN + "40" : isNext ? accentColor + "30" : border }]}>
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
                                <Text style={{ fontSize: 10, color: GREEN, fontWeight: "700" }}>Enviado</Text>
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

                          {!isDone && isNext && activeStepId !== step.id && (
                            <TouchableOpacity
                              style={[s.advanceBtn, { borderColor: accentColor }]}
                              onPress={() => setActiveStepId(step.id)}
                            >
                              <Feather name="upload" size={13} color={accentColor} />
                              <Text style={{ fontSize: 12, fontWeight: "600", color: accentColor, fontFamily: "Inter_600SemiBold" }}>Enviar este paso</Text>
                            </TouchableOpacity>
                          )}

                          {!isDone && !isNext && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Feather name="lock" size={11} color={textSec} />
                              <Text style={{ fontSize: 11, color: textSec, fontFamily: "Inter_400Regular" }}>Completa el paso anterior primero</Text>
                            </View>
                          )}
                        </View>

                        {activeStepId === step.id && (
                          <View style={[s.stepCard, { backgroundColor: cardBg, borderColor: accentColor + "50", marginTop: 8 }]}>
                            <StepActionPanel
                              step={step}
                              onSubmit={(type, val) => handleSubmitStep(step.id, type, val)}
                              onClose={() => setActiveStepId(null)}
                              isDark={isDark}
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}

                {allDone && (
                  <View style={{ marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: GREEN + "15", borderWidth: 1, borderColor: GREEN + "40", alignItems: "center", gap: 8 }}>
                    <Feather name="check-circle" size={28} color={GREEN} />
                    <Text style={{ fontSize: 15, fontWeight: "700", color: GREEN, fontFamily: "Inter_700Bold", textAlign: "center" }}>
                      ¡Todos los pasos enviados!
                    </Text>
                    <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 }}>
                      Tu solicitud está en revisión. El equipo de Bancolombia evaluará la información y te notificará el resultado.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {steps.length === 0 && docs.length === 0 && (
              <View style={{ margin: 20, padding: 20, borderRadius: 12, backgroundColor: isDark ? "#1C1C1E" : "#F3F4F6", alignItems: "center", gap: 8 }}>
                <Feather name="info" size={24} color={textSec} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: text, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>Proceso pendiente de configuración</Text>
                <Text style={{ fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 }}>
                  El equipo de Bancolombia está preparando los pasos de tu proceso. Recibirás una notificación pronto.
                </Text>
              </View>
            )}

            {/* Contact support */}
            <View style={{ marginHorizontal: 20, marginTop: 20, flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, backgroundColor: isDark ? "#1C1C1E" : "#F3F4F6", borderWidth: 1, borderColor: border }}>
              <Feather name="phone" size={16} color="#60A5FA" />
              <Text style={{ flex: 1, fontSize: 12, color: textSec, fontFamily: "Inter_400Regular", lineHeight: 17 }}>
                ¿Necesitas ayuda? Comunícate con nuestra línea de atención al cliente.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  advanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radicadoInput: {
    width: "100%",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  radicadoBtn: {
    backgroundColor: "#FDDA24",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
});
