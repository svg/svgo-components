# @svgo/jsx

Transform SVG into JSX components

Currently supported targets:

- react-dom

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

## Config

**inputDir**: required string

A path relative to config file with SVG files.

**outputDir**: required string

A path relative to config svgo-jsx will write generated components into.

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

- file: used for error reporting
- svg: string with svg file content
- svgProps: same object as above without any default
- plugins: svgo plugins array without any default
