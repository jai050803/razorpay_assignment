const bcrypt = require('bcrypt');
const { pool } = require('../../config/db');
const { ROLES } = require('../../utils/constants');
const { isOrgEmail } = require('../../utils/validators');

class ServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const mapUserResponse = (user) => ({
  userId: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const validateRequiredFields = (fields) => {
  const missingField = Object.entries(fields).find(([, value]) => !value);

  if (missingField) {
    throw new ServiceError(`${missingField[0]} is required`, 400);
  }
};

const registerUser = async ({ name, email, password }) => {
  validateRequiredFields({ name, email, password });

  if (!isOrgEmail(email)) {
    throw new ServiceError('Email must be an @org.com address', 400);
  }

  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

  if (existingUser.rowCount > 0) {
    throw new ServiceError('Email is already taken', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role
    `,
    [name, email, hashedPassword, ROLES.EMP]
  );

  return mapUserResponse(result.rows[0]);
};

const loginUser = async ({ email, password }) => {
  validateRequiredFields({ email, password });

  if (!isOrgEmail(email)) {
    throw new ServiceError('Email must be an @org.com address', 400);
  }

  const result = await pool.query(
    `
      SELECT id, name, email, password, role
      FROM users
      WHERE email = $1
    `,
    [email]
  );

  if (result.rowCount === 0) {
    throw new ServiceError('Invalid email or password', 401);
  }

  const user = result.rows[0];
  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new ServiceError('Invalid email or password', 401);
  }

  return mapUserResponse(user);
};

module.exports = {
  ServiceError,
  registerUser,
  loginUser,
};
