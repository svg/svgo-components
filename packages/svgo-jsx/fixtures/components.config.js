const template = ({
  sourceFile,
  componentName,
  jsx,
  components,
}) => `// Generated from ${sourceFile}

import {${components.join(", ")}} from 'react-custom'

export const ${componentName} = (props) => {
  return (
    ${jsx}
  );
}
`;

export const config = {
  inputDir: "./input",
  outputDir: "./output-components",
  template,
  plugins: [
    {
      name: "capital-tags",
      fn: () => {
        return {
          element: {
            enter: (node) => {
              if (node.name === "svg") {
                node.name = "Svg";
              }
              if (node.name === "circle") {
                node.name = "Circle";
              }
            },
          },
        };
      },
    },
  ],
};
