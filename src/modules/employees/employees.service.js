const { pool } = require('../../config/db');
const { ROLES } = require('../../utils/constants');

class ServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const mapUsers = (users) =>
  users.map((user) => ({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }));

const listEmployees = async (requestingUser) => {
  if (!requestingUser || !requestingUser.role) {
    throw new ServiceError('Forbidden', 403);
  }

  if (requestingUser.role === ROLES.EMP) {
    throw new ServiceError('Forbidden', 403);
  }

  if (requestingUser.role === ROLES.RM) {
    const result = await pool.query(
      `
        SELECT users.id, users.name, users.email, users.role
        FROM users
        INNER JOIN employee_rm_assignments
          ON employee_rm_assignments.emp_id = users.id
        WHERE users.role = $1
          AND employee_rm_assignments.rm_id = $2
        ORDER BY users.name ASC
      `,
      [ROLES.EMP, requestingUser.id]
    );

    return mapUsers(result.rows);
  }

  if (requestingUser.role === ROLES.APE) {
    const result = await pool.query(
      `
        SELECT id, name, email, role
        FROM users
        WHERE role IN ($1, $2)
        ORDER BY name ASC
      `,
      [ROLES.EMP, ROLES.RM]
    );

    return mapUsers(result.rows);
  }

  if (requestingUser.role === ROLES.CFO) {
    const result = await pool.query(
      `
        SELECT id, name, email, role
        FROM users
        WHERE id != $1
        ORDER BY name ASC
      `,
      [requestingUser.id]
    );

    return mapUsers(result.rows);
  }

  throw new ServiceError('Forbidden', 403);
};

module.exports = {
  ServiceError,
  listEmployees,
};
