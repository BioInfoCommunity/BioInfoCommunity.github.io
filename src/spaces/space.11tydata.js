// Page title and description come from the space itself. Computed as plain values,
// so the layout escapes them once.
module.exports = {
  eleventyComputed: {
    title: (data) => `${data.space.title} | BioInfoCommunity`,
    description: (data) => data.space.description,
  },
};
