// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const digest = createHash("sha256");
function fingerprint(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) fingerprint(path);
    else digest.update(path).update(readFileSync(path));
  }
}
fingerprint("src");
digest.update(readFileSync("vite.config.ts"));
let baseCommit = "indisponível";
try { baseCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch { /* Source identity remains available. */ }

export default defineConfig({
  vite: { define: { __PRIVACIUM_BUILD__: JSON.stringify({ id: digest.digest("hex"), builtAt: new Date().toISOString(), baseCommit }) } },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
