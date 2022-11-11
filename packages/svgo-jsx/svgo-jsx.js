import { optimize } from "svgo";
import { parse, walk } from "css-tree";
import {
  reactAttributes,
  preactAttributes,
  reactNativeSvgTags,
} from "./mappings.js";

const targetPlugin = (target) => ({
  type: "visitor",
  name: "svgo-jsx-target",
  fn: () => {
    let mappings = null;
    if (target === "react-dom") {
      mappings = reactAttributes;
    }
    if (target === "preact") {
      mappings = preactAttributes;
    }
    if (mappings != null) {
      return {
        element: {
          enter: (node) => {
            const newAttributes = {};
            // preserve an order of attributes
            for (const [name, value] of Object.entries(node.attributes)) {
              newAttributes[mappings[name] || name] = value;
            }
            node.attributes = newAttributes;
          },
        },
      };
    }
    if (target === "react-native-svg") {
      return {
        element: {
          enter: (node, parentNode) => {
            if (reactNativeSvgTags[node.name] == null) {
              // remove unknown elements
              parentNode.children = parentNode.children.filter(
                (item) => item !== node
              );
            } else {
              node.name = reactNativeSvgTags[node.name];
              const newAttributes = {};
              // preserve an order of attributes
              for (const [name, value] of Object.entries(node.attributes)) {
                newAttributes[reactAttributes[name] || name] = value;
              }
              node.attributes = newAttributes;
            }
          },
        },
      };
    }
  },
});

const convertStyleProperty = (property) => {
  if (property.startsWith("--")) {
    return property;
  }
  // Microsoft vendor-prefixes are uniquely cased
  if (property.startsWith("-ms-")) {
    property = property.slice(1);
  }
  return property
    .toLowerCase()
    .replace(/-(\w|$)/g, (dashChar, char) => char.toUpperCase());
};

const convertStyleToObject = (style) => {
  const styleObject = {};
  const ast = parse(style, {
    context: "declarationList",
    parseValue: false,
  });
  walk(ast, (node) => {
    if (node.type === "Declaration") {
      styleObject[convertStyleProperty(node.property)] = node.value.value;
    }
  });
  return styleObject;
};

const convertAttributes = (node, parentNode, svgProps) => {
  const attributes = Object.entries(node.attributes);
  // use map to override existing attributes with passed props
  const props = new Map();
  for (const [name, value] of attributes) {
    if (name === "style") {
      const styleObject = convertStyleToObject(value);
      props.set(name, `{${JSON.stringify(styleObject)}}`);
      // skip attributes with namespaces which are invalid jsx syntax
    } else if (name.includes(":") === false) {
      props.set(name, JSON.stringify(value));
    }
  }
  if (parentNode.type === "root" && svgProps) {
    for (const [name, value] of Object.entries(svgProps)) {
      // delete previous prop before setting to reset order
      if (value == null) {
        props.delete(name);
        props.set(name, null);
      } else if (value.startsWith("{")) {
        props.delete(name);
        props.set(name, value);
      } else {
        props.delete(name);
        props.set(name, JSON.stringify(value));
      }
    }
  }
  let result = "";
  for (const [name, value] of props) {
    if (value == null) {
      result += ` ${name}`;
    } else {
      result += ` ${name}=${value}`;
    }
  }
  return result;
};

const convertXastToJsx = (node, parentNode, svgProps, components) => {
  switch (node.type) {
    case "root": {
      let renderedChildren = "";
      let renderedChildrenCount = 0;
      for (const child of node.children) {
        const renderedChild = convertXastToJsx(
          child,
          node,
          svgProps,
          components
        );
        if (renderedChild.length !== 0) {
          renderedChildren += renderedChild;
          renderedChildrenCount += 1;
        }
      }
      if (renderedChildrenCount === 1) {
        return renderedChildren;
      } else {
        return `<>${renderedChildren}</>`;
      }
    }
    case "element": {
      const name = node.name;
      // collect all components names
      if (name.startsWith(name[0].toUpperCase())) {
        components.add(name);
      }
      const attributes = convertAttributes(node, parentNode, svgProps);
      if (node.children.length === 0) {
        return `<${name}${attributes} />`;
      }
      let renderedChildren = "";
      for (const child of node.children) {
        renderedChildren += convertXastToJsx(child, node, svgProps, components);
      }
      return `<${name}${attributes}>${renderedChildren}</${name}>`;
    }
    case "text":
      return `{${JSON.stringify(node.value)}}`;

    case "cdata":
      return `{${JSON.stringify(node.value)}}`;
    case "comment":
      return `{/* ${node.value} */}`;
    case "doctype":
      return "";
    case "instruction":
      return "";
    default:
      throw Error(`Unexpected node type "${node.type}"`);
  }
};

const validTargets = ["react-dom", "react-native-svg", "preact", "custom"];

export const convertSvgToJsx = ({
  target = "react-dom",
  file,
  svg,
  svgProps,
  plugins = [],
}) => {
  let xast;
  const extractXastPlugin = {
    type: "visitor",
    name: "svgo-jsx-extract-xast",
    fn: (root) => {
      xast = root;
      return {};
    },
  };

  if (validTargets.includes(target) === false) {
    throw Error(
      `Target "${target}" is not valid. ` +
        `Use one of the following: ${validTargets.join(", ")}.`
    );
  }

  const { error } = optimize(svg, {
    path: file,
    plugins: [...plugins, targetPlugin(target), extractXastPlugin],
  });
  if (error) {
    throw Error(error);
  }
  try {
    const components = new Set();
    const jsx = convertXastToJsx(xast, null, svgProps, components);
    return {
      jsx,
      components: Array.from(components),
    };
  } catch (error) {
    throw Error(`${error.message}\nin ${file}`);
  }
};
