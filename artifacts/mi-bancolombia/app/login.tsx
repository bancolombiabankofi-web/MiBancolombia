import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PinPad } from "@/components/PinPad";
import { useApp } from "@/context/AppContext";
import Colors from "@/constants/colors";

const C = Colors.light;

export default function LoginScreen() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const { login } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
    <View style={[styles.container, { paddingTop: topPad + 32 }]}>
      <View style={styles.logo}>
        <Image
          source={require("../assets/images/bancolombia_icon.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>Mi Bancolombia</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Ingresa tu clave de 4 dígitos</Text>

        <Text
          style={[
            styles.hint,
            error ? styles.hintError : null,
          ]}
        >
          {error
            ? "Clave incorrecta. Inténtalo de nuevo"
            : " "}
        </Text>

        <PinPad pin={pin} onPress={handleDigit} onDelete={handleDelete} />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>¿Olvidaste tu clave?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerBtn}>
          <Text style={styles.registerText}>Registrarme</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  logo: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
    textAlign: "center",
  },
  hint: {
    fontSize: 13,
    color: "transparent",
    fontFamily: "Inter_400Regular",
    marginBottom: 28,
    textAlign: "center",
    minHeight: 18,
  },
  hintError: {
    color: "#EF4444",
  },
  footer: {
    paddingBottom: Platform.OS === "web" ? 40 : 36,
    alignItems: "center",
    gap: 12,
  },
  forgotBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  forgotText: {
    fontSize: 14,
    color: C.yellow,
    fontFamily: "Inter_600SemiBold",
  },
  registerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  registerText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
});
