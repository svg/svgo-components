import prettier from "prettier";
import { convertSvgToJsx } from "./svgo-jsx.js";

const convertAndFormat = (options) => {
  return prettier.format(convertSvgToJsx(options), { parser: "babel" });
};

test("render all nodes except doctype and instruction", () => {
  expect(
    convertAndFormat({
      file: "./test.svg",
      svg: `
        <?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
        <svg version="1.1" width="24" height="24" viewBox="0 0 24 24">
          <!-- test rectangle -->
          <rect x="0" y="0" width="24" height="24" />
        </svg>
      `,
    })
  ).toMatchInlineSnapshot(`
    "<svg version=\\"1.1\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\">
      {/* test rectangle */}
      <rect x=\\"0\\" y=\\"0\\" width=\\"24\\" height=\\"24\\" />
    </svg>;
    "
  `);
});

test("wrap with fragment when toplevel comment is present", () => {
  expect(
    convertAndFormat({
      file: "./test.svg",
      svg: `
        <!-- top level comment -->
        <svg></svg>
      `,
    })
  ).toMatchInlineSnapshot(`
    "<>
      {/* top level comment */}
      <svg />
    </>;
    "
  `);
});

test.todo("render text and cdata properly");

test("convert style attribute with proper prefixes", () => {
  expect(
    convertAndFormat({
      file: "./test.svg",
      svg: `
        <svg>
          <rect x="0" y="0" width="24" height="24" style="fill: #000; fill-opacity: 0.5" />
          <rect x="0" y="0" width="24" height="24" style="-webkit-appearance: none; -moz-appearance: none; -ms-appearance: none;" />
          <rect x="0" y="0" width="24" height="24" style="--custom: #000" />
        </svg>
      `,
    })
  ).toMatchInlineSnapshot(`
    "<svg>
      <rect
        x=\\"0\\"
        y=\\"0\\"
        width=\\"24\\"
        height=\\"24\\"
        style={{ fill: \\"#000\\", fillOpacity: \\"0.5\\" }}
      />
      <rect
        x=\\"0\\"
        y=\\"0\\"
        width=\\"24\\"
        height=\\"24\\"
        style={{
          WebkitAppearance: \\"none\\",
          MozAppearance: \\"none\\",
          msAppearance: \\"none\\",
        }}
      />
      <rect x=\\"0\\" y=\\"0\\" width=\\"24\\" height=\\"24\\" style={{ \\"--custom\\": \\"#000\\" }} />
    </svg>;
    "
  `);
});

test("convert attribute names", () => {
  expect(
    convertAndFormat({
      file: "./test.svg",
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24">
          <rect x="0" y="0" width="24" height="24" fill-opacity="0.5" />
        </svg>
      `,
    })
  ).toMatchInlineSnapshot(`
    "<svg
      xmlns=\\"http://www.w3.org/2000/svg\\"
      xmlnsXlink=\\"http://www.w3.org/1999/xlink\\"
      version=\\"1.1\\"
      width=\\"24\\"
      height=\\"24\\"
      viewBox=\\"0 0 24 24\\"
    >
      <rect x=\\"0\\" y=\\"0\\" width=\\"24\\" height=\\"24\\" fillOpacity=\\"0.5\\" />
    </svg>;
    "
  `);
});

test("preserve aria-*, data-* and unknown attributes", () => {
  expect(
    convertAndFormat({
      file: "./test.svg",
      svg: `
        <svg aria-label="icon" data-value="1" custom-attr="value"></svg>
      `,
    })
  ).toMatchInlineSnapshot(`
    "<svg aria-label=\\"icon\\" data-value=\\"1\\" custom-attr=\\"value\\" />;
    "
  `);
});

test("allow to pass and spread svg props", () => {
  expect(
    convertAndFormat({
      file: "./test.svg",
      svg: `
        <svg width="24" height="24" viewBox="0 0 24 24">
          <rect x="0" y="0" width="24" height="24" />
        </svg>
      `,
      svgProps: {
        "{...defaults}": null,
        className: "{className}",
        fill: "#000",
        "{...props}": null,
      },
    })
  ).toMatchInlineSnapshot(`
    "<svg
      width=\\"24\\"
      height=\\"24\\"
      viewBox=\\"0 0 24 24\\"
      {...defaults}
      className={className}
      fill=\\"#000\\"
      {...props}
    >
      <rect x=\\"0\\" y=\\"0\\" width=\\"24\\" height=\\"24\\" />
    </svg>;
    "
  `);
});

test("override existing svg attributes with passed props", () => {
  expect(
    convertAndFormat({
      file: "./test.svg",
      svg: `
        <svg width="24" height="24" viewBox="0 0 24 24">
          <rect x="0" y="0" width="24" height="24" />
        </svg>
      `,
      svgProps: {
        width: "{size}",
      },
    })
  ).toMatchInlineSnapshot(`
    "<svg height=\\"24\\" viewBox=\\"0 0 24 24\\" width={size}>
      <rect x=\\"0\\" y=\\"0\\" width=\\"24\\" height=\\"24\\" />
    </svg>;
    "
  `);
});

test("allow to pass svgo plugins", () => {
  expect(
    convertSvgToJsx({
      file: "./test.svg",
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24">
          <rect x="0" y="0" width="24" height="24" />
        </svg>
      `,
      plugins: ["preset-default"],
    })
  ).toMatchInlineSnapshot(
    `"<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\"><path d=\\"M0 0h24v24H0z\\" /></svg>"`
  );
});

test("support preact and ignores namespaced attributes", () => {
  expect(
    convertAndFormat({
      target: "preact",
      file: "./test.svg",
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24" xmlns:title="Title">
          <rect x="0" y="0" width="24" height="24" fill-opacity="0.5" />
          <use xlink:href="#id" />
        </svg>
      `,
    })
  ).toMatchInlineSnapshot(`
    "<svg
      xmlns=\\"http://www.w3.org/2000/svg\\"
      version=\\"1.1\\"
      width=\\"24\\"
      height=\\"24\\"
      viewBox=\\"0 0 24 24\\"
    >
      <rect x=\\"0\\" y=\\"0\\" width=\\"24\\" height=\\"24\\" fill-opacity=\\"0.5\\" />
      <use href=\\"#id\\" />
    </svg>;
    "
  `);
});
