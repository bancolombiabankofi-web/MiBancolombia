const BANCOLOMBIA_YELLOW = "#FDDA24";
const BANCOLOMBIA_DARK = "#1C1C1E";
const BANCOLOMBIA_NAVY = "#0A0E27";

export default {
  light: {
    text: "#1C1C1E",
    textSecondary: "#6B7280",
    textLight: "#9CA3AF",
    background: "#F5F5F7",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    tint: BANCOLOMBIA_YELLOW,
    tabIconDefault: "#9CA3AF",
    tabIconSelected: BANCOLOMBIA_DARK,
    border: "#E5E7EB",
    yellow: BANCOLOMBIA_YELLOW,
    yellowDark: "#E6C000",
    dark: BANCOLOMBIA_DARK,
    navy: BANCOLOMBIA_NAVY,
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
    overlay: "rgba(0,0,0,0.5)",
    gradient1: "#FDDA24",
    gradient2: "#F5C500",
  },
};

export type ColorScheme = typeof import("./colors").default.light;
