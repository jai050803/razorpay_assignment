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

const findUserById = async (userId) => {
  const result = await pool.query(
    `
      SELECT id, name, email, role
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0];
};

const isPositiveInteger = (value) => {
  return Number.isInteger(Number(value)) && Number(value) > 0;
};

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

const assignEmployeeToRM = async ({ empUserId, rmUserId }) => {
  if (!empUserId) {
    throw new ServiceError('empUserId is required', 400);
  }

  if (!isPositiveInteger(empUserId)) {
    throw new ServiceError('empUserId must be a valid user ID', 400);
  }

  if (!rmUserId) {
    throw new ServiceError('rmUserId is required', 400);
  }

  if (!isPositiveInteger(rmUserId)) {
    throw new ServiceError('rmUserId must be a valid user ID', 400);
  }

  const empUser = await findUserById(empUserId);

  if (!empUser) {
    throw new ServiceError('Employee user not found', 404);
  }

  if (empUser.role !== ROLES.EMP) {
    throw new ServiceError('User must have EMP role', 400);
  }

  const rmUser = await findUserById(rmUserId);

  if (!rmUser) {
    throw new ServiceError('RM user not found', 404);
  }

  if (rmUser.role !== ROLES.RM) {
    throw new ServiceError('User must have RM role', 400);
  }

  const assignmentResult = await pool.query(
    'SELECT id FROM employee_rm_assignments WHERE emp_id = $1',
    [empUserId]
  );

  if (assignmentResult.rowCount > 0) {
    throw new ServiceError('Employee is already assigned to an RM', 409);
  }

  try {
    await pool.query(
      `
        INSERT INTO employee_rm_assignments (emp_id, rm_id)
        VALUES ($1, $2)
      `,
      [empUserId, rmUserId]
    );
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError('Employee is already assigned to an RM', 409);
    }

    throw error;
  }

  return { message: 'Employee assigned to RM successfully' };
};

const removeEmployeeFromRM = async ({ empUserId, rmUserId }) => {
  if (!empUserId) {
    throw new ServiceError('empUserId is required', 400);
  }

  if (!isPositiveInteger(empUserId)) {
    throw new ServiceError('empUserId must be a valid user ID', 400);
  }

  if (!rmUserId) {
    throw new ServiceError('rmUserId is required', 400);
  }

  if (!isPositiveInteger(rmUserId)) {
    throw new ServiceError('rmUserId must be a valid user ID', 400);
  }

  const assignmentResult = await pool.query(
    `
      SELECT id
      FROM employee_rm_assignments
      WHERE emp_id = $1
        AND rm_id = $2
    `,
    [empUserId, rmUserId]
  );

  if (assignmentResult.rowCount === 0) {
    throw new ServiceError('Assignment not found', 404);
  }

  await pool.query(
    `
      DELETE FROM employee_rm_assignments
      WHERE emp_id = $1
        AND rm_id = $2
    `,
    [empUserId, rmUserId]
  );

  return { message: 'Employee removed from RM successfully' };
};

module.exports = {
  ServiceError,
  listEmployees,
  assignEmployeeToRM,
  removeEmployeeFromRM,
};
