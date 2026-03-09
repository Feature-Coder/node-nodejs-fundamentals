import { createReadStream, createWriteStream } from "fs";
import { stat, mkdir } from "fs/promises";
import path from "path";
import { createBrotliCompress } from "zlib";
import { pipeline } from "stream/promises";
import { PATHS } from "../shared/constants.js";
import { exists, handleFsError, scanDir } from "../shared/fs-utils.js";

export const compressDir = async () => {
  const sourceDir = path.join(PATHS.workspace, "toCompress");
  const destinationDir = path.join(PATHS.workspace, "compressed");
  const archivePath = path.join(destinationDir, "archive.br");

  try {
    if (!(await exists(sourceDir))) throw new Error();
    if (!(await exists(destinationDir)))
      await mkdir(destinationDir, { recursive: true });

    const files = await scanDir(sourceDir);
    const outputStream = createWriteStream(archivePath);
    const brotliCompressor = createBrotliCompress();

    const pipelinePromise = pipeline(brotliCompressor, outputStream);

    for (const { fullPath, relativePath } of files) {
      const fileStat = await stat(fullPath);
      if (fileStat.isDirectory()) continue;

      const metadataBuffer = Buffer.from(
        JSON.stringify({ path: relativePath }),
        "utf8",
      );
      const headerLengthBuffer = Buffer.alloc(4);
      headerLengthBuffer.writeUInt32BE(metadataBuffer.length);

      const fileSizeBuffer = Buffer.alloc(8);
      fileSizeBuffer.writeBigUInt64BE(BigInt(fileStat.size));

      brotliCompressor.write(headerLengthBuffer);
      brotliCompressor.write(metadataBuffer);
      brotliCompressor.write(fileSizeBuffer);

      const fileReadStream = createReadStream(fullPath);
      for await (const chunk of fileReadStream) {
        if (!brotliCompressor.write(chunk)) {
          await new Promise((resolve) =>
            brotliCompressor.once("drain", resolve),
          );
        }
      }
    }

    brotliCompressor.end();
    await pipelinePromise;
  } catch {
    handleFsError();
  }
};

await compressDir();
