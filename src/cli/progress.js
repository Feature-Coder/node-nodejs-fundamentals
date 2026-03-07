const parseCliOptions = () => {
  const args = process.argv.slice(2);
  const getValue = (flag, defaultValue) => {
    const index = args.indexOf(flag);
    return index !== -1 ? args[index + 1] : defaultValue;
  };

  return {
    totalDuration: parseInt(getValue("--duration", 5000)),
    stepInterval: parseInt(getValue("--interval", 100)),
    barVisualLength: parseInt(getValue("--length", 30)),
    hexColor: getValue("--color", null),
  };
};

const createColorSequence = (rawHex) => {
  if (!rawHex) return "";

  const cleanHex = rawHex.replace(/['"#]/g, "");

  if (!/^[A-Fa-f0-9]{6}$/.test(cleanHex)) return "";

  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  return `\x1b[38;2;${r};${g};${b}m`;
};

const startProgressBar = () => {
  const options = parseCliOptions();
  const colorStart = createColorSequence(options.hexColor);
  console.log(colorStart);
  const colorReset = "\x1b[0m";

  let timePassed = 0;

  const timer = setInterval(() => {
    timePassed += options.stepInterval;

    const currentProgress = Math.min(timePassed / options.totalDuration, 1);
    const percentage = Math.floor(currentProgress * 100);

    const filledCount = Math.floor(currentProgress * options.barVisualLength);
    const emptyCount = options.barVisualLength - filledCount;

    const filledBlock = "\u2588".repeat(filledCount);
    const emptyBlock = " ".repeat(emptyCount);

    const barOutput = colorStart
      ? `${colorStart}${filledBlock}${colorReset}${emptyBlock}`
      : `${filledBlock}${emptyBlock}`;
    process.stdout.write(`\r[${barOutput}] ${percentage}%`);

    if (timePassed >= options.totalDuration) {
      clearInterval(timer);
      process.stdout.write("\nDone!\n");
    }
  }, options.stepInterval);
};

startProgressBar();
