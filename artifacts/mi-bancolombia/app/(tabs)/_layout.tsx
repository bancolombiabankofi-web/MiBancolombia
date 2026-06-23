import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";

const YELLOW = "#FDDA24";
type FeatherName = keyof typeof Feather.glyphMap;

function TabIcon({ name, label, focused, C }: { name: FeatherName; label: string; focused: boolean; C: any }) {
  return (
    <View style={styles.tabItem}>
      <Feather name={name} size={20} color={focused ? YELLOW : C.tabIconDefault} />
      <Text style={[styles.tabLabel, { color: focused ? YELLOW : C.tabIconDefault }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function CenterTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.centerWrap}>
      <View style={[styles.centerBtn, { backgroundColor: focused ? YELLOW : "#2A2A30" }]}>
        <Feather name="grid" size={22} color={focused ? "#1C1C1E" : "#FFFFFF"} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  const tabH = 52 + bottomPad;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: C.tabBar,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: C.border,
          elevation: 12,
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.4 : 0.07,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
          height: tabH,
          paddingBottom: bottomPad,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="home" label="Inicio" focused={focused} C={C} /> }}
      />
      <Tabs.Screen
        name="movements"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="list" label="Movimientos" focused={focused} C={C} /> }}
      />
      <Tabs.Screen
        name="transfers"
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <CenterTabIcon focused={focused} />,
          tabBarStyle: {
            backgroundColor: C.tabBar,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: C.border,
            elevation: 12,
            shadowColor: "#000",
            shadowOpacity: isDark ? 0.4 : 0.07,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: -2 },
            height: tabH,
            paddingBottom: bottomPad,
            paddingTop: 6,
          },
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="file-text" label={"Trámites"} focused={focused} C={C} /> }}
      />
      <Tabs.Screen
        name="cards"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="settings" label="Ajustes" focused={focused} C={C} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 4,
    minWidth: 52,
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 11,
  },
  centerWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
});
