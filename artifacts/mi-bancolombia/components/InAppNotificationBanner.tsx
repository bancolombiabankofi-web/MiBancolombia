import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { apiUrl } from "@/utils/api";

type InboxNotif = {
  id: string;
  title: string;
  body: string;
  color: string;
  type: string;
  createdAt: string;
};

const POLL_INTERVAL = 30_000;

export function InAppNotificationBanner() {
  const { currentUser } = useApp();
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<InboxNotif[]>([]);
  const [current, setCurrent] = useState<InboxNotif | null>(null);
  const translateY = useRef(new Animated.Value(-200)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenIds = useRef(new Set<string>());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnread = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(apiUrl(`/api/app-notifications?userId=${encodeURIComponent(currentUser.id)}&unread=true`));
      if (!res.ok) return;
      const data: InboxNotif[] = await res.json();
      const fresh = data.filter((n) => !seenIds.current.has(n.id));
      if (fresh.length > 0) {
        seenIds.current = new Set([...seenIds.current, ...fresh.map((n) => n.id)]);
        setQueue((prev) => [...prev, ...fresh]);
      }
    } catch { /* ignore network errors */ }
  }, [currentUser]);

  const markRead = useCallback(async (id: string) => {
    try {
      await fetch(apiUrl(`/api/app-notifications/${id}/read`), { method: "PUT" });
    } catch { /* ignore */ }
  }, []);

  /* Start polling when logged in */
  useEffect(() => {
    if (!currentUser) return;
    void fetchUnread();
    pollingRef.current = setInterval(fetchUnread, POLL_INTERVAL);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [currentUser, fetchUnread]);

  /* Dequeue and show the next notification */
  useEffect(() => {
    if (current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setCurrent(next);
  }, [queue, current]);

  /* Animate in/out when current changes */
  useEffect(() => {
    if (!current) return;

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => dismiss(), 6000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current]);

  const dismiss = useCallback(() => {
    if (!current) return;
    const id = current.id;
    Animated.timing(translateY, {
      toValue: -200,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setCurrent(null);
      translateY.setValue(-200);
    });
    void markRead(id);
  }, [current, markRead, translateY]);

  if (!current) return null;

  const notifColor = current.color || "#FDDA24";
  const topPad = Platform.OS === "web" ? (insets.top || 16) : (insets.top > 0 ? insets.top : 12);

  return (
    <Animated.View
      style={[
        styles.container,
        { top: topPad, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: notifColor }]}
        onPress={dismiss}
        activeOpacity={0.9}
      >
        <View style={[styles.iconWrap, { backgroundColor: notifColor + "22" }]}>
          <Feather name="bell" size={16} color={notifColor} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: notifColor }]} numberOfLines={1}>
            {current.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {current.body}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={dismiss} hitSlop={8}>
          <Feather name="x" size={14} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1A1F36",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textCol: { flex: 1, gap: 2 },
  title: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  body: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  closeBtn: { padding: 4 },
});
