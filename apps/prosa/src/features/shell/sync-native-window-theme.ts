import { getCurrentWindow } from "@tauri-apps/api/window";
import type { ThemeMode } from "../../hooks/useTheme";
import { isTauriRuntime } from "../persistence/is-tauri";

/** Match in-app light/dark to macOS title bar and traffic lights (Tauri 2). */
export async function syncNativeWindowTheme(mode: ThemeMode): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }
  try {
    await getCurrentWindow().setTheme(mode);
  } catch {
    // Missing permission or non-desktop runtime — ignore.
  }
}
