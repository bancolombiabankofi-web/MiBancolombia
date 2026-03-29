import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "@/constants/colors";

const C = Colors.light;

type Action = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route: string;
};

const ACTIONS: Action[] = [
  { icon: "send", label: "Transferir", route: "/(tabs)/transfers" },
  { icon: "credit-card", label: "Pagar", route: "/(tabs)/payments" },
  { icon: "smartphone", label: "Recargar", route: "/(tabs)/payments" },
  { icon: "more-horizontal", label: "Más", route: "/(tabs)/cards" },
];

export function QuickActions() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={styles.action}
          onPress={() => router.push(action.route as any)}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrap}>
            <Feather name={action.icon} size={20} color={C.dark} />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  action: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
