import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import Colors from "@/constants/colors";

const C = Colors.light;

const NAVY = "#0A0E27";
const ACTIVE = "#FDDA24";
const INACTIVE = "rgba(255,255,255,0.45)";

type FeatherName = keyof typeof Feather.glyphMap;

function TabIcon({
  name,
  focused,
}: {
  name: FeatherName;
  focused: boolean;
}) {
  return (
    <View style={focused ? styles.activeIconWrap : styles.iconWrap}>
      <Feather name={name} size={22} color={focused ? ACTIVE : INACTIVE} />
    </View>
  );
}

export default function TabLayout() {
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: NAVY,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: isWeb ? 72 : 70,
          paddingBottom: isWeb ? 10 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginTop: 2,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: NAVY }]} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="transfers"
        options={{
          title: "Transferir",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="send" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Pagar",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="grid" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: "Productos",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="credit-card" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="movements"
        options={{
          title: "Movimientos",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="clock" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
