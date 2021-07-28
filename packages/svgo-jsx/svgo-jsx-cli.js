import fs from 'fs/promises';
import path from 'path';
import { extendDefaultPlugins } from 'svgo';
import { convertSvgToJsx } from './svgo-jsx.js';

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

const defaultTransformFilename = filename => {
  const basename = path.basename(filename, path.extname(filename));
  return basename + '.js';
};

const pascalcase = string => {
  return string
    .replace(/[^A-Z0-9]+([A-Z0-9])?/gi, (invalid, char) =>
      char == null ? '' : char.toUpperCase(),
    )
    .replace(/^[a-z]/, char => char.toUpperCase());
};

const transformComponentName = filename => {
  const basename = path.basename(filename, path.extname(filename));
  // digits cannot start variable name
  return pascalcase(basename).replace(/^[0-9]/, char => `_${char}`);
};

const start = process.hrtime.bigint();
const [configFile] = process.argv.slice(2);
let count = 0;

const cwd = process.cwd();
const { config } = await import(
  configFile ?? path.join(cwd, './svgo-jsx.config.js')
);
if (config.inputDir == null) {
  throw Error('inputDir string should be specified');
}
if (config.outputDir == null) {
  throw Error('output string should be specified');
}

const list = await fs.readdir(path.join(cwd, config.inputDir), {
  withFileTypes: true,
});
await Promise.all(
  list.map(async dirent => {
    if (dirent.isFile()) {
      count += 1;
      const svgFile = path.join(config.inputDir, dirent.name);
      const svg = await fs.readFile(path.join(cwd, svgFile), 'utf-8');
      const jsx = convertSvgToJsx({
        file: svgFile,
        svg,
        svgProps: config.svgProps ?? { '{...props}': null },
        plugins: config.plugins ?? extendDefaultPlugins([]),
      });

      const template = config.template ?? defaultTemplate;
      const transformFilename =
        config.transformFilename ?? defaultTransformFilename;
      const componentName = transformComponentName(dirent.name);
      const jsxFilename = transformFilename(dirent.name);
      const jsxFile = path.join(config.outputDir, jsxFilename);
      const component = template({
        sourceFile: svgFile,
        targetFile: jsxFile,
        componentName,
        jsx,
      });
      await fs.mkdir(path.join(cwd, config.outputDir), { recursive: true });
      await fs.writeFile(path.join(cwd, jsxFile), component);
    }
  }),
);

const end = process.hrtime.bigint();

console.info(`Compiled ${count} icons in ${(end - start) / BigInt(1e6)}ms`);
