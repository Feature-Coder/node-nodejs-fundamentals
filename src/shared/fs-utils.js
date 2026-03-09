import fs from "fs/promises";
import path from "path";

export const normalizePath = (p) => p.split(path.sep).join("/");

export const handleFsError = () => {
  throw new Error("FS operation failed");
};

export const exists = (p) =>
  fs
    .access(p)
    .then(() => true)
    .catch(() => false);

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

export async function findFilesByExt(directory, extension) {
  if (!(await exists(directory))) handleFsError();

  const targetExt = extension.startsWith(".") ? extension : `.${extension}`;
  const allEntries = await scanDir(directory);

  return allEntries
    .filter(({ entry }) => {
      const isFile = !entry.isDirectory();
      const hasRightExt = path.extname(entry.name) === targetExt;
      return isFile && hasRightExt;
    })
    .map(({ entry, fullPath, relativePath }) => ({
      fileName: entry.name,
      fullPath,
      relativePath,
    }))
    .sort((a, b) => a.fileName.localeCompare(b.fileName));
}
