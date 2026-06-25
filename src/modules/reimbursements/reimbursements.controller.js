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

const listReimbursements = async (req, res) => {
  try {
    const reimbursements = await reimbursementsService.listReimbursements(req.user);
    return successResponse(res, { reimbursements });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateStatus = async (req, res) => {
  try {
    const reimbursement = await reimbursementsService.updateReimbursementStatus({
      reimbursementId: req.body.reimbursementId,
      status: req.body.status,
      requestingUser: req.user,
    });

    return successResponse(res, { reimbursement });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createReimbursement,
  listReimbursements,
  updateStatus,
};
