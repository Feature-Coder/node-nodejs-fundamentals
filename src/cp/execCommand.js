import { spawn } from "child_process";

export const execCommand = () => {
  const commandString = process.argv[2];

  if (!commandString) {
    console.error(
      "Please provide a command, e.g., node execCommand.js 'ls -la'",
    );
    process.exit(1);
  }

  const [command, ...args] = commandString.split(" ");

  const child = spawn(command, args, {
    env: process.env,
  });

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  child.on("exit", (code) => {
    process.exit(code !== null ? code : 1);
  });

  child.on("error", (error) => {
    console.error(`Spawn error: ${error.message}`);
    process.exit(1);
  });
};

execCommand();
