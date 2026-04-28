import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

type ViteManifest = Record<string, { file: string; css?: string[] }>;

const currentDir = fileURLToPath(new URL(".", import.meta.url));
const frontendDistDir = resolve(currentDir, "../../../../frontend/dist");
const frontendManifestPath = resolve(frontendDistDir, ".vite/manifest.json");
const frontendDevOrigin = process.env.FRONTEND_DEV_ORIGIN ?? "http://127.0.0.1:5173";

let cachedManifest: ViteManifest | null = null;

function readManifest(): ViteManifest | null {
  if (cachedManifest) {
    return cachedManifest;
  }

  if (!existsSync(frontendManifestPath)) {
    return null;
  }

  cachedManifest = JSON.parse(readFileSync(frontendManifestPath, "utf8")) as ViteManifest;
  return cachedManifest;
}

export function getFrontendDistDir(): string {
  return frontendDistDir;
}

export function renderFrontendAssetTags(): string {
  if (process.env.NODE_ENV !== "production") {
    return [
      `<link rel="stylesheet" href="${frontendDevOrigin}/src/styles/global.css" />`,
      `<script type="module" src="${frontendDevOrigin}/@vite/client"></script>`,
      `<script type="module" src="${frontendDevOrigin}/src/entry.ts"></script>`
    ].join("");
  }

  const manifest = readManifest();
  const entry = manifest?.["src/entry.ts"] ?? manifest?.["index.html"];

  if (!entry) {
    return "";
  }

  const cssTags = (entry.css ?? [])
    .map((href) => `<link rel="stylesheet" href="/${href}" />`)
    .join("");

  return `${cssTags}<script type="module" src="/${entry.file}"></script>`;
}
