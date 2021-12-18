import { promises as fs } from "fs";
import util from "util";
import path from "path";
import { fileURLToPath } from "url";
import child_process from "child_process";
import prettier from "prettier";

const exec = util.promisify(child_process.exec);
const dir = path.dirname(fileURLToPath(import.meta.url));

test("cli converts svg into component with default config", async () => {
  const cli = path.join(dir, "./svgo-jsx-cli.js");
  const config = path.join(dir, "./fixtures/svgo-jsx.config.js");
  const { stdout, stderr } = await exec(`node ${cli} ${config}`);
  expect(stderr).toBe("");
  expect(stdout).toMatch(/Compiled 1 icons in \d+ms/);
  const generatedFile = path.join(dir, "./fixtures/output/cog.js");
  const generated = prettier.format(await fs.readFile(generatedFile, "utf-8"), {
    filepath: generatedFile,
  });
  expect(generated).toMatchInlineSnapshot(`
"// Generated from input/cog.svg

export const Cog = (props) => {
  return (
    <svg width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" {...props}>
      <circle cx=\\"12\\" cy=\\"12\\" r=\\"10\\" fill=\\"url(#cog_svg__a)\\" />
      <defs>
        <linearGradient
          id=\\"cog_svg__a\\"
          x1=\\"4.083\\"
          y1=\\"23.97\\"
          x2=\\"23.15\\"
          y2=\\"4.904\\"
          gradientUnits=\\"userSpaceOnUse\\"
        >
          <stop stopColor=\\"#00C1DE\\" />
          <stop offset=\\"1\\" stopColor=\\"#00C1DE\\" stopOpacity=\\"0\\" />
        </linearGradient>
      </defs>
    </svg>
  );
};
"
`);
});

test("jsx components list is passed to template", async () => {
  const cli = path.join(dir, "./svgo-jsx-cli.js");
  const config = path.join(dir, "./fixtures/components.config.js");
  const { stdout, stderr } = await exec(`node ${cli} ${config}`);
  expect(stderr).toBe("");
  expect(stdout).toMatch(/Compiled 1 icons in \d+ms/);
  const generatedFile = path.join(dir, "./fixtures/output-components/cog.js");
  const generated = prettier.format(await fs.readFile(generatedFile, "utf-8"), {
    filepath: generatedFile,
  });
  expect(generated).toMatchInlineSnapshot(`
"// Generated from input/cog.svg

import { Svg, Circle } from \\"react-custom\\";

export const Cog = (props) => {
  return (
    <Svg
      fill=\\"black\\"
      width=\\"24\\"
      height=\\"24\\"
      viewBox=\\"0 0 24 24\\"
      version=\\"1.1\\"
      xmlns=\\"http://www.w3.org/2000/svg\\"
      xmlnsXlink=\\"http://www.w3.org/1999/xlink\\"
    >
      <g>
        <Circle cx=\\"12\\" cy=\\"12\\" r=\\"10\\" fill=\\"url(#gradient)\\" />
      </g>
      <defs>
        <linearGradient
          id=\\"gradient\\"
          x1=\\"4.083\\"
          y1=\\"23.97\\"
          x2=\\"23.15\\"
          y2=\\"4.904\\"
          gradientUnits=\\"userSpaceOnUse\\"
        >
          <stop stopColor=\\"#00C1DE\\" />
          <stop offset=\\"1\\" stopColor=\\"#00C1DE\\" stopOpacity=\\"0\\" />
        </linearGradient>
      </defs>
    </Svg>
  );
};
"
`);
});
