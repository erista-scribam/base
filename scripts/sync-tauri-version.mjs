import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = JSON.parse(
  readFileSync(path.join(root, "apps/prosa/package.json"), "utf8"),
).version;

const tauriConfPath = path.join(root, "apps/prosa/src-tauri/tauri.conf.json");
const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf8"));
tauriConf.version = version;
writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`);

const rootPkgPath = path.join(root, "package.json");
const rootPkg = JSON.parse(readFileSync(rootPkgPath, "utf8"));
rootPkg.version = version;
writeFileSync(rootPkgPath, `${JSON.stringify(rootPkg, null, 2)}\n`);

console.log(`Synced root and Tauri app version to ${version}`);
