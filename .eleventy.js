module.exports = function (eleventyConfig) {
  // Only Nunjucks and Markdown are templates. Plain HTML is copied as-is.
  eleventyConfig.setTemplateFormats(["njk", "md"]);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Remove trailing spaces left by template tags in generated HTML.
  eleventyConfig.addTransform("trim-trailing-whitespace", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      return content.replace(/[ \t]+$/gm, "");
    }
    return content;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
  };
};
