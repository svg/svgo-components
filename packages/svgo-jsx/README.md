# @svgo/jsx

Transform SVG into JSX components

## Usage

Create svgo-jsx.config.js module

```js
export const config = {
  inputDir: "./svgs",
  outputDir: "./icons",
};
```

or in commonjs project

```js
exports.config = {
  inputDir: "./svgs",
  outputDir: "./icons",
};
```

Install and run

```
yarn add @svgo/jsx --dev
yarn svgo-jsx
```

You can also specify own config file

```
yarn svgo-jsx icons.config.mjs
```

## Differences from SVGR

- much smaller install size (4.30MB vs 34MB)
- 4x better performance
- svgr is built around babel plugins which is the source of problems above

SVGR heavily inspired this project. Svgo-jsx has less features out of the box
and focused on simple task to convert SVGO to JSX.

## Config

**inputDir**: required string

A path relative to config file with SVG files.

**outputDir**: required string

A path relative to config svgo-jsx will write generated components into.

**target**: optional "react-dom" or "preact"

Default: "react-dom"

Frameworks handle attributes differently. React requires camelised "xlink:href", preact prefer modern "href". Here you can specify desired framework.

**template**: optional function

```js
({
  sourceFile: string,
  targetFile: string,
  componentName: string,
  jsx: string,
}) => string;
```

Default:

```js
({ sourceFile, componentName, jsx }) => `// Generated from ${sourceFile}

export const ${componentName} = (props) => {
  return (
    ${jsx}
  );
}
`;
```

**svgProps**: optional object

Default: `{ "{...props}": null }`

A set of props to extend `<svg>` element. There are three ways to specify props

- as string value
- as dynamic prop with expression
- as object spread

```json
{
  "fill": "black",
  "width": "{width ?? 24}",
  "{...props}": null
}
```

**transformFilename**: optional function

```js
(string) => string;
```

Default: converts `*.svg` into `*.js`

This function accepts `*.svg` basepath and transforms into whatever format you like.

**plugins**

Default:

```js
extendDefaultPlugins([
  // prevents collision with other components on the page
  { name: "prefixIds", active: true },
  // makes icons scaled into width/height box
  { name: "removeViewBox", active: false },
]);
```

SVGO plugins option to enable optimisations

## API

### convertSvgToJsx

```js
({ file: string, svg: string, svgProps, plugins = [] }) => string;
```

Produces jsx without component wrapper.

- target: same string as above
- file: used for error reporting
- svg: string with svg file content
- svgProps: same object as above without any default
- plugins: svgo plugins array without any default

## License and Copyright

This software is released under the terms of the MIT license.
