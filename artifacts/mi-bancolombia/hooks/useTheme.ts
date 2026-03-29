import { useColorScheme } from "react-native";
import Colors, { ColorScheme } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export function useTheme(): { C: ColorScheme; isDark: boolean } {
  const system = useColorScheme();
  const { themeMode } = useApp();

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && system === "dark");

  return {
    C: isDark ? Colors.dark : Colors.light,
    isDark,
  };
}
