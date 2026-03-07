import fs from "fs/promises";
import path from "path";

export const normalizePath = (p) => p.split(path.sep).join("/");

export const handleFsError = () => {
  throw new Error("FS operation failed");
};

export async function scanDir(dir, root = dir, accumulator = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = normalizePath(path.relative(root, fullPath));
    accumulator.push({ entry, fullPath, relativePath });
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);
      await scanDir(fullPath, root, accumulator);
    }
  }

  return accumulator;
}

export async function findFilesByExt(directory, ext) {
  const targetExt = ext.startsWith(".") ? ext : `.${ext}`;

  const allItems = await scanDir(directory);

  return allItems
    .filter(
      (item) =>
        !item.entry.isDirectory() &&
        path.extname(item.entry.name) === targetExt,
    )
    .map(({ fullPath, relativePath }) => ({ fullPath, relativePath }))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
