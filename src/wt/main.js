import { Worker } from "worker_threads";
import { cpus } from "os";
import { readFile } from "fs/promises";
import path from "path";
import { PATHS } from "../shared/constants.js";
import { exists, handleFsError } from "../shared/fs-utils.js";

const kWayMerge = (chunks) => {
  const result = [];
  const indices = new Array(chunks.length).fill(0);
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);

  for (let i = 0; i < totalLength; i++) {
    let min = Infinity;
    let minChunkIndex = -1;

    for (let j = 0; j < chunks.length; j++) {
      const chunk = chunks[j];
      const index = indices[j];

      if (index < chunk.length && chunk[index] < min) {
        min = chunk[index];
        minChunkIndex = j;
      }
    }

    result.push(min);
    indices[minChunkIndex]++;
  }

  return result;
};

const createWorker = (workerPath, chunk) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath);
    worker.postMessage(chunk);

    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
};

export const main = async () => {
  const dataPath = PATHS.dataJSON;
  const workerPath = path.join(import.meta.dirname, "worker.js");

  if (!(await exists(dataPath))) {
    handleFsError();
  }

  const rawNumbersString = await readFile(dataPath, "utf8");
  const numberArray = JSON.parse(rawNumbersString);

  const logicalCoresCount = cpus().length;
  const chunkSize = Math.ceil(numberArray.length / logicalCoresCount);

  const dataChunks = [];
  for (let i = 0; i < logicalCoresCount; i++) {
    dataChunks.push(numberArray.slice(i * chunkSize, (i + 1) * chunkSize));
  }

  const sortedChunksArray = await Promise.all(
    dataChunks.map((chunk) => createWorker(workerPath, chunk)),
  );

  const finalSortedArray = kWayMerge(sortedChunksArray);
  console.log(finalSortedArray);
};

await main();
