import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Registers a background notification response listener so the APK can
 * react when the user taps a system notification while the app is closed
 * or in the background. No-op on web.
 *
 * Currently logs the notification data; extend the switch block to
 * navigate to specific screens based on notification.request.content.data.
 */
export function useBackgroundNotifications() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    let subscription: { remove: () => void } | null = null;

    void (async () => {
      try {
        const Notifications = await import("expo-notifications");

        /* ── Handler: show alert/sound/badge while app is FOREGROUND ── */
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        /* ── Listener: user tapped notification (foreground OR background) ── */
        subscription = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            const data = response.notification.request.content.data as Record<string, unknown>;
            const channelId = (data?.channelId as string) ?? "default";

            /* Extend this switch to navigate to specific screens */
            switch (channelId) {
              case "banking":
                /* Navigate to transactions screen */
                break;
              case "security":
                /* Navigate to security/login screen */
                break;
              case "documents":
                /* Navigate to radicados screen */
                break;
              case "account":
                /* Navigate to profile/account screen */
                break;
              default:
                break;
            }
          }
        );
      } catch {
        /* Non-blocking */
      }
    })();

    return () => {
      subscription?.remove();
    };
  }, []);
}
