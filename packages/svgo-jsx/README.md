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

**template**

TODO

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

**transformFilename**: optional `(string) => string`

Default `*.js`

This function accepts `*.svg` basepath and transforms into whatever format you like.

**plugins**

TODO

## API

TODO
