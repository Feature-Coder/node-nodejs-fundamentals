import path from "path";
import fs from "fs/promises";
const snapshot = async () => {
  // Write your code here
  // Recursively scan workspace directory
  // Write snapshot.json with:
  // - rootPath: absolute path to workspace
  // - entries: flat array of relative paths and metadata

  const workspacePath = path.resolve(import.meta.dirname, "../../workspace");

  try {
    await fs.access(workspacePath);
    const entries = await scanDirectory(workspacePath, workspacePath);
    const snapshot = {
      rootPath: workspacePath.split(path.sep).join("/"),
      entries,
    };
    await fs.writeFile(
      path.resolve(import.meta.dirname, "../../snapshot.json"),
      JSON.stringify(snapshot, null, 2),
    );
  } catch (error) {
    throw new Error("FS operation failed");
  }
};

await snapshot();

async function scanDirectory(directoryPath, workspacePath, accumulator = []) {
  const files = await fs.readdir(directoryPath, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(directoryPath, file.name);
    const relativePath = path
      .relative(workspacePath, fullPath)
      .split(path.sep)
      .join("/");

    if (file.isDirectory()) {
      accumulator.push({ path: relativePath, type: "directory" });
    } else {
      const stats = await fs.stat(fullPath);
      accumulator.push({
        path: relativePath,
        type: "file",
        size: stats.size,
        content: await fs.readFile(fullPath, "base64"),
      });
    }
  }

  for (const file of files) {
    const fullPath = path.join(directoryPath, file.name);
    if (file.isDirectory()) {
      await scanDirectory(fullPath, workspacePath, accumulator);
    }
  }

  return accumulator;
}
