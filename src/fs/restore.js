import fs from "fs/promises";
import path from "path";
import { PATHS } from "../shared/constants.js";
import { exists, handleFsError } from "../shared/fs-utils.js";

const restore = async () => {
  try {
    const data = await fs.readFile(PATHS.snapshot, "utf-8");
    const { entries } = JSON.parse(data);
    const alreadyExists = await exists(PATHS.restored);

    if (alreadyExists) throw new Error();

    await fs.mkdir(PATHS.restored);

    for (const entry of entries) {
      const fullPath = path.join(PATHS.restored, entry.path);

      if (entry.type === "directory") {
        await fs.mkdir(fullPath, { recursive: true });
      } else {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });

        const content = Buffer.from(entry.content, "base64");
        await fs.writeFile(fullPath, content);
      }
    }

    console.log("Restore completed successfully.");
  } catch (err) {
    handleFsError();
  }
};

await restore();
