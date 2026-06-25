const { pool } = require('../../config/db');
const { ROLES, STATUSES } = require('../../utils/constants');

class ServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const mapReimbursementResponse = (reimbursement) => ({
  reimbursementId: reimbursement.id,
  title: reimbursement.title,
  description: reimbursement.description,
  amount: Number(reimbursement.amount),
  status: reimbursement.status,
  rmApproved: reimbursement.rm_approved,
  apeApproved: reimbursement.ape_approved,
});

const validateApprovalRequest = ({ reimbursementId, status }) => {
  if (!reimbursementId) {
    throw new ServiceError('reimbursementId is required', 400);
  }

  if (!status) {
    throw new ServiceError('status is required', 400);
  }

  if (![STATUSES.APPROVED, STATUSES.REJECTED].includes(status)) {
    throw new ServiceError('status must be APPROVED or REJECTED', 400);
  }
};

const verifyRmCanAct = async (client, reimbursement, requestingUser) => {
  const result = await client.query(
    `
      SELECT id
      FROM employee_rm_assignments
      WHERE emp_id = $1
        AND rm_id = $2
    `,
    [reimbursement.user_id, requestingUser.id]
  );

  if (result.rowCount === 0) {
    throw new ServiceError('Forbidden', 403);
  }
};

const verifyRoleCanAct = async (client, reimbursement, requestingUser) => {
  if (requestingUser.role === ROLES.RM) {
    await verifyRmCanAct(client, reimbursement, requestingUser);
    return;
  }

  if (requestingUser.role === ROLES.APE) {
    if (!reimbursement.rm_approved) {
      throw new ServiceError('RM approval is required before APE approval', 400);
    }
    return;
  }

  if (requestingUser.role === ROLES.CFO) {
    return;
  }

  throw new ServiceError('Forbidden', 403);
};

const buildApprovalUpdate = ({ status, requestingUser, reimbursement }) => {
  if (status === STATUSES.REJECTED) {
    return {
      sql: `
        UPDATE reimbursements
        SET status = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, title, description, amount, status, rm_approved, ape_approved
      `,
      params: [STATUSES.REJECTED, reimbursement.id],
    };
  }

  if (requestingUser.role === ROLES.CFO) {
    return {
      sql: `
        UPDATE reimbursements
        SET rm_approved = true,
            ape_approved = true,
            status = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, title, description, amount, status, rm_approved, ape_approved
      `,
      params: [STATUSES.APPROVED, reimbursement.id],
    };
  }

  if (requestingUser.role === ROLES.RM) {
    const nextStatus = reimbursement.ape_approved ? STATUSES.APPROVED : reimbursement.status;

    return {
      sql: `
        UPDATE reimbursements
        SET rm_approved = true,
            status = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, title, description, amount, status, rm_approved, ape_approved
      `,
      params: [nextStatus, reimbursement.id],
    };
  }

  const nextStatus = reimbursement.rm_approved ? STATUSES.APPROVED : reimbursement.status;

  return {
    sql: `
      UPDATE reimbursements
      SET ape_approved = true,
          status = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, title, description, amount, status, rm_approved, ape_approved
    `,
    params: [nextStatus, reimbursement.id],
  };
};

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

const updateReimbursementStatus = async ({ reimbursementId, status, requestingUser }) => {
  validateApprovalRequest({ reimbursementId, status });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const reimbursementResult = await client.query(
      `
        SELECT id, user_id, title, description, amount, status, rm_approved, ape_approved
        FROM reimbursements
        WHERE id = $1
        FOR UPDATE
      `,
      [reimbursementId]
    );

    if (reimbursementResult.rowCount === 0) {
      throw new ServiceError('Reimbursement not found', 404);
    }

    const reimbursement = reimbursementResult.rows[0];

    if (reimbursement.status === STATUSES.REJECTED) {
      throw new ServiceError('Reimbursement is already rejected', 400);
    }

    if (reimbursement.status === STATUSES.APPROVED) {
      throw new ServiceError('Reimbursement is already fully approved', 400);
    }

    await verifyRoleCanAct(client, reimbursement, requestingUser);

    const update = buildApprovalUpdate({ status, requestingUser, reimbursement });
    const updatedResult = await client.query(update.sql, update.params);

    await client.query(
      `
        INSERT INTO reimbursement_approvals (
          reimbursement_id,
          approver_id,
          approver_role,
          action
        )
        VALUES ($1, $2, $3, $4)
      `,
      [reimbursement.id, requestingUser.id, requestingUser.role, status]
    );

    await client.query('COMMIT');

    return mapReimbursementResponse(updatedResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  ServiceError,
  createReimbursement,
  updateReimbursementStatus,
};
