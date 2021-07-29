import { promises as fs } from "fs";
import path from "path";
import { extendDefaultPlugins } from "svgo";
import { convertSvgToJsx } from "./svgo-jsx.js";

const start = process.hrtime.bigint();

const defaultTemplate = ({
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

const [rawConfigFile = "./svgo-jsx.config.js"] = process.argv.slice(2);
const configFile = path.isAbsolute(rawConfigFile)
  ? rawConfigFile
  : path.join(process.cwd(), rawConfigFile);
const configDir = path.dirname(configFile);
let count = 0;

const cwd = process.cwd();
const { config } = await import(configFile);
if (config.inputDir == null) {
  throw Error("inputDir string should be specified");
}
if (config.outputDir == null) {
  throw Error("output string should be specified");
}

const inputDir = path.join(configDir, config.inputDir);
const outputDir = path.join(configDir, config.outputDir);

const list = await fs.readdir(inputDir, { withFileTypes: true });
await Promise.all(
  list.map(async (dirent) => {
    if (dirent.isFile()) {
      count += 1;
      const svgFile = path.join(inputDir, dirent.name);
      const svg = await fs.readFile(svgFile, "utf-8");
      const jsx = convertSvgToJsx({
        file: path.relative(configDir, svgFile),
        svg,
        svgProps: config.svgProps || { "{...props}": null },
        plugins: config.plugins || extendDefaultPlugins([]),
      });

      const template = config.template || defaultTemplate;
      const transformFilename =
        config.transformFilename || defaultTransformFilename;
      const componentName = transformComponentName(dirent.name);
      const jsxFilename = transformFilename(dirent.name);
      const jsxFile = path.join(outputDir, jsxFilename);
      const component = template({
        sourceFile: path.relative(configDir, svgFile),
        targetFile: path.relative(configDir, jsxFile),
        componentName,
        jsx,
      });
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(jsxFile, component);
    }
  })
);

const end = process.hrtime.bigint();

console.info(`Compiled ${count} icons in ${(end - start) / BigInt(1e6)}ms`);
