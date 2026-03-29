import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "@/constants/colors";

const C = Colors.light;

type Props = {
  pin: string;
  onPress: (digit: string) => void;
  onDelete: () => void;
};

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "del"],
];

export function PinPad({ pin, onPress, onDelete }: Props) {
  const handlePress = (key: string) => {
    if (key === "") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === "del") {
      onDelete();
    } else {
      onPress(key);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.dot, i < pin.length && styles.dotFilled]}
          />
        ))}
      </View>
      <View style={styles.pad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                style={[styles.key, key === "" && styles.keyEmpty]}
                onPress={() => handlePress(key)}
                activeOpacity={key === "" ? 1 : 0.6}
              >
                {key === "del" ? (
                  <Feather name="delete" size={22} color={C.text} />
                ) : (
                  <Text style={styles.keyText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 40,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#1C1C1E",
  },
  dotFilled: {
    backgroundColor: "#1C1C1E",
  },
  pad: {
    width: "100%",
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  keyEmpty: {
    backgroundColor: "transparent",
  },
  keyText: {
    fontSize: 28,
    fontWeight: "500",
    color: "#1C1C1E",
    fontFamily: "Inter_500Medium",
  },
});
