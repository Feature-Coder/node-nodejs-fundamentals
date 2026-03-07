import { Transform } from "stream";

export const filter = () => {
  const args = process.argv.slice(2);
  const patternIndex = args.indexOf("--pattern");

  if (patternIndex === -1 || !args[patternIndex + 1]) {
    console.error("Please provide a pattern, e.g., --pattern <string>");
    process.exit(1);
  }

  const pattern = args[patternIndex + 1];
  let leftover = "";

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      const lines = (leftover + chunk.toString()).split("\n");
      leftover = lines.pop();

      for (const line of lines) {
        if (line.includes(pattern)) {
          this.push(`${line}\n`);
        }
      }

      callback();
    },
    flush(callback) {
      if (leftover && leftover.includes(pattern)) {
        this.push(leftover);
      }
      callback();
    },
  });

  process.stdin.pipe(transformStream).pipe(process.stdout);
};

filter();
