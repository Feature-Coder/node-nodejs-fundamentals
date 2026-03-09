import fs from "fs/promises";
import { PATHS } from "../shared/constants.js";
import { normalizePath, handleFsError, scanDir } from "../shared/fs-utils.js";

const snapshot = async () => {
  try {
    await fs.access(PATHS.workspace);

    const allItems = await scanDir(PATHS.workspace);
    const entries = [];

    for (const item of allItems) {
      const { entry, fullPath, relativePath } = item;

      if (entry.isDirectory()) {
        entries.push({ path: relativePath, type: "directory" });
      } else {
        const stats = await fs.stat(fullPath);
        entries.push({
          path: relativePath,
          type: "file",
          size: stats.size,
          content: await fs.readFile(fullPath, "base64"),
        });
      }
    }

    const data = { rootPath: normalizePath(PATHS.workspace), entries };
    await fs.writeFile(PATHS.snapshot, JSON.stringify(data, null, 2));
  } catch (err) {
    handleFsError();
  }
};

await snapshot();
