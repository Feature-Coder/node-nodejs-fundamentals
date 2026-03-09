import fs from "fs/promises";
import { PATHS } from "../shared/constants.js";
import { handleFsError, findFilesByExt } from "../shared/fs-utils.js";

const run = async () => {
  const args = process.argv.slice(2);
  const extIndex = args.indexOf("--ext");
  const ext =
    extIndex !== -1 && args[extIndex + 1] && !args[extIndex + 1].startsWith("-")
      ? args[extIndex + 1]
      : ".txt";

  try {
    await fs.access(PATHS.workspace);

    const files = await findFilesByExt(PATHS.workspace, ext);

    files.forEach((f) => console.log(f.relativePath));
  } catch (error) {
    handleFsError();
  }
};

await run();
