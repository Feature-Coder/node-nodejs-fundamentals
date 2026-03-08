import fs from "fs";
import path from "path";
import { PATHS } from "../shared/constants.js";
import { exists, handleFsError } from "../shared/fs-utils.js";

export const split = async () => {
  const args = process.argv.slice(2);
  const linesIndex = args.indexOf("--lines");
  let maxLinesPerChunk = 10;

  if (linesIndex !== -1 && args[linesIndex + 1]) {
    const parsedLimit = parseInt(args[linesIndex + 1], 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      maxLinesPerChunk = parsedLimit;
    }
  }

  const sourceFilePath = PATHS.sourceTxt;

  if (!(await exists(sourceFilePath))) {
    handleFsError();
  }

  const fileReadStream = fs.createReadStream(sourceFilePath, {
    encoding: "utf8",
  });

  let chunkFileIndex = 1;
  let currentFileLinesCount = 0;
  let currentChunkWriteStream = null;
  let lineRemainder = "";

  const createNextChunkStream = () => {
    if (currentChunkWriteStream) {
      currentChunkWriteStream.end();
    }
    const chunkPath = path.join(PATHS.root, `chunk_${chunkFileIndex}.txt`);
    currentChunkWriteStream = fs.createWriteStream(chunkPath);
    chunkFileIndex++;
    currentFileLinesCount = 0;
  };

  createNextChunkStream();

  for await (const dataChunk of fileReadStream) {
    const lines = (lineRemainder + dataChunk).split("\n");
    lineRemainder = lines.pop();

    for (const line of lines) {
      if (currentFileLinesCount >= maxLinesPerChunk) {
        createNextChunkStream();
      }

      if (!currentChunkWriteStream.write(`${line}\n`)) {
        await new Promise((resolve) =>
          currentChunkWriteStream.once("drain", resolve),
        );
      }

      currentFileLinesCount++;
    }
  }

  if (lineRemainder) {
    if (currentFileLinesCount >= maxLinesPerChunk) {
      createNextChunkStream();
    }
    currentChunkWriteStream.write(lineRemainder);
  }

  if (currentChunkWriteStream) {
    currentChunkWriteStream.end();
  }
};

await split();
