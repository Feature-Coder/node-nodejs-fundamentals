import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { pipeline } from "stream/promises";
import { PATHS } from "../shared/constants.js";
import { handleFsError, exists } from "../shared/fs-utils.js";

const calculateFileHash = async (absolutePath) => {
  const hash = createHash("sha256");
  const fileReadStream = fs.createReadStream(absolutePath);
  await pipeline(fileReadStream, hash);

  return hash.digest("hex");
};

const loadChecksums = async (configPath) => {
  if (!(await exists(configPath))) handleFsError();

  try {
    const rawData = await fsp.readFile(configPath, "utf-8");
    return JSON.parse(rawData);
  } catch {
    handleFsError();
  }
};

const verify = async () => {
  try {
    const expectedData = await loadChecksums(PATHS.checksums);
    for (const [fileName, expectedHash] of Object.entries(expectedData)) {
      const fullPath = path.join(PATHS.workspace, fileName);

      try {
        const actualHash = await calculateFileHash(fullPath);

        const status = actualHash === expectedHash ? "OK" : "FAIL";
        console.log(`${fileName} — ${status}`);
      } catch (err) {
        console.log(`${fileName} — FAIL`);
      }
    }
  } catch (err) {
    handleFsError();
  }
};

await verify();
