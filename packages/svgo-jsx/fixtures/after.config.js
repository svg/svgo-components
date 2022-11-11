export const config = {
  inputDir: "./input",
  outputDir: "./output-components",
  after: async ({ targets }) => {
    console.info("===start===");
    console.info(targets);
    console.info("===end===");
  },
};
