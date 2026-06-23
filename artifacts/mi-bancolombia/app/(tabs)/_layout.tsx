import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const YELLOW = "#FDDA24";

type FeatherName = keyof typeof Feather.glyphMap;

function TabIcon({ name, label, focused, C }: { name: FeatherName; label: string; focused: boolean; C: any }) {
  return (
    <View style={styles.tabItemWrap}>
      <Feather
        name={name}
        size={21}
        color={focused ? YELLOW : C.tabIconDefault}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? YELLOW : C.tabIconDefault },
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

function ExplorarTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.explorarWrap}>
      <View style={[styles.explorarBtn, focused && styles.explorarBtnActive]}>
        <Feather
          name="grid"
          size={24}
          color={focused ? "#1C1C1E" : "#FFFFFF"}
        />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { C, isDark } = useTheme();
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: C.tabBar,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: C.border,
          elevation: 16,
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.5 : 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -2 },
          height: isWeb ? 72 : 80,
          paddingBottom: isWeb ? 8 : 14,
          paddingTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" label="Inicio" focused={focused} C={C} />
          ),
        }}
      />
      <Tabs.Screen
        name="movements"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="list" label="Transacciones" focused={focused} C={C} />
          ),
        }}
      />
      <Tabs.Screen
        name="transfers"
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <ExplorarTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="file-text" label={"Trámites y\nsolicitudes"} focused={focused} C={C} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings" label="Ajustes" focused={focused} C={C} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItemWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 10,
    minWidth: 56,
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 11,
    marginTop: 2,
  },
  explorarWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
  },
  explorarBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2A2A30",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  explorarBtnActive: {
    backgroundColor: YELLOW,
  },
});
