import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../../");

export const PATHS = {
  workspace: path.join(ROOT, "workspace"),
  restored: path.join(ROOT, "workspace_restored"),
  snapshot: path.join(ROOT, "snapshot.json"),
  parts: path.join(ROOT, "workspace", "parts"),
};
