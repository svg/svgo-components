import { promises as fs } from "fs";
import util from "util";
import path from "path";
import { fileURLToPath } from "url";
import child_process from "child_process";

const exec = util.promisify(child_process.exec);
const dir = path.dirname(fileURLToPath(import.meta.url));

test("cli converts svg into component with default config", async () => {
  const cli = path.join(dir, "./svgo-jsx-cli.js");
  const config = path.join(dir, "./fixtures/svgo-jsx.config.js");
  const { stdout, stderr } = await exec(`node ${cli} ${config}`);
  expect(stderr).toBe("");
  expect(stdout).toMatch(/Compiled 1 icons in \d+ms/);
  expect(await fs.readFile(path.join(dir, "./fixtures/output/cog.js"), "utf-8"))
    .toMatchInlineSnapshot(`
    "// Generated from input/cog.svg

    export const Cog = (props) => {
      return (
        <svg width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" xmlns=\\"http://www.w3.org/2000/svg\\" {...props}><circle cx=\\"12\\" cy=\\"12\\" r=\\"10\\" /></svg>
      );
    }
    "
  `);
});
