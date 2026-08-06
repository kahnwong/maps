import { ref } from "vue";

export type ThemeMode = "light" | "dark";

export const themeMode = ref<ThemeMode>("light");

export function toggleTheme() {
  themeMode.value = themeMode.value === "light" ? "dark" : "light";
}
