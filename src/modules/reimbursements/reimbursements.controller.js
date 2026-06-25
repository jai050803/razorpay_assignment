const reimbursementsService = require('./reimbursements.service');
const { successResponse, errorResponse } = require('../../utils/response');

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message = error.statusCode ? error.message : 'Internal server error';

  return errorResponse(res, message, statusCode);
};

const createReimbursement = async (req, res) => {
  try {
    const reimbursement = await reimbursementsService.createReimbursement({
      userId: req.user.id,
      title: req.body.title,
      description: req.body.description,
      amount: req.body.amount,
    });

    return successResponse(res, { reimbursement }, 201);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createReimbursement,
};
