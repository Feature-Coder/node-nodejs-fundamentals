import path from "path";
import { pathToFileURL } from "url";
import { PATHS } from "../shared/constants.js";
import { exists } from "../shared/fs-utils.js";

const dynamic = async () => {
  const rawPluginName = process.argv[2];
  const pluginName = rawPluginName?.replace(/\..*$/, "");

  if (!pluginName) {
    console.error("Plugin not found");
    process.exit(1);
  }

  const absolutePath = path.join(PATHS.plugins, `${pluginName}.js`);

  if (!(await exists(absolutePath))) {
    console.error("Plugin not found");
    process.exit(1);
  }

  try {
    const pluginURL = pathToFileURL(absolutePath).href;
    const module = await import(pluginURL);

    console.log(module.run());
  } catch (err) {
    console.error("Plugin not found");
    process.exit(1);
  }
};

await dynamic();
