import { readdir, access } from "fs/promises";
import path from "path";

const findByExt = async () => {
  const workspacePath = path.resolve(import.meta.dirname, "../../workspace");
  const args = process.argv.slice(2);
  let targetExt = ".txt";

  const extIndex = args.indexOf("--ext");

  if (
    extIndex !== -1 &&
    args[extIndex + 1] &&
    !args[extIndex + 1].startsWith("-")
  ) {
    targetExt = args[extIndex + 1];
  }

  if (!targetExt.startsWith(".")) targetExt = `.${targetExt}`;

  try {
    await access(workspacePath);

    const files = await searchFiles(workspacePath, workspacePath, targetExt);

    files.sort().forEach((filePath) => console.log(filePath));
  } catch (error) {
    throw new Error("FS operation failed");
  }
};

async function searchFiles(currentPath, rootPath, targetExt, accumulator = []) {
  const files = await readdir(currentPath, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(currentPath, file.name);

    if (file.isDirectory()) {
      await searchFiles(fullPath, rootPath, targetExt, accumulator);
    } else {
      if (path.extname(file.name) === targetExt) {
        const relativePath = path
          .relative(rootPath, fullPath)
          .split(path.sep)
          .join("/");
        accumulator.push(relativePath);
      }
    }
  }
  return accumulator;
}

await findByExt();
