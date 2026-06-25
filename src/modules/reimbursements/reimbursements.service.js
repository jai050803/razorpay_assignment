const { pool } = require('../../config/db');
const { STATUSES } = require('../../utils/constants');

class ServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const mapReimbursementResponse = (reimbursement) => ({
  title: reimbursement.title,
  description: reimbursement.description,
  amount: Number(reimbursement.amount),
  status: reimbursement.status,
});

const createReimbursement = async ({ userId, title, description, amount }) => {
  if (!title) {
    throw new ServiceError('title is required', 400);
  }

  if (!description) {
    throw new ServiceError('description is required', 400);
  }

  if (amount === undefined || amount === null || amount === '') {
    throw new ServiceError('amount is required', 400);
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ServiceError('amount must be a positive number', 400);
  }

  const result = await pool.query(
    `
      INSERT INTO reimbursements (
        user_id,
        title,
        description,
        amount,
        status,
        rm_approved,
        ape_approved
      )
      VALUES ($1, $2, $3, $4, $5, false, false)
      RETURNING title, description, amount, status
    `,
    [userId, title, description, numericAmount, STATUSES.PENDING]
  );

  return mapReimbursementResponse(result.rows[0]);
};

module.exports = {
  ServiceError,
  createReimbursement,
};
