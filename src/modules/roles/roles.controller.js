const rolesService = require('./roles.service');
const { successResponse, errorResponse } = require('../../utils/response');

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message = error.statusCode ? error.message : 'Internal server error';

  return errorResponse(res, message, statusCode);
};

const assignRole = async (req, res) => {
  try {
    const user = await rolesService.assignRole(req.body);
    return successResponse(res, user);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  assignRole,
};
