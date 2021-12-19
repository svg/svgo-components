import { optimize } from "svgo";
import csstree from "css-tree";
import { attributesMappings } from "./mappings.js";

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
  const ast = csstree.parse(style, {
    context: "declarationList",
    parseValue: false,
  });
  csstree.walk(ast, (node) => {
    if (node.type === "Declaration") {
      styleObject[convertStyleProperty(node.property)] = node.value.value;
    }
  });
  return styleObject;
};

const convertAttributes = (node, target, svgProps) => {
  const attributes = Object.entries(node.attributes);
  // use map to override existing attributes with passed props
  const props = new Map();
  for (const [name, value] of attributes) {
    let newName = name;
    if (target === "react-dom") {
      newName = attributesMappings[name] || name;
    }
    if (target === "preact") {
      if (name === "xlink:href") {
        newName = "href";
      }
    }
    if (newName === "style") {
      const styleObject = convertStyleToObject(value);
      props.set(newName, `{${JSON.stringify(styleObject)}}`);
      // skip attributes with namespaces which are invalid jsx syntax
    } else if (newName.includes(":") === false) {
      props.set(newName, JSON.stringify(value));
    }
  }
  if (node.name === "svg" && svgProps) {
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

const convertXastToJsx = (node, target, svgProps, components) => {
  switch (node.type) {
    case "root": {
      let renderedChildren = "";
      let renderedChildrenCount = 0;
      for (const child of node.children) {
        const renderedChild = convertXastToJsx(
          child,
          target,
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
      const attributes = convertAttributes(node, target, svgProps);
      if (node.children.length === 0) {
        return `<${name}${attributes} />`;
      }
      let renderedChildren = "";
      for (const child of node.children) {
        renderedChildren += convertXastToJsx(
          child,
          target,
          svgProps,
          components
        );
      }
      return `<${name}${attributes}>${renderedChildren}</${name}>`;
    }
    case "text":
      throw Error("Text is not supported yet");
    // return `{${JSON.stringify(node.value)}}`;

    case "cdata":
      throw Error("CDATA is not supported yet");
    // return `{${JSON.stringify(node.value)}}`;
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

const validTargets = ["react-dom", "preact"];

export const convertSvgToJsx = ({
  target = "react-dom",
  file,
  svg,
  svgProps,
  plugins = [],
}) => {
  let xast;
  const extractXast = {
    type: "visitor",
    name: "svgo-jsx-extract-xast",
    active: true,
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
    plugins: [...plugins, extractXast],
  });
  if (error) {
    throw Error(error);
  }
  try {
    const components = new Set();
    const jsx = convertXastToJsx(xast, target, svgProps, components);
    return {
      jsx,
      components: Array.from(components),
    };
  } catch (error) {
    throw Error(`${error.message}\nin ${file}`);
  }
};
