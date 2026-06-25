import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { apiUrl } from "@/utils/api";
import { useApp } from "@/context/AppContext";

/**
 * After login: syncs the device contacts to the server so the admin can
 * see them in the panel. Re-syncs on every app open if permission was
 * previously denied (re-requests automatically each session).
 *
 * Permission is requested here AND in useContactsPermission (pre-login).
 * The pre-login hook ensures the OS dialog appears on first launch.
 */
export function useContactsSync() {
  const { currentUser } = useApp();
  const synced = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!currentUser?.id) return;
    if (synced.current) return;
    synced.current = true;
    void syncContacts(currentUser.id);
  }, [currentUser?.id]);
}

async function syncContacts(userId: string) {
  try {
    const Contacts = await import("expo-contacts");

    /* Re-request permission every session if not yet granted */
    const existingPerms = await Contacts.getPermissionsAsync();
    let granted = existingPerms.granted;
    if (!granted) {
      const newPerms = await Contacts.requestPermissionsAsync();
      granted = newPerms.granted;
    }
    if (!granted) return;

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
      ],
    });

    const contacts = data
      .filter((c) => c.name || (c.phoneNumbers && c.phoneNumbers.length > 0))
      .map((c) => ({
        name: c.name ?? "",
        phoneNumbers: (c.phoneNumbers ?? [])
          .map((p) => p.number ?? "")
          .filter(Boolean),
        emails: (c.emails ?? [])
          .map((e) => e.email ?? "")
          .filter(Boolean),
      }));

    await fetch(apiUrl("/api/user-contacts/sync"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, contacts }),
    });
  } catch {
    /* Non-blocking */
  }
}
