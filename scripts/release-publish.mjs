import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const version = JSON.parse(readFileSync("apps/prosa/package.json", "utf8")).version;
const tag = `v${version}`;

try {
  execSync(`git rev-parse "${tag}^{tag}"`, { stdio: "ignore" });
  console.log(`Tag ${tag} already exists; skipping tag push.`);
} catch {
  execSync(`git tag "${tag}"`, { stdio: "inherit" });
  execSync(`git push origin "${tag}"`, { stdio: "inherit" });
  console.log(`Pushed tag ${tag} to trigger desktop release builds.`);
}
