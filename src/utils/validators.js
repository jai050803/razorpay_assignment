const isOrgEmail = (email) => {
  return typeof email === 'string' && email.endsWith('@org.com');
};

module.exports = {
  isOrgEmail,
};
