import fs from "fs";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { PATHS } from "../shared/constants.js";
import { handleFsError, findFilesByExt } from "../shared/fs-utils.js";

const getManualFileList = () => {
  const args = process.argv.slice(2);
  const filesFlagIndex = args.indexOf("--files");

  if (filesFlagIndex === -1 || !args[filesFlagIndex + 1]) return null;

  return args[filesFlagIndex + 1].split(",");
};

const resolveFilePaths = async (manualNames) => {
  const availableFiles = await findFilesByExt(PATHS.parts, "txt");

  if (manualNames) {
    return manualNames.map((requestedName) => {
      const foundFile = availableFiles.find(
        (file) => file.fileName === requestedName,
      );

      if (!foundFile) handleFsError();

      return foundFile.fullPath;
    });
  }

  if (availableFiles.length === 0) handleFsError();

  return availableFiles.map((file) => file.fullPath);
};

const streamMerge = async (sourcePaths, destination) => {
  const outputStream = createWriteStream(destination);

  for (const filePath of sourcePaths) {
    await pipeline(fs.createReadStream(filePath), outputStream, { end: false });
  }

  outputStream.end();
};

const merge = async () => {
  try {
    const manualNames = getManualFileList();
    const pathsToMerge = await resolveFilePaths(manualNames);

    await streamMerge(pathsToMerge, PATHS.merged);
  } catch (err) {
    handleFsError();
  }
};

await merge();
