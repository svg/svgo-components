import * as fs from "fs/promises";
import * as path from "path";
import { convertSvgToJsx } from "./svgo-jsx.js";

const start = process.hrtime.bigint();

const commonTemplate = ({
  sourceFile,
  componentName,
  jsx,
}) => `// Generated from ${sourceFile}

export const ${componentName} = (props) => {
  return (
    ${jsx}
  );
}
`;

const reactNativeSvgTemplate = ({
  sourceFile,
  componentName,
  jsx,
  components,
}) => `// Generated from ${sourceFile}

import {${components.join(", ")}} from 'react-native-svg'

export const ${componentName} = (props) => {
  return (
    ${jsx}
  );
}
`;

const defaultTemplate = (options) => {
  if (options.target === "react-native-svg") {
    return reactNativeSvgTemplate(options);
  } else {
    return commonTemplate(options);
  }
};

const defaultTransformFilename = (filename) => {
  const basename = path.basename(filename, path.extname(filename));
  return basename + ".js";
};

const pascalcase = (string) => {
  return string
    .replace(/[^A-Z0-9]+([A-Z0-9])?/gi, (invalid, char) =>
      char == null ? "" : char.toUpperCase()
    )
    .replace(/^[a-z]/, (char) => char.toUpperCase());
};

const transformComponentName = (filename) => {
  const basename = path.basename(filename, path.extname(filename));
  // digits cannot start variable name
  return pascalcase(basename).replace(/^[0-9]/, (char) => `_${char}`);
};

const defaultSvgProps = { "{...props}": null };

const defaultPlugins = [
  {
    name: "preset-default",
    params: {
      overrides: {
        removeViewBox: false,
      },
    },
  },
  { name: "removeXMLNS" },
  { name: "prefixIds" },
];

const [rawConfigFile = "./svgo-jsx.config.js"] = process.argv.slice(2);
const configFile = path.isAbsolute(rawConfigFile)
  ? rawConfigFile
  : path.join(process.cwd(), rawConfigFile);
const configDir = path.dirname(configFile);
let count = 0;

const run = async () => {
  const { config } = await import(configFile);
  if (config.inputDir == null) {
    throw Error("inputDir string should be specified");
  }
  if (config.outputDir == null) {
    throw Error("output string should be specified");
  }

  const inputDir = path.join(configDir, config.inputDir);
  const outputDir = path.join(configDir, config.outputDir);
  const target = config.target ?? "react-dom";
  const svgProps = config.svgProps ?? defaultSvgProps;
  const plugins = config.plugins ?? defaultPlugins;
  const template = config.template ?? defaultTemplate;
  const transformFilename =
    config.transformFilename ?? defaultTransformFilename;
  const after = config.after;

  const list = await fs.readdir(inputDir, { withFileTypes: true });
  const targets = [];
  await Promise.all(
    list.map(async (dirent) => {
      if (dirent.isFile()) {
        count += 1;
        const svgFile = path.join(inputDir, dirent.name);
        const svg = await fs.readFile(svgFile, "utf-8");
        const { jsx, components } = convertSvgToJsx({
          target,
          file: path.relative(configDir, svgFile),
          svg,
          svgProps,
          plugins,
        });

        const componentName = transformComponentName(dirent.name);
        const jsxFilename = transformFilename(dirent.name);
        const jsxFile = path.join(outputDir, jsxFilename);
        const component = template({
          target,
          sourceFile: path.relative(configDir, svgFile),
          targetFile: path.relative(configDir, jsxFile),
          componentName,
          jsx,
          components,
        });
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(jsxFile, component);
        targets.push({
          file: jsxFilename,
          componentName,
        });
      }
    })
  );

  targets.sort((a, b) => a.file.localeCompare(b.file));

  await after?.({ targets });

  const end = process.hrtime.bigint();

  console.info(`Compiled ${count} icons in ${(end - start) / BigInt(1e6)}ms`);
};

(async () => {
  try {
    await run();
  } catch (error) {
    console.error(error);
  }
})();
