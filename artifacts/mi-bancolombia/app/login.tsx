import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PinPad } from "@/components/PinPad";
import { useApp } from "@/context/AppContext";
import Colors from "@/constants/colors";

export default function LoginScreen() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const { login, themeMode } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const system = useColorScheme();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 40 : insets.bottom + 20;

  const isDark =
    themeMode === "dark" || (themeMode === "system" && system === "dark");
  const C = isDark ? Colors.dark : Colors.light;

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => attempt(next), 120);
    }
  };

  const attempt = async (p: string) => {
    const ok = await login(p);
    if (ok) {
      router.replace("/(tabs)");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(true);
      setPin("");
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError(false);
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: C.background }]}
      contentContainerStyle={[
        styles.container,
        { paddingTop: topPad + 32, paddingBottom: bottomPad },
      ]}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      <View style={styles.logo}>
        <Image
          source={
            isDark
              ? require("../assets/images/mi_bancolombia_icon.png")
              : require("../assets/images/bancolombia_icon.png")
          }
          style={[styles.logoImage, isDark && styles.logoImageDark]}
          resizeMode="contain"
        />
        <Text style={[styles.logoText, { color: C.text }]}>Mi Bancolombia</Text>
      </View>

      <Text style={[styles.title, { color: C.text }]}>Bienvenido</Text>
      <Text style={[styles.subtitle, { color: C.textSecondary }]}>
        Ingresa tu clave de 4 dígitos
      </Text>

      <Text style={[styles.hint, error && styles.hintError]}>
        {error ? "Clave incorrecta. Inténtalo de nuevo" : " "}
      </Text>

      <PinPad pin={pin} onPress={handleDigit} onDelete={handleDelete} isDark={isDark} />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => router.push("/forgot-password" as any)}
        >
          <Text style={[styles.forgotText, { color: C.yellow }]}>
            ¿Olvidaste tu clave?
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => router.push("/register" as any)}
        >
          <Text style={[styles.registerText, { color: C.textSecondary }]}>
            Registrarme
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logo: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  logoImageDark: {
    borderRadius: 20,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
    textAlign: "center",
  },
  hint: {
    fontSize: 13,
    color: "transparent",
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
    textAlign: "center",
    minHeight: 18,
  },
  hintError: {
    color: "#EF4444",
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  footerBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  registerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
