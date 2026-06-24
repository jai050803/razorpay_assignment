const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { errorResponse } = require('../utils/response');

const TOKEN_COOKIE_NAME = 'token';
const JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret';

const clearAuthCookie = (res) => {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  });
};

const requireAuth = async (req, res, next) => {
  const token = req.cookies && req.cookies[TOKEN_COOKIE_NAME];

  if (!token) {
    return errorResponse(res, 'Unauthorized', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      clearAuthCookie(res);
      return errorResponse(res, 'Unauthorized', 401);
    }

    const result = await pool.query(
      `
        SELECT id, name, email, role, created_at
        FROM users
        WHERE id = $1
      `,
      [userId]
    );

    if (result.rowCount === 0) {
      clearAuthCookie(res);
      return errorResponse(res, 'Unauthorized', 401);
    }

    req.user = result.rows[0];
    return next();
  } catch (error) {
    clearAuthCookie(res);
    return errorResponse(res, 'Unauthorized', 401);
  }
};

module.exports = {
  requireAuth,
};
