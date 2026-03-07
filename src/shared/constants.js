import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../../");

export const PATHS = {
  workspace: path.join(ROOT, "workspace"),
  restored: path.join(ROOT, "workspace_restored"),
  snapshot: path.join(ROOT, "snapshot.json"),
  parts: path.join(ROOT, "workspace", "parts"),
  merged: path.join(ROOT, "workspace", "merged.txt"),
  checksums: path.resolve(ROOT, "checksums.json"),
  modules: path.resolve(ROOT, "src", "modules"),
  plugins: path.resolve(ROOT, "src", "modules", "plugins"),
};
