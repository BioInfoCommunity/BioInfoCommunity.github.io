// Page titles for the highlights listing pages. Computed as plain values so the layout escapes them once.
module.exports = {
  eleventyComputed: {
    title: (data) =>
      data.np.filterId === "all" ? "Highlights | BioInfoCommunity" : `${data.np.label} highlights | BioInfoCommunity`,
  },
};
