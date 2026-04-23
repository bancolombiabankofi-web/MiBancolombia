import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

type FeatherName = keyof typeof Feather.glyphMap;

const WHITE_BG = "#FFFFFF";
const ACTIVE_COLOR = "#1C1C1E";
const INACTIVE_COLOR = "#9CA3AF";
const YELLOW = "#FDDA24";

function TabIcon({ name, focused }: { name: FeatherName; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Feather name={name} size={23} color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} />
      {focused && <View style={styles.dot} />}
    </View>
  );
}

export default function TabLayout() {
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: WHITE_BG,
          borderTopWidth: 1,
          borderTopColor: "#F0F0F0",
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
          height: isWeb ? 72 : 72,
          paddingBottom: isWeb ? 10 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="movements"
        options={{
          title: "Movimientos",
          tabBarIcon: ({ focused }) => <TabIcon name="clock" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="transfers"
        options={{
          title: "Transferir",
          tabBarIcon: ({ focused }) => <TabIcon name="send" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Explorar",
          tabBarIcon: ({ focused }) => <TabIcon name="grid" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: "Productos",
          tabBarIcon: ({ focused }) => <TabIcon name="credit-card" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: YELLOW,
  },
});
