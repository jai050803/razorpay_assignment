const jwt = require('jsonwebtoken');
const { registerUser, loginUser } = require('./onboarding.service');
const { successResponse, errorResponse } = require('../../utils/response');

const TOKEN_COOKIE_NAME = 'token';
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('JWT secret is not configured');
  }

  return secret;
};

const setAuthCookie = (res, userId) => {
  const token = jwt.sign({ userId }, getJwtSecret(), { expiresIn: '1d' });

  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  });
};

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message = error.statusCode ? error.message : 'Internal server error';

  return errorResponse(res, message, statusCode);
};

const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);
    setAuthCookie(res, user.userId);
    return successResponse(res, user, 201);
  } catch (error) {
    return handleError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const user = await loginUser(req.body);
    setAuthCookie(res, user.userId);
    return successResponse(res, user);
  } catch (error) {
    return handleError(res, error);
  }
};

const logout = (req, res) => {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  });

  return successResponse(res, { message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  logout,
};
