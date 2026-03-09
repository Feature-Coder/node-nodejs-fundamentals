import { Transform } from "stream";

export const lineNumberer = () => {
  let lineNumber = 1;
  let leftover = "";

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      const lines = (leftover + chunk.toString()).split("\n");
      leftover = lines.pop();

      for (const line of lines) {
        this.push(`${lineNumber} | ${line}\n`);
        lineNumber++;
      }

      callback();
    },
    flush(callback) {
      if (leftover) {
        this.push(`${lineNumber} | ${leftover}`);
      }
      callback();
    },
  });

  process.stdin.pipe(transformStream).pipe(process.stdout);
};

lineNumberer();
