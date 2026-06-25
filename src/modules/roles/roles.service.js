const { pool } = require('../../config/db');
const { ROLES } = require('../../utils/constants');

class ServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const VALID_ROLES = Object.values(ROLES);

const mapUserResponse = (user) => ({
  userId: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const assignRole = async ({ userId, role }) => {
  if (!userId) {
    throw new ServiceError('userId is required', 400);
  }

  if (!role) {
    throw new ServiceError('role is required', 400);
  }

  if (!VALID_ROLES.includes(role)) {
    throw new ServiceError('Invalid role', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `
        SELECT id, name, email, role
        FROM users
        WHERE id = $1
        FOR UPDATE
      `,
      [userId]
    );

    if (userResult.rowCount === 0) {
      throw new ServiceError('User not found', 404);
    }

    const existingUser = userResult.rows[0];

    if (existingUser.role === ROLES.EMP && role !== ROLES.EMP) {
      await client.query('DELETE FROM employee_rm_assignments WHERE emp_id = $1', [userId]);
    }

    const updatedUserResult = await client.query(
      `
        UPDATE users
        SET role = $1
        WHERE id = $2
        RETURNING id, name, email, role
      `,
      [role, userId]
    );

    await client.query('COMMIT');

    return mapUserResponse(updatedUserResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  ServiceError,
  assignRole,
};
