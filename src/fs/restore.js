import { mkdir, access, readFile, writeFile } from "fs/promises";
import path from "path";
const restore = async () => {
  // Write your code here
  // Read snapshot.json
  // Treat snapshot.rootPath as metadata only
  // Recreate directory/file structure in workspace_restored
  const snapshotPath = path.resolve(import.meta.dirname, "../../snapshot.json");
  const restoredPath = path.resolve(
    import.meta.dirname,
    "../../workspace_restored",
  );

  try {
    const data = await readFile(snapshotPath, "utf-8");
    const { entries } = JSON.parse(data);
    const alreadyExists = await access(restoredPath)
      .then(() => true)
      .catch(() => false);
    if (alreadyExists) throw new Error();

    await mkdir(restoredPath);

    for (const entry of entries) {
      const fullPath = path.join(restoredPath, entry.path);

      if (entry.type === "directory") {
        await mkdir(fullPath, { recursive: true });
      } else {
        await mkdir(path.dirname(fullPath), { recursive: true });
        await writeFile(fullPath, Buffer.from(entry.content, "base64"));
      }
    }
  } catch (err) {
    throw new Error("FS operation failed");
  }
};

await restore();
