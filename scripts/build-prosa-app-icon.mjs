#!/usr/bin/env node
/**
 * Build Tauri app-icon master per Apple macOS template (1024 canvas, 824 artwork).
 * @see https://developer.apple.com/design/human-interface-guidelines/app-icons
 * @see https://github.com/tauri-apps/tauri/pull/11037 (824×824 content in 1024×1024)
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROSA = join(ROOT, "apps/prosa");
const TAURI = join(PROSA, "src-tauri");
const BRAND = join(ROOT, "docs/brands/scribam-brand-kit/prosa.svg");

/** Apple Design Resources — macOS app icon artwork area within 1024×1024 export. */
const MACOS_ICON_CANVAS = 1024;
const MACOS_ICON_ARTWORK = 824;
const PROSA_ART_UNITS = 256;
const SCALE = MACOS_ICON_ARTWORK / PROSA_ART_UNITS;

const brand = readFileSync(BRAND, "utf8");
const inner = brand.replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

const appIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MACOS_ICON_CANVAS} ${MACOS_ICON_CANVAS}" role="img" aria-label="Scribam Prosa">
  <g transform="translate(${MACOS_ICON_CANVAS / 2} ${MACOS_ICON_CANVAS / 2}) scale(${SCALE}) translate(-${PROSA_ART_UNITS / 2} -${PROSA_ART_UNITS / 2})">
${inner.trim()}
  </g>
</svg>
`;

const svgPath = join(TAURI, "app-icon.svg");
writeFileSync(svgPath, appIconSvg);

execSync("pnpm exec tauri icon src-tauri/app-icon.svg -o src-tauri/icons", {
  cwd: PROSA,
  stdio: "inherit",
});

console.log(
  `Prosa app icons: ${MACOS_ICON_ARTWORK}px artwork on ${MACOS_ICON_CANVAS}px canvas (Apple macOS template).`,
);
