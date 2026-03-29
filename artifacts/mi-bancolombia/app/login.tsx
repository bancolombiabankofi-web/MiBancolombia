import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
      setTimeout(() => attempt(next), 100);
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
    <View style={[styles.container, { paddingTop: topPad + 24 }]}>
      <View style={styles.logo}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>B</Text>
        </View>
        <Text style={styles.logoText}>Mi Bancolombia</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Carlos Hernández</Text>
        <Text style={styles.hint}>
          {error ? "PIN incorrecto. Intenta de nuevo" : "Ingresa tu PIN de 4 dígitos"}
        </Text>
        {error && <Text style={styles.errorHint}>Usa: 1234</Text>}

        <PinPad pin={pin} onPress={handleDigit} onDelete={handleDelete} />
      </View>

      <TouchableOpacity style={styles.forgot}>
        <Text style={styles.forgotText}>¿Olvidaste tu clave?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingBottom: Platform.OS === "web" ? 34 : 0,
  },
  logo: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.yellow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: Colors.light.yellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  logoLetter: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    marginBottom: 32,
  },
  hint: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    marginBottom: 32,
    textAlign: "center",
  },
  errorHint: {
    fontSize: 12,
    color: "#EF4444",
    fontFamily: "Inter_400Regular",
    marginTop: -24,
    marginBottom: 24,
  },
  forgot: {
    padding: 16,
    alignItems: "center",
  },
  forgotText: {
    fontSize: 14,
    color: Colors.light.yellow,
    fontFamily: "Inter_600SemiBold",
  },
});
