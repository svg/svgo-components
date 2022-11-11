import type { Config as SvgoConfig } from "svgo";

type Target = "react-dom" | "react-native-svg" | "preact" | "custom";

type SvgProps = Record<string, null | string>;

type Options = {
  file: string;
  svg: string;
  target?: Target;
  svgProps?: SvgProps;
  plugins?: SvgoConfig["plugins"];
};

type Output = {
  jsx: string;
  components: string[];
};

export declare function convertSvgToJsx(options: Options): Output;

type TemplateOptions = {
  target: Target;
  sourceFile: string;
  targetFile: string;
  componentName: string;
  jsx: string;
  components: string[];
};

type AfterOptions = {
  targets: Array<{
    file: string;
    componentName: string;
  }>;
};

export type Config = {
  inputDir: string;
  outputDir: string;
  target?: Target;
  svgProps?: SvgProps;
  plugins?: SvgoConfig["plugins"];
  template?: (options: TemplateOptions) => string;
  transformFilename?: (file: string) => string;
  after?: AfterOptions;
};
