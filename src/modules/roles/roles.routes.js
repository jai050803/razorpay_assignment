const express = require('express');
const rolesController = require('./roles.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { ROLES } = require('../../utils/constants');

const router = express.Router();

router.post('/assign', requireAuth, requireRole(ROLES.CFO), rolesController.assignRole);

module.exports = router;
