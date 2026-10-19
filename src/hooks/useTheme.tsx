import { ThemeContext } from "@/contexts/ThemeContext";
import { useContext } from "react";

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    console.log("useThemeContext must be used within a ThemeProvider");
  }
  return context!;
};
