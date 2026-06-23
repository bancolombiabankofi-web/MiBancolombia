import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import Colors from "@/constants/colors";
import type { DocType } from "@/constants/countries";
import { ALL_DOC_TYPES, DOC_TYPE_LABELS } from "@/constants/countries";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const system = useColorScheme();
  const { themeMode } = useApp();
  const isDark = themeMode === "dark" || (themeMode === "system" && system === "dark");
  const C = isDark ? Colors.dark : Colors.light;
  const topPad = insets.top > 0 ? insets.top : 20;

  const [step, setStep] = useState<"form" | "sent">("form");
  const [docType, setDocType] = useState<DocType>("CC");
  const [docNumber, setDocNumber] = useState("");
  const [email, setEmail] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!docNumber.trim()) e.docNumber = "Ingresa tu número de documento";
    if (!email.trim()) e.email = "Ingresa tu correo electrónico";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Correo inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = () => {
    if (validate()) setStep("sent");
  };

  const docLabel = DOC_TYPE_LABELS[docType] ?? docType;
  const inputStyle = [styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }];

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.topBar, { paddingTop: topPad + 8, backgroundColor: C.background, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Image
            source={require("../assets/images/pwa-icon.png")}
            style={{ width: 28, height: 28, borderRadius: 7 }}
            resizeMode="contain"
          />
          <Text style={[styles.topTitle, { color: C.text }]}>Recuperar clave</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === "form" ? (
          <>
            <View style={[styles.iconWrap, { backgroundColor: C.yellow + "20" }]}>
              <Feather name="lock" size={32} color={C.yellow} />
            </View>

            <Text style={[styles.title, { color: C.text }]}>¿Olvidaste tu clave?</Text>
            <Text style={[styles.sub, { color: C.textSecondary }]}>
              Ingresa tu documento y correo registrado. Te enviaremos un enlace para restablecer tu clave.
            </Text>

            <Text style={[styles.label, { color: C.textSecondary }]}>Tipo de documento</Text>
            <TouchableOpacity
              style={[inputStyle, styles.pickerBtn]}
              onPress={() => setShowPicker(!showPicker)}
            >
              <Text style={{ color: C.text, fontFamily: "Inter_400Regular", fontSize: 15, flex: 1 }}>
                {docLabel}
              </Text>
              <Feather name={showPicker ? "chevron-up" : "chevron-down"} size={18} color={C.textSecondary} />
            </TouchableOpacity>

            {showPicker && (
              <View style={[styles.dropdown, { backgroundColor: C.surface, borderColor: C.border }]}>
                {ALL_DOC_TYPES.map((dt) => (
                  <TouchableOpacity
                    key={dt}
                    style={[styles.dropdownItem, { borderBottomColor: C.divider }]}
                    onPress={() => { setDocType(dt); setShowPicker(false); }}
                  >
                    <Text style={{ color: dt === docType ? C.yellow : C.text, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                      {DOC_TYPE_LABELS[dt]}
                    </Text>
                    {dt === docType && <Feather name="check" size={16} color={C.yellow} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.label, { color: C.textSecondary, marginTop: 14 }]}>Número de documento</Text>
            <TextInput
              style={inputStyle}
              value={docNumber}
              onChangeText={setDocNumber}
              keyboardType="default"
              placeholder="Ej. 1234567890"
              placeholderTextColor={C.textLight}
              maxLength={20}
              autoCapitalize="characters"
            />
            {errors.docNumber && <Text style={styles.errorText}>{errors.docNumber}</Text>}

            <Text style={[styles.label, { color: C.textSecondary, marginTop: 14 }]}>Correo electrónico registrado</Text>
            <TextInput
              style={inputStyle}
              value={email}
              onChangeText={setEmail}
              placeholder="ejemplo@correo.com"
              placeholderTextColor={C.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: C.yellow }]}
              onPress={handleSend}
            >
              <Text style={styles.btnText}>Enviar enlace de recuperación</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpRow} onPress={() => router.push("/register" as any)}>
              <Text style={[styles.helpText, { color: C.textSecondary }]}>
                ¿No tienes cuenta?{" "}
                <Text style={{ color: C.yellow, fontFamily: "Inter_600SemiBold" }}>Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: "#10B981" + "20" }]}>
              <Feather name="check-circle" size={48} color="#10B981" />
            </View>
            <Text style={[styles.successTitle, { color: C.text }]}>¡Correo enviado!</Text>
            <Text style={[styles.successSub, { color: C.textSecondary }]}>
              Hemos enviado las instrucciones para restablecer tu clave al correo{" "}
              <Text style={{ color: C.text, fontFamily: "Inter_600SemiBold" }}>{email}</Text>.{"\n\n"}
              Revisa tu bandeja de entrada y sigue los pasos indicados.
            </Text>

            <View style={[styles.infoBox, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Feather name="info" size={14} color={C.textSecondary} />
              <Text style={[styles.infoText, { color: C.textSecondary }]}>
                Si no encuentras el correo, revisa tu carpeta de spam o correo no deseado.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: C.yellow, marginTop: 32 }]}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.btnText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendBtn} onPress={() => setStep("form")}>
              <Text style={[styles.resendText, { color: C.textSecondary }]}>
                ¿No llegó el correo?{" "}
                <Text style={{ color: C.yellow, fontFamily: "Inter_600SemiBold" }}>Reenviar</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    justifyContent: "space-between",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 10,
  },
  sub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdown: {
    borderWidth: 1.5,
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginLeft: 4,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 32,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
  },
  helpRow: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  helpText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  successContainer: {
    alignItems: "center",
    paddingTop: 16,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    textAlign: "center",
  },
  successSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "flex-start",
    width: "100%",
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
  resendBtn: {
    marginTop: 16,
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
