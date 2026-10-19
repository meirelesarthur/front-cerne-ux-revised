import type { ThemeTypes } from "@/contexts/ThemeContext";

const themeBus = new EventTarget();

export function emitThemeChange(theme: ThemeTypes) {
  themeBus.dispatchEvent(new CustomEvent("themeChange", { detail: theme }));
}

export function onThemeChange(
  callback: (theme: ThemeTypes) => void
): () => void {
  const handler = (e: Event) => {
    const theme = (e as CustomEvent<ThemeTypes>).detail;
    callback(theme);
  };
  themeBus.addEventListener("themeChange", handler);
  return () => themeBus.removeEventListener("themeChange", handler);
}
