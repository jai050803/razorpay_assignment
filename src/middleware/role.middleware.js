const { errorResponse } = require('../utils/response');

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, 'Forbidden', 403);
    }

    return next();
  };
};

module.exports = {
  requireRole,
};
