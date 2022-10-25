module.exports = (url) => {
  return url.slice(url.indexOf("aws.com/") + 8);
};
