const employeesService = require('./employees.service');
const { successResponse, errorResponse } = require('../../utils/response');

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message = error.statusCode ? error.message : 'Internal server error';

  return errorResponse(res, message, statusCode);
};

const listEmployees = async (req, res) => {
  try {
    const users = await employeesService.listEmployees(req.user);
    return successResponse(res, { users });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  listEmployees,
};
