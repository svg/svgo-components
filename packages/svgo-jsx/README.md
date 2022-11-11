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

**target**: optional "react-dom", "react-native-svg", "preact" or "custom"

Default: "react-dom"

Frameworks handle attributes differently. React requires camelised "xlink:href", preact prefer modern "href". Here you can specify desired framework.

"custom" target does not transform tags and attributes and allows to write svgo plugin
to generate components for custom renerer.

**template**: optional function

```js
({
  target: Target,
  sourceFile: string,
  targetFile: string,
  componentName: string,
  jsx: string,
  components: string[]
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
[
  {
    name: "preset-default",
    params: {
      overrides: {
        // makes icons scaled into width/height box
        removeViewBox: false,
      },
    },
  },
  // removes xmlns namespace unnecessary when svg is inlined into html
  { name: "removeXMLNS" },
  // prevents collision with other components on the page
  { name: "prefixIds" },
]
```

SVGO plugins option to enable optimisations

## API

### convertSvgToJsx

```js
({ target: Target, file: string, svg: string, svgProps, plugins = [] }) => {
  jsx: string,
  components: string[]
};
```

Produces jsx without component wrapper and list of components (capitalized tags).

- target: same string as above
- file: used for error reporting
- svg: string with svg file content
- svgProps: same object as above without any default
- plugins: svgo plugins array without any default

## Working with custom renderer

Custom renderer is a SVGO plugin which prepares jsx to any not supported out of the box renderers
by converting tag names and attributes.

```js
const customTargetPlugin = {
  type: "visitor",
  name: "svgo-jsx-custom",
  fn: () => {
    const customTags = {
      svg: "Svg"
    }
    const customAttributes = {
      "xlink:href": "xlinkHref"
    }
    return {
      element: {
        enter: (node) => {
          node.name = customTags[node.name] ?? node.name;
          // attributes recreation is used to preserve order
          const newAttributes = {};
          for (const [name, value] of Object.entries(node.attributes)) {
            newAttributes[customAttributes[name] ?? name] = value;
          }
          node.attributes = newAttributes;
        },
      },
    };
  },
};

const template = ({ componentName, jsx, components }) => `
import {${components.join(", ")}} from 'react-custom'

export const ${componentName} = () => {
  return (
    ${jsx}
  );
}
`;

export const config = {
  ...
  target: 'custom',
  template,
  plugins: [
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
    customTargetPlugin
  ]
};
```

## How to generate index.js if you really need it

```js
export const config = {
  after: async ({ targets }) => {
    let result = ''
    for (const { file, componentName } of targets) {
      result += `export { ${componentName} } from './${file}'\n`
    }
    await fs.writeFile('icons/index.js', result)
  }
}
```


## License and Copyright

This software is released under the terms of the MIT license.
