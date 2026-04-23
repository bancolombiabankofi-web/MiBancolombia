import * as Haptics from "expo-haptics";
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
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PinPad } from "@/components/PinPad";
import { useApp } from "@/context/AppContext";
import { COUNTRIES, DOC_TYPE_LABELS, ALL_DOC_TYPES, type Country, type DocType } from "@/constants/countries";

const { width: SCREEN_W } = Dimensions.get("window");
const YELLOW = "#FDDA24";

export default function LoginScreen() {
  const [step, setStep] = useState<"identify" | "pin">("identify");
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [docType, setDocType] = useState<DocType>("CC");
  const [docNumber, setDocNumber] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { login } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const bottomPad = Platform.OS === "web" ? 40 : insets.bottom + 20;

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleContinue = () => {
    if (!docNumber.trim() || docNumber.length < 4) {
      setError("Ingresa un número de documento válido");
      return;
    }
    setError(null);
    setStep("pin");
  };

  const handlePinDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(null);
    if (next.length === 4) setTimeout(() => attempt(next), 120);
  };

  const attempt = async (p: string) => {
    const ok = await login(docNumber, p);
    if (ok) {
      router.replace("/(tabs)");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError("Clave incorrecta. Inténtalo de nuevo");
      setPin("");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <Image
          source={require("../assets/images/bancolombia_icon.png")}
          style={styles.topLogo}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.container, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {step === "identify" ? (
          <>
            <View style={styles.heroSection}>
              <Image
                source={require("../assets/images/mi_bancolombia_icon.png")}
                style={styles.appIcon}
                resizeMode="contain"
              />
              <Text style={styles.heroTitle}>Bienvenido a{"\n"}Mi Bancolombia</Text>
              <Text style={styles.heroSub}>
                Ingresa tu identificación para continuar
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>País de residencia</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => { setShowCountryPicker(!showCountryPicker); setShowDocPicker(false); }}
              >
                <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                <Text style={styles.pickerText}>{selectedCountry.name}</Text>
                <Feather name={showCountryPicker ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
              </TouchableOpacity>

              {showCountryPicker && (
                <View style={styles.dropdown}>
                  <View style={styles.searchWrap}>
                    <Feather name="search" size={14} color="#9CA3AF" />
                    <TextInput
                      style={styles.searchInput}
                      value={countrySearch}
                      onChangeText={setCountrySearch}
                      placeholder="Buscar país..."
                      placeholderTextColor="#9CA3AF"
                      autoFocus
                    />
                  </View>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {filteredCountries.map((c) => (
                      <TouchableOpacity
                        key={c.code}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedCountry(c);
                          setDocType(c.docTypes[0]);
                          setShowCountryPicker(false);
                          setCountrySearch("");
                        }}
                      >
                        <Text style={styles.flagText}>{c.flag}</Text>
                        <Text style={[styles.dropdownItemText, c.code === selectedCountry.code && { color: "#1C1C1E", fontFamily: "Inter_600SemiBold" }]}>
                          {c.name}
                        </Text>
                        {c.code === selectedCountry.code && <Feather name="check" size={14} color={YELLOW} />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={[styles.label, { marginTop: 16 }]}>Tipo de documento</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => { setShowDocPicker(!showDocPicker); setShowCountryPicker(false); }}
              >
                <Text style={styles.pickerText}>{DOC_TYPE_LABELS[docType]}</Text>
                <Feather name={showDocPicker ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
              </TouchableOpacity>

              {showDocPicker && (
                <View style={styles.dropdown}>
                  {ALL_DOC_TYPES.map((dt) => (
                    <TouchableOpacity
                      key={dt}
                      style={styles.dropdownItem}
                      onPress={() => { setDocType(dt); setShowDocPicker(false); }}
                    >
                      <Text style={[styles.dropdownItemText, dt === docType && { color: "#1C1C1E", fontFamily: "Inter_600SemiBold" }]}>
                        {DOC_TYPE_LABELS[dt]}
                      </Text>
                      {dt === docType && <Feather name="check" size={14} color={YELLOW} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[styles.label, { marginTop: 16 }]}>
                Número de {DOC_TYPE_LABELS[docType]}
              </Text>
              <TextInput
                style={styles.input}
                value={docNumber}
                onChangeText={(t) => { setDocNumber(t); setError(null); }}
                keyboardType="default"
                placeholder="Ingresa tu número de documento"
                placeholderTextColor="#9CA3AF"
                maxLength={20}
                autoCapitalize="characters"
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue}>
                <Text style={styles.primaryBtnText}>Continuar</Text>
                <Feather name="arrow-right" size={18} color="#1C1C1E" />
              </TouchableOpacity>

              <View style={styles.footer}>
                <TouchableOpacity onPress={() => router.push("/forgot-password" as any)}>
                  <Text style={styles.linkText}>¿Olvidaste tu clave?</Text>
                </TouchableOpacity>
                <View style={styles.footerDivider} />
                <TouchableOpacity onPress={() => router.push("/register" as any)}>
                  <Text style={styles.registerText}>Registrarme</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.heroSection}>
              <Image
                source={require("../assets/images/mi_bancolombia_icon.png")}
                style={styles.appIcon}
                resizeMode="contain"
              />
              <Text style={styles.heroTitle}>Ingresa tu clave</Text>
              <Text style={styles.heroSub}>Clave de 4 dígitos</Text>
            </View>

            <View style={[styles.identityCard]}>
              <Feather name="user" size={18} color="#6B7280" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.identityLabel}>
                  {selectedCountry.flag}  {DOC_TYPE_LABELS[docType]}
                </Text>
                <Text style={styles.identityValue}>{docNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => { setStep("identify"); setPin(""); setError(null); }}>
                <Feather name="edit-2" size={16} color={YELLOW} />
              </TouchableOpacity>
            </View>

            {error && <Text style={[styles.errorText, { textAlign: "center", marginTop: 8 }]}>{error}</Text>}

            <PinPad
              pin={pin}
              onPress={handlePinDigit}
              onDelete={() => { setPin((p) => p.slice(0, -1)); setError(null); }}
              isDark={false}
            />

            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.push("/forgot-password" as any)}>
                <Text style={styles.linkText}>¿Olvidaste tu clave?</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FFFFFF" },
  topBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    alignItems: "flex-start",
  },
  topLogo: {
    width: 150,
    height: 34,
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
  },
  heroSection: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 15,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  form: {
    padding: 24,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#374151",
    marginBottom: 8,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FAFAFA",
    gap: 8,
  },
  flagText: { fontSize: 20 },
  pickerText: {
    flex: 1,
    fontSize: 15,
    color: "#1C1C1E",
    fontFamily: "Inter_400Regular",
  },
  dropdown: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 8,
    backgroundColor: "#FAFAFA",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1C1C1E",
    fontFamily: "Inter_400Regular",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
    gap: 8,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1C1C1E",
    fontFamily: "Inter_400Regular",
    backgroundColor: "#FAFAFA",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    fontFamily: "Inter_400Regular",
    marginTop: 6,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: YELLOW,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 28,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
    gap: 12,
  },
  footerDivider: {
    width: 40,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  linkText: {
    fontSize: 14,
    color: "#1C1C1E",
    fontFamily: "Inter_600SemiBold",
    textDecorationLine: "underline",
  },
  registerText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: "#FAFAFA",
  },
  identityLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  identityValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    fontFamily: "Inter_600SemiBold",
  },
});
