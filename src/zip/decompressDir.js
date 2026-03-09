import { createReadStream, createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { createBrotliDecompress } from "zlib";
import { PATHS } from "../shared/constants.js";
import { exists, handleFsError } from "../shared/fs-utils.js";

export const decompressDir = async () => {
  const sourceDir = path.join(PATHS.workspace, "compressed");
  const archivePath = path.join(sourceDir, "archive.br");
  const destinationDir = path.join(PATHS.workspace, "decompressed");

  try {
    if (!(await exists(archivePath))) throw new Error();

    if (!(await exists(destinationDir))) {
      await mkdir(destinationDir, { recursive: true });
    }

    const inputStream = createReadStream(archivePath);
    const brotliDecompressor = createBrotliDecompress();
    const decompressedStream = inputStream.pipe(brotliDecompressor);

    const iterator = decompressedStream[Symbol.asyncIterator]();
    let buffer = Buffer.alloc(0);

    const readExactly = async (n) => {
      while (buffer.length < n) {
        const { value, done } = await iterator.next();
        if (done) {
          if (buffer.length === 0) return null;
          throw new Error("Unexpected EOF");
        }
        buffer = Buffer.concat([buffer, value]);
      }

      const chunk = buffer.subarray(0, n);
      buffer = buffer.subarray(n);
      return chunk;
    };

    while (true) {
      const headerLengthBuffer = await readExactly(4);
      if (!headerLengthBuffer) break;

      const headerLength = headerLengthBuffer.readUInt32BE(0);
      const metadataBuffer = await readExactly(headerLength);
      const { path: relativePath } = JSON.parse(
        metadataBuffer.toString("utf8"),
      );

      const fileSizeBuffer = await readExactly(8);
      let remainingBytes = fileSizeBuffer.readBigUInt64BE(0);

      const targetPath = path.join(destinationDir, relativePath);
      await mkdir(path.dirname(targetPath), { recursive: true });
      const fileWriteStream = createWriteStream(targetPath);

      while (remainingBytes > 0n) {
        if (buffer.length === 0) {
          const { value, done } = await iterator.next();
          if (done) throw new Error("Unexpected EOF inside file data");
          buffer = value;
        }

        const currentBufferLength = BigInt(buffer.length);
        const takeLength =
          currentBufferLength > remainingBytes
            ? Number(remainingBytes)
            : buffer.length;

        const chunkToWrite = buffer.subarray(0, takeLength);
        buffer = buffer.subarray(takeLength);

        if (!fileWriteStream.write(chunkToWrite)) {
          await new Promise((resolve) =>
            fileWriteStream.once("drain", resolve),
          );
        }

        remainingBytes -= BigInt(takeLength);
      }

      fileWriteStream.end();
      await new Promise((resolve, reject) => {
        fileWriteStream.on("finish", resolve);
        fileWriteStream.on("error", reject);
      });
    }
  } catch {
    handleFsError();
  }
};

await decompressDir();
