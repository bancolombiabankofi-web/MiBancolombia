import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Requests contacts READ permission on every app launch (native only).
 * Runs BEFORE the user logs in — call this at the root layout level.
 * If the user denies, the next app open will ask again automatically
 * because this hook has no persistent state (only in-memory).
 *
 * Actual contact sync (which needs userId) is handled by useContactsSync.
 */
export function useContactsPermission() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    void requestContactsPermission();
  }, []);
}

async function requestContactsPermission() {
  try {
    const Contacts = await import("expo-contacts");
    const { granted } = await Contacts.getPermissionsAsync();
    if (!granted) {
      await Contacts.requestPermissionsAsync();
    }
  } catch {
    /* Non-blocking */
  }
}
